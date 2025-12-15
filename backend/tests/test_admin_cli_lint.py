import json
from pathlib import Path

from bhriguwelt import bhrigu_data
from bhriguwelt import admin_cli


def test_lint_command_accepts_json(tmp_path, capsys):
    dataset = bhrigu_data.as_dict()
    path = tmp_path / "dataset.json"
    path.write_text(json.dumps(dataset))

    exit_code = admin_cli.main(["lint", "--path", str(path)])
    captured = capsys.readouterr()

    assert exit_code == 0
    assert "past_life_engines" in captured.out
    assert "future_engines" in captured.out


def test_bootstrap_command_writes_file(tmp_path):
    target = tmp_path / "boot.yml"
    exit_code = admin_cli.main(["bootstrap", "--out", str(target)])

    assert exit_code == 0
    assert target.exists()
    assert target.read_text().strip()  # content persisted
