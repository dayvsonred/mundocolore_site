#!/usr/bin/env python3
"""Deploy versioned DynamoDB infrastructure, Go Lambdas, and Angular frontend."""

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
PROJECT_DIR = BACKEND_DIR.parent
DYNAMODB_DIR = BACKEND_DIR / "dynamoDB"
FRONTEND_DIR = PROJECT_DIR / "site"
FRONTEND_INFRA_DIR = PROJECT_DIR / "infra" / "terraform"
JWT_FILE_PATH = BACKEND_DIR / ".jwt"
GOOGLE_CREDENTIALS_PATH = BACKEND_DIR / ".google_key"
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


@dataclass(frozen=True)
class VersionedStage:
    name: str
    root: Path
    infra: Path
    local_version_path: Path
    deployed_version_path: Path
    local_version: str
    deployed_version: str


def load_versioned_stage(
    name: str,
    root: Path,
    infra: Path,
    local_version_path: Path,
    deployed_version_path: Path,
) -> VersionedStage:
    return VersionedStage(
        name=name,
        root=root,
        infra=infra,
        local_version_path=local_version_path,
        deployed_version_path=deployed_version_path,
        local_version=read_version(local_version_path),
        deployed_version=read_version(deployed_version_path),
    )


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


def resolve_command(command: list[str]) -> list[str]:
    if not command:
        raise ValueError("Comando vazio.")
    executable = shutil.which(command[0])
    if executable is None:
        return command
    return [executable, *command[1:]]


def run_command(
    command: list[str],
    cwd: Path,
    *,
    env: dict[str, str],
    dry_run: bool,
) -> None:
    print(f"  > {format_command(command)}")
    if not dry_run:
        subprocess.run(resolve_command(command), cwd=cwd, env=env, check=True)


def ensure_tools(required_tools: Iterable[str]) -> None:
    missing = [tool for tool in required_tools if shutil.which(tool) is None]
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


def load_google_client_id(path: Path = GOOGLE_CREDENTIALS_PATH) -> str:
    if not path.is_file():
        raise FileNotFoundError(
            f"Arquivo Google nao encontrado: {path}. "
            "Baixe as credenciais do cliente OAuth Web e salve nesse caminho."
        )
    try:
        credentials = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"{path} deve conter um JSON valido.") from error

    web = credentials.get("web")
    if not isinstance(web, dict):
        raise ValueError(f"{path} deve conter o objeto web.")

    client_id = str(web.get("client_id", "")).strip()
    if not client_id.endswith(".apps.googleusercontent.com"):
        raise ValueError(f"{path} deve conter web.client_id valido.")
    return client_id


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


def deploy_terraform_directory(
    label: str,
    infra: Path,
    *,
    env: dict[str, str],
    dry_run: bool,
    extra_args: Iterable[str] = (),
) -> None:
    print(f"[{label}] Terraform init, plan e apply")
    plan_path = infra / PLAN_FILE_NAME
    terraform_extra_args = list(extra_args)

    try:
        run_command(
            ["terraform", "init", "-input=false"],
            infra,
            env=env,
            dry_run=dry_run,
        )
        run_command(
            [
                "terraform",
                "plan",
                "-input=false",
                f"-out={PLAN_FILE_NAME}",
                *terraform_extra_args,
            ],
            infra,
            env=env,
            dry_run=dry_run,
        )
        run_command(
            ["terraform", "apply", "-input=false", PLAN_FILE_NAME],
            infra,
            env=env,
            dry_run=dry_run,
        )
    finally:
        if not dry_run and plan_path.exists():
            plan_path.unlink()


def deploy_terraform(module: LambdaModule, *, env: dict[str, str], dry_run: bool) -> None:
    deploy_terraform_directory(
        module.name,
        module.infra,
        env=env,
        dry_run=dry_run,
        extra_args=terraform_args(module),
    )


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


def is_stage_pending(stage: VersionedStage) -> bool:
    local = parse_version(stage.local_version, stage.local_version_path)
    deployed = parse_version(stage.deployed_version, stage.deployed_version_path)
    if local < deployed:
        raise ValueError(
            f"{stage.name}: version_local ({stage.local_version}) nao pode ser menor "
            f"que version_update ({stage.deployed_version})"
        )
    if local == deployed:
        print(f"[{stage.name}] Ignorada: versao {stage.local_version} ja publicada.")
        return False
    return True


def mark_stage_as_deployed(stage: VersionedStage, *, dry_run: bool) -> None:
    print(
        f"[{stage.name}] version_update: "
        f"{stage.deployed_version} -> {stage.local_version}"
    )
    if not dry_run:
        stage.deployed_version_path.write_text(
            f"{stage.local_version}\n",
            encoding="utf-8",
        )


def deploy_dynamodb(
    stage: VersionedStage,
    *,
    env: dict[str, str],
    dry_run: bool,
) -> None:
    print(f"\n[dynamodb] Deploy de infraestrutura {stage.local_version}")
    deploy_terraform_directory(
        stage.name,
        stage.infra,
        env=env,
        dry_run=dry_run,
    )
    mark_stage_as_deployed(stage, dry_run=dry_run)


def terraform_output(
    output_name: str,
    infra: Path,
    *,
    env: dict[str, str],
    dry_run: bool,
) -> str:
    command = ["terraform", "output", "-raw", output_name]
    print(f"  > {format_command(command)}")
    if dry_run:
        return f"<{output_name}>"
    result = subprocess.run(
        resolve_command(command),
        cwd=infra,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def deploy_frontend(
    stage: VersionedStage,
    *,
    env: dict[str, str],
    dry_run: bool,
) -> None:
    print(f"\n[frontend] Build Angular PRD {stage.local_version}")
    run_command(["npm", "ci"], stage.root, env=env, dry_run=dry_run)
    run_command(
        ["npm", "run", "build", "--", "--configuration", "production"],
        stage.root,
        env=env,
        dry_run=dry_run,
    )
    deploy_terraform_directory(
        stage.name,
        stage.infra,
        env=env,
        dry_run=dry_run,
        extra_args=(
            "-var=environment=prod",
            "-var=upload_build_files=true",
        ),
    )

    distribution_id = terraform_output(
        "cloudfront_distribution_id",
        stage.infra,
        env=env,
        dry_run=dry_run,
    )
    if not distribution_id:
        raise RuntimeError("Terraform nao retornou cloudfront_distribution_id.")
    run_command(
        [
            "aws",
            "cloudfront",
            "create-invalidation",
            "--distribution-id",
            distribution_id,
            "--paths",
            "/*",
        ],
        stage.infra,
        env=env,
        dry_run=dry_run,
    )
    mark_stage_as_deployed(stage, dry_run=dry_run)


def deployment_order(module: LambdaModule) -> tuple[int, str]:
    if module.name == "send_email":
        return (0, module.name)
    return (1, module.name)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Publica DynamoDB, Lambdas Go e frontend quando version_local "
            "e superior a version_update."
        )
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
        dynamodb_stage = load_versioned_stage(
            "dynamodb",
            DYNAMODB_DIR,
            DYNAMODB_DIR,
            DYNAMODB_DIR / "version_local",
            DYNAMODB_DIR / "version_update",
        )
        frontend_stage = load_versioned_stage(
            "frontend",
            FRONTEND_DIR,
            FRONTEND_INFRA_DIR,
            FRONTEND_DIR / "version_local",
            FRONTEND_DIR / "version_update",
        )
        modules = discover_modules(selected_names)
        pending_lambdas = pending_modules(modules)
        pending_lambdas.sort(key=deployment_order)
        dynamodb_pending = is_stage_pending(dynamodb_stage)
        frontend_pending = is_stage_pending(frontend_stage)

        if not dynamodb_pending and not pending_lambdas and not frontend_pending:
            print(
                "\nNenhum componente possui version_local superior a version_update."
            )
            return 0

        required_tools = {"terraform"}
        if pending_lambdas:
            required_tools.add("go")
        if frontend_pending:
            required_tools.update({"npm", "aws"})
        if not args.dry_run:
            ensure_tools(sorted(required_tools))

        env = os.environ.copy()
        env["AWS_PROFILE"] = args.profile
        if pending_lambdas:
            env["TF_VAR_jwt_secret"] = load_jwt_secret()
        google_client_id = (
            load_google_client_id()
            if any(module.name == "login" for module in pending_lambdas)
            else ""
        )
        failures: list[str] = []
        pending_labels = []
        if dynamodb_pending:
            pending_labels.append("dynamodb")
        pending_labels.extend(module.name for module in pending_lambdas)
        if frontend_pending:
            pending_labels.append("frontend")
        print(
            f"\nEtapas pendentes: {', '.join(pending_labels)}"
            f"\nAWS_PROFILE: {args.profile}"
            + (
                f"\nJWT_SECRET: carregado de {JWT_FILE_PATH.name}"
                if pending_lambdas
                else ""
            )
            + (
                f"\nGOOGLE_CLIENT_ID: carregado de {GOOGLE_CREDENTIALS_PATH.name}"
                if google_client_id
                else ""
            )
        )

        successful: list[str] = []

        if dynamodb_pending:
            try:
                deploy_dynamodb(
                    dynamodb_stage,
                    env=env.copy(),
                    dry_run=args.dry_run,
                )
                successful.append(dynamodb_stage.name)
            except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
                failures.append(dynamodb_stage.name)
                detail = (
                    f"codigo {error.returncode}"
                    if isinstance(error, subprocess.CalledProcessError)
                    else str(error)
                )
                print(
                    f"\n[dynamodb] Falha no deploy ({detail}). "
                    "version_update nao foi alterado.",
                    file=sys.stderr,
                )
                if not args.continue_on_error:
                    pending_lambdas = []
                    frontend_pending = False

        for module in pending_lambdas:
            try:
                module_env = env.copy()
                if module.name == "login":
                    module_env["TF_VAR_google_client_id"] = google_client_id
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
                    frontend_pending = False
                    break

        if frontend_pending:
            try:
                deploy_frontend(
                    frontend_stage,
                    env=env.copy(),
                    dry_run=args.dry_run,
                )
                successful.append(frontend_stage.name)
            except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
                failures.append(frontend_stage.name)
                detail = (
                    f"codigo {error.returncode}"
                    if isinstance(error, subprocess.CalledProcessError)
                    else str(error)
                )
                print(
                    f"\n[frontend] Falha no deploy ({detail}). "
                    "version_update nao foi alterado.",
                    file=sys.stderr,
                )

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

        message = (
            "SIMULACAO CONCLUIDA COM SUCESSO"
            if args.dry_run
            else "DEPLOY CONCLUIDO COM SUCESSO"
        )
        print(f"\n{message}. Total de componentes: {len(successful)}")
        return 0
    except (FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"Erro: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
