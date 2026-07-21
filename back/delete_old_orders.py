#!/usr/bin/env python3
"""Remove pedidos antigos e suas referencias das tabelas DynamoDB Mundo Colore.

O script apenas mostra o plano por padrao. A exclusao e atomica e exige
``--execute --confirm DELETE-OLD-ORDERS``. Antes da exclusao real, todos os
itens afetados sao copiados para ``back/backups`` no formato DynamoDB JSON.
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterable

import boto3
from boto3.dynamodb.types import TypeSerializer


DEFAULT_PROFILE = "mundocolore"
DEFAULT_REGION = "sa-east-1"
DEFAULT_PREFIX = "mundocolore-"
CONFIRMATION = "DELETE-OLD-ORDERS"
SCRIPT_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class DeleteAction:
    table: str
    key: dict[str, Any]
    item: dict[str, Any]


@dataclass(frozen=True)
class PutAction:
    table: str
    key: dict[str, Any]
    original_item: dict[str, Any]
    updated_item: dict[str, Any]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Apaga pedidos selecionados e suas referencias em todas as tabelas "
            "DynamoDB cujo nome comeca com mundocolore-."
        )
    )
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument(
        "--all-orders",
        action="store_true",
        help="Seleciona todos os pedidos, exceto registros de health check.",
    )
    selection.add_argument(
        "--before",
        metavar="ISO_DATE",
        help="Seleciona pedidos criados antes da data/hora ISO informada.",
    )
    selection.add_argument(
        "--order-id",
        action="append",
        dest="order_ids",
        help="Seleciona um pedido pelo ID. Pode ser repetido.",
    )
    parser.add_argument("--profile", default=DEFAULT_PROFILE, help="Perfil AWS.")
    parser.add_argument("--region", default=DEFAULT_REGION, help="Regiao AWS.")
    parser.add_argument(
        "--table-prefix",
        default=DEFAULT_PREFIX,
        help="Prefixo das tabelas que serao verificadas.",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Executa a exclusao. Sem esta opcao, somente mostra o plano.",
    )
    parser.add_argument(
        "--confirm",
        help=f"Confirmacao obrigatoria no modo execute: {CONFIRMATION}",
    )
    return parser.parse_args()


def parse_iso_datetime(value: str) -> datetime:
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    parsed = datetime.fromisoformat(normalized)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def scan_all(table: Any) -> Iterable[dict[str, Any]]:
    start_key: dict[str, Any] | None = None
    while True:
        request: dict[str, Any] = {}
        if start_key:
            request["ExclusiveStartKey"] = start_key
        response = table.scan(**request)
        yield from response.get("Items", [])
        start_key = response.get("LastEvaluatedKey")
        if not start_key:
            return


def table_names(client: Any, prefix: str) -> list[str]:
    names: list[str] = []
    paginator = client.get_paginator("list_tables")
    for page in paginator.paginate():
        names.extend(name for name in page.get("TableNames", []) if name.startswith(prefix))
    return sorted(names)


def item_key(table: Any, item: dict[str, Any]) -> dict[str, Any]:
    table.load()
    return {part["AttributeName"]: item[part["AttributeName"]] for part in table.key_schema}


def is_order(item: dict[str, Any]) -> bool:
    return bool(item.get("id")) and item.get("status") != "health" and "health_key" not in item


def select_orders(items: list[dict[str, Any]], args: argparse.Namespace) -> list[dict[str, Any]]:
    orders = [item for item in items if is_order(item)]
    if args.all_orders:
        return orders
    if args.order_ids:
        requested = set(args.order_ids)
        selected = [item for item in orders if str(item.get("id")) in requested]
        missing = sorted(requested - {str(item.get("id")) for item in selected})
        if missing:
            raise ValueError(f"Pedido(s) nao encontrado(s): {', '.join(missing)}")
        return selected

    cutoff = parse_iso_datetime(args.before)
    selected: list[dict[str, Any]] = []
    for item in orders:
        created_at = str(item.get("created_at", "")).strip()
        if not created_at:
            continue
        if parse_iso_datetime(created_at) < cutoff:
            selected.append(item)
    return selected


def contains_order_reference(value: Any, order_ids: set[str]) -> bool:
    if isinstance(value, str):
        return any(order_id in value for order_id in order_ids)
    if isinstance(value, dict):
        return any(contains_order_reference(item, order_ids) for item in value.values())
    if isinstance(value, (list, tuple, set)):
        return any(contains_order_reference(item, order_ids) for item in value)
    return False


def money(value: Any) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def credit_release_amount(order: dict[str, Any], installments: list[dict[str, Any]]) -> Decimal:
    payment = order.get("payment") or {}
    if payment.get("method") != "credit_colore":
        return Decimal("0.00")
    if str(order.get("status", "")).lower() in {"cancelled", "canceled", "cancelado"}:
        return Decimal("0.00")

    paid = Decimal("0.00")
    for installment in installments:
        if str(installment.get("status", "")).lower() not in {"paga", "paid", "pago"}:
            continue
        paid_value = installment.get("paid_amount")
        paid += money(paid_value if paid_value is not None else installment.get("amount"))
    return max(Decimal("0.00"), money(order.get("total")) - paid)


def build_credit_updates(
    credit_table: Any,
    orders: list[dict[str, Any]],
    order_ids: set[str],
) -> list[PutAction]:
    orders_by_user: dict[str, list[dict[str, Any]]] = {}
    for order in orders:
        if (order.get("payment") or {}).get("method") == "credit_colore":
            orders_by_user.setdefault(str(order.get("user_id")), []).append(order)

    updates: list[PutAction] = []
    found_users: set[str] = set()
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    for original in scan_all(credit_table):
        user_id = str(original.get("user_id", ""))
        user_orders = orders_by_user.get(user_id)
        installments = list(original.get("installments") or [])
        matching_installments = [
            installment
            for installment in installments
            if str(installment.get("order_id")) in order_ids
        ]
        if not user_orders and not matching_installments:
            continue

        found_users.add(user_id)
        updated = dict(original)
        updated["installments"] = [
            installment
            for installment in installments
            if str(installment.get("order_id")) not in order_ids
        ]
        release = sum(
            (
                credit_release_amount(
                    order,
                    [
                        installment
                        for installment in matching_installments
                        if str(installment.get("order_id")) == str(order.get("id"))
                    ],
                )
                for order in user_orders or []
            ),
            Decimal("0.00"),
        )
        updated["used_credit"] = max(Decimal("0.00"), money(original.get("used_credit")) - release)
        updated["updated_at"] = now
        if contains_order_reference(updated, order_ids):
            raise RuntimeError(
                f"A referencia de pedido em {credit_table.name}/{user_id} nao esta em installments."
            )
        updates.append(
            PutAction(
                table=credit_table.name,
                key=item_key(credit_table, original),
                original_item=original,
                updated_item=updated,
            )
        )

    missing_users = sorted(set(orders_by_user) - found_users)
    if missing_users:
        raise RuntimeError(
            "Credito Colore nao encontrado para usuario(s) de pedidos selecionados: "
            + ", ".join(missing_users)
        )
    return updates


def dynamodb_map(serializer: TypeSerializer, value: dict[str, Any]) -> dict[str, Any]:
    return {key: serializer.serialize(item) for key, item in value.items()}


def write_backup(
    deletes: list[DeleteAction],
    puts: list[PutAction],
    serializer: TypeSerializer,
) -> Path:
    backup_dir = SCRIPT_DIR / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = backup_dir / f"delete_old_orders_{timestamp}.json"
    content = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "deleted_items": [
            {"table": action.table, "item": dynamodb_map(serializer, action.item)}
            for action in deletes
        ],
        "updated_items_before": [
            {"table": action.table, "item": dynamodb_map(serializer, action.original_item)}
            for action in puts
        ],
    }
    path.write_text(json.dumps(content, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def main() -> int:
    args = parse_args()
    if args.execute and args.confirm != CONFIRMATION:
        print(f"Erro: use --confirm {CONFIRMATION} para executar.", file=sys.stderr)
        return 2

    session = boto3.Session(profile_name=args.profile, region_name=args.region)
    resource = session.resource("dynamodb")
    client = session.client("dynamodb")
    orders_table_name = f"{args.table_prefix}orders"
    credit_table_name = f"{args.table_prefix}credit"
    tables = table_names(client, args.table_prefix)
    for required in (orders_table_name, credit_table_name):
        if required not in tables:
            raise RuntimeError(f"Tabela obrigatoria nao encontrada: {required}")

    orders_table = resource.Table(orders_table_name)
    orders = select_orders(list(scan_all(orders_table)), args)
    if not orders:
        print("Nenhum pedido corresponde aos criterios informados.")
        return 0
    order_ids = {str(order["id"]) for order in orders}

    deletes = [
        DeleteAction(orders_table_name, item_key(orders_table, order), order)
        for order in orders
    ]
    puts = build_credit_updates(resource.Table(credit_table_name), orders, order_ids)

    reference_counts: dict[str, int] = {}
    for table_name in tables:
        if table_name in {orders_table_name, credit_table_name}:
            continue
        table = resource.Table(table_name)
        for item in scan_all(table):
            if not contains_order_reference(item, order_ids):
                continue
            deletes.append(DeleteAction(table_name, item_key(table, item), item))
            reference_counts[table_name] = reference_counts.get(table_name, 0) + 1

    transaction_size = len(deletes) + len(puts)
    if transaction_size > 100:
        raise RuntimeError(
            f"A limpeza exige {transaction_size} operacoes; o limite atomico do DynamoDB e 100. "
            "Selecione menos pedidos com --before ou --order-id."
        )

    print(f"\nPedidos selecionados: {len(orders)}")
    for order in sorted(orders, key=lambda item: str(item.get("created_at", ""))):
        print(
            f"  - {order['id']} | {order.get('created_at', '-')} | "
            f"{order.get('status', '-')} | R$ {money(order.get('total'))}"
        )
    print("\nReferencias que serao removidas:")
    print(f"  - {orders_table_name}: {len(orders)} pedido(s)")
    for table_name, count in sorted(reference_counts.items()):
        print(f"  - {table_name}: {count} item(ns) relacionado(s)")
    for action in puts:
        removed = len(action.original_item.get("installments") or []) - len(
            action.updated_item.get("installments") or []
        )
        old_used = money(action.original_item.get("used_credit"))
        new_used = money(action.updated_item.get("used_credit"))
        print(
            f"  - {action.table}: usuario {action.key.get('user_id')} | "
            f"{removed} parcela(s) | credito usado R$ {old_used} -> R$ {new_used}"
        )

    if not args.execute:
        print("\nSIMULACAO: nenhum dado foi alterado.")
        print(f"Para executar, acrescente: --execute --confirm {CONFIRMATION}")
        return 0

    serializer = TypeSerializer()
    backup_path = write_backup(deletes, puts, serializer)
    transaction: list[dict[str, Any]] = []
    for action in deletes:
        transaction.append(
            {
                "Delete": {
                    "TableName": action.table,
                    "Key": dynamodb_map(serializer, action.key),
                }
            }
        )
    for action in puts:
        transaction.append(
            {
                "Put": {
                    "TableName": action.table,
                    "Item": dynamodb_map(serializer, action.updated_item),
                }
            }
        )
    client.transact_write_items(
        TransactItems=transaction,
        ClientRequestToken=str(uuid.uuid4()),
    )
    print(f"\nBackup criado em: {backup_path}")
    print("LIMPEZA CONCLUIDA COM SUCESSO.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        raise SystemExit(1) from error
