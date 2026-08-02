import tempfile
import unittest
from pathlib import Path

import deploy_lambdas


class VersionedStageTests(unittest.TestCase):
    def create_stage(
        self,
        directory: Path,
        local_version: str,
        deployed_version: str,
    ) -> deploy_lambdas.VersionedStage:
        local_path = directory / "version_local"
        deployed_path = directory / "version_update"
        local_path.write_text(f"{local_version}\n", encoding="utf-8")
        deployed_path.write_text(f"{deployed_version}\n", encoding="utf-8")
        return deploy_lambdas.load_versioned_stage(
            "test-stage",
            directory,
            directory,
            local_path,
            deployed_path,
        )

    def test_stage_is_pending_when_local_is_greater(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            stage = self.create_stage(
                Path(temporary_directory),
                "1.1.0",
                "1.0.9",
            )
            self.assertTrue(deploy_lambdas.is_stage_pending(stage))

    def test_stage_is_not_pending_when_versions_match(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            stage = self.create_stage(
                Path(temporary_directory),
                "1.0.0",
                "1.0.0",
            )
            self.assertFalse(deploy_lambdas.is_stage_pending(stage))

    def test_stage_rejects_local_version_lower_than_deployed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            stage = self.create_stage(
                Path(temporary_directory),
                "1.0.0",
                "1.0.1",
            )
            with self.assertRaises(ValueError):
                deploy_lambdas.is_stage_pending(stage)

    def test_dry_run_does_not_update_deployed_version(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            stage = self.create_stage(directory, "2.0.0", "1.0.0")
            deploy_lambdas.mark_stage_as_deployed(stage, dry_run=True)
            self.assertEqual(
                stage.deployed_version_path.read_text(encoding="utf-8").strip(),
                "1.0.0",
            )

    def test_success_updates_deployed_version(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            stage = self.create_stage(directory, "2.0.0", "1.0.0")
            deploy_lambdas.mark_stage_as_deployed(stage, dry_run=False)
            self.assertEqual(
                stage.deployed_version_path.read_text(encoding="utf-8").strip(),
                "2.0.0",
            )

    def test_resolve_command_finds_npm_executable(self) -> None:
        resolved = deploy_lambdas.resolve_command(["npm", "--version"])
        self.assertTrue(Path(resolved[0]).is_file())
        self.assertEqual(resolved[1:], ["--version"])


if __name__ == "__main__":
    unittest.main()
