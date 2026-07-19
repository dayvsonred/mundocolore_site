#!/usr/bin/env python3
"""Build and deploy versioned Go Lambdas from the backend directory."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


BACKEND_DIR = Path(__file__).resolve().parent
JWT_FILE_PATH = BACKEND_DIR / ".jwt"
MAILJET_CREDENTIAL_PATHS = {
    "send_email": BACKEND_DIR / ".mailjet_api_key",
    "email_inbound": BACKEND_DIR / ".mailjet_api_key",
}
VERSION_PATTERN = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")
PLAN_FILE_NAME = ".deploy.tfplan"
CONTACT_TERRAFORM_ARGS = (
    "-var=aws_region=us-east-1",
    "-var=dynamodb_table=core",
    "-var=lambda_zip=../lambda.zip",
)
@dataclass(frozen=True)
class LambdaModule:
    name: str
    root: Path
    infra: Path
    local_version: str
    deployed_version: str


def parse_version(value: str, path: Path) -> tuple[int, int, int]:
    match = VERSION_PATTERN.fullmatch(value.strip())
    if not match:
        raise ValueError(
            f"{path} deve conter uma versao no formato MAJOR.MINOR.PATCH, exemplo: 1.0.1"
        )
    return tuple(int(part) for part in match.groups())


def read_version(path: Path) -> str:
    if not path.is_file():
        raise FileNotFoundError(f"Arquivo de versao nao encontrado: {path}")
    value = path.read_text(encoding="utf-8").strip()
    parse_version(value, path)
    return value


def discover_modules(selected_names: set[str] | None = None) -> list[LambdaModule]:
    modules: list[LambdaModule] = []
    for root in sorted(path for path in BACKEND_DIR.iterdir() if path.is_dir()):
        infra = root / "infra"
        if not all(
            (
                (root / "go.mod").is_file(),
                (root / "main.go").is_file(),
                (infra / "main.tf").is_file(),
            )
        ):
            continue
        if selected_names and root.name not in selected_names:
            continue
        modules.append(
            LambdaModule(
                name=root.name,
                root=root,
                infra=infra,
                local_version=read_version(infra / "version_local"),
                deployed_version=read_version(infra / "version_update"),
            )
        )

    if selected_names:
        found = {module.name for module in modules}
        missing = sorted(selected_names - found)
        if missing:
            raise ValueError(f"Lambda(s) nao encontrada(s): {', '.join(missing)}")
    return modules


def format_command(command: Iterable[str]) -> str:
    return " ".join(f'"{part}"' if " " in part else part for part in command)


def run_command(
    command: list[str],
    cwd: Path,
    *,
    env: dict[str, str],
    dry_run: bool,
) -> None:
    print(f"  > {format_command(command)}")
    if not dry_run:
        subprocess.run(command, cwd=cwd, env=env, check=True)


def ensure_tools() -> None:
    missing = [tool for tool in ("go", "terraform") if shutil.which(tool) is None]
    if missing:
        raise RuntimeError(f"Ferramenta(s) nao encontrada(s) no PATH: {', '.join(missing)}")


def load_jwt_secret(path: Path = JWT_FILE_PATH) -> str:
    if not path.is_file():
        raise FileNotFoundError(
            f"Arquivo JWT nao encontrado: {path}. Crie o arquivo com um segredo forte."
        )
    secret = path.read_text(encoding="utf-8").strip()
    if len(secret) < 32:
        raise ValueError(f"{path} deve conter um segredo JWT com pelo menos 32 caracteres.")
    return secret


def load_mailjet_credentials(path: Path) -> tuple[str, str]:
    if not path.is_file():
        raise FileNotFoundError(
            f"Arquivo Mailjet nao encontrado: {path}. Crie o arquivo JSON com api_key e secret_key."
        )
    try:
        credentials = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} deve conter um JSON valido.") from error

    api_key = str(credentials.get("api_key", "")).strip()
    secret_key = str(credentials.get("secret_key", "")).strip()
    if not api_key or not secret_key:
        raise ValueError(f"{path} deve conter api_key e secret_key.")
    return api_key, secret_key


def terraform_args(module: LambdaModule) -> list[str]:
    return list(CONTACT_TERRAFORM_ARGS) if module.name == "contact" else []


def build_lambda(module: LambdaModule, *, env: dict[str, str], dry_run: bool) -> None:
    print(f"\n[{module.name}] Build Go {module.local_version}")
    run_command(["go", "mod", "tidy"], module.root, env=env, dry_run=dry_run)

    build_env = env.copy()
    build_env.update({"GOOS": "linux", "GOARCH": "amd64", "CGO_ENABLED": "0"})
    run_command(
        ["go", "build", "-o", "bootstrap", "."],
        module.root,
        env=build_env,
        dry_run=dry_run,
    )

    zip_path = module.root / "lambda.zip"
    bootstrap_path = module.root / "bootstrap"
    print(f"  > gerar {zip_path.name} com bootstrap")
    if not dry_run:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
            zip_info = zipfile.ZipInfo("bootstrap")
            zip_info.create_system = 3
            zip_info.external_attr = (stat.S_IFREG | 0o755) << 16
            zip_info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(zip_info, bootstrap_path.read_bytes())


def deploy_terraform(module: LambdaModule, *, env: dict[str, str], dry_run: bool) -> None:
    print(f"[{module.name}] Terraform init, plan e apply")
    plan_path = module.infra / PLAN_FILE_NAME
    extra_args = terraform_args(module)

    try:
        run_command(
            ["terraform", "init", "-input=false"],
            module.infra,
            env=env,
            dry_run=dry_run,
        )
        run_command(
            [
                "terraform",
                "plan",
                "-input=false",
                f"-out={PLAN_FILE_NAME}",
                *extra_args,
            ],
            module.infra,
            env=env,
            dry_run=dry_run,
        )
        run_command(
            ["terraform", "apply", "-input=false", PLAN_FILE_NAME],
            module.infra,
            env=env,
            dry_run=dry_run,
        )
    finally:
        if not dry_run and plan_path.exists():
            plan_path.unlink()


def mark_as_deployed(module: LambdaModule, *, dry_run: bool) -> None:
    version_update_path = module.infra / "version_update"
    print(f"[{module.name}] version_update: {module.deployed_version} -> {module.local_version}")
    if not dry_run:
        version_update_path.write_text(f"{module.local_version}\n", encoding="utf-8")


def deploy_module(module: LambdaModule, *, env: dict[str, str], dry_run: bool) -> None:
    build_lambda(module, env=env, dry_run=dry_run)
    deploy_terraform(module, env=env, dry_run=dry_run)
    mark_as_deployed(module, dry_run=dry_run)


def pending_modules(modules: list[LambdaModule]) -> list[LambdaModule]:
    pending: list[LambdaModule] = []
    for module in modules:
        local = parse_version(module.local_version, module.infra / "version_local")
        deployed = parse_version(module.deployed_version, module.infra / "version_update")
        if local < deployed:
            raise ValueError(
                f"{module.name}: version_local ({module.local_version}) nao pode ser menor "
                f"que version_update ({module.deployed_version})"
            )
        if local > deployed:
            pending.append(module)
        else:
            print(f"[{module.name}] Ignorada: versao {module.local_version} ja publicada.")
    return pending


def deployment_order(module: LambdaModule) -> tuple[int, str]:
    if module.name == "send_email":
        return (0, module.name)
    return (1, module.name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compila e publica Lambdas Go cuja version_local e superior a version_update."
    )
    parser.add_argument(
        "--lambda",
        dest="lambdas",
        action="append",
        help="Processa somente a Lambda informada. Pode ser usado mais de uma vez.",
    )
    parser.add_argument(
        "--profile",
        default="mundocolore",
        help="AWS_PROFILE usado pelo Terraform. Padrao: mundocolore.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostra os comandos e Lambdas pendentes sem executar build ou deploy.",
    )
    parser.add_argument(
        "--continue-on-error",
        action="store_true",
        help="Continua com as proximas Lambdas quando uma publicacao falhar.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected_names = set(args.lambdas) if args.lambdas else None

    try:
        modules = discover_modules(selected_names)
        pending = pending_modules(modules)
        pending.sort(key=deployment_order)
        if not pending:
            print("\nNenhuma Lambda possui version_local superior a version_update.")
            return 0

        if not args.dry_run:
            ensure_tools()

        env = os.environ.copy()
        env["AWS_PROFILE"] = args.profile
        env["TF_VAR_jwt_secret"] = load_jwt_secret()
        failures: list[str] = []
        print(
            f"\nLambdas pendentes: {', '.join(module.name for module in pending)}"
            f"\nAWS_PROFILE: {args.profile}"
            f"\nJWT_SECRET: carregado de {JWT_FILE_PATH.name}"
        )

        successful: list[str] = []
        for module in pending:
            try:
                module_env = env.copy()
                credentials_path = MAILJET_CREDENTIAL_PATHS.get(module.name)
                if credentials_path is not None:
                    mailjet_api_key, mailjet_secret_key = load_mailjet_credentials(
                        credentials_path
                    )
                    module_env["TF_VAR_mailjet_api_key"] = mailjet_api_key
                    module_env["TF_VAR_mailjet_secret_key"] = mailjet_secret_key
                deploy_module(module, env=module_env, dry_run=args.dry_run)
                successful.append(module.name)
            except (OSError, subprocess.CalledProcessError) as error:
                failures.append(module.name)
                detail = (
                    f"codigo {error.returncode}"
                    if isinstance(error, subprocess.CalledProcessError)
                    else str(error)
                )
                print(
                    f"\n[{module.name}] Falha no deploy ({detail}). "
                    "version_update nao foi alterado.",
                    file=sys.stderr,
                )
                if not args.continue_on_error:
                    break

        if successful:
            action = "Simuladas com sucesso" if args.dry_run else "Publicadas com sucesso"
            print(f"\n{action}:")
            for name in successful:
                print(f"  - {name}")

        if failures:
            print("\nFalha no deploy:", file=sys.stderr)
            for name in failures:
                print(f"  - {name}", file=sys.stderr)
            return 1

        message = "SIMULACAO CONCLUIDA COM SUCESSO" if args.dry_run else "DEPLOY CONCLUIDO COM SUCESSO"
        print(f"\n{message}. Total de Lambdas: {len(successful)}")
        return 0
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
