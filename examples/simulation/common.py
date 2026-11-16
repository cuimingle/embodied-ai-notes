"""Validation, provenance, and strict JSON output for simulation experiments."""

from __future__ import annotations

import json
import hashlib
import math
import platform
import subprocess
from pathlib import Path


def positive_finite(name: str, value: float) -> None:
    if not math.isfinite(value) or value <= 0:
        raise ValueError(f"{name} must be finite and positive")


def positive_integer(name: str, value: int, maximum: int = 100_000) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or not 1 <= value <= maximum:
        raise ValueError(f"{name} must be an integer in [1, {maximum}]")


def provenance() -> dict:
    """Record the checkout state without assuming the example lives in a Git clone."""
    root = Path(__file__).resolve().parents[2]
    result = {"python": platform.python_version(), "platform": platform.platform(),
              "code_commit": None, "working_tree_dirty": None,
              "source_sha256": {
                  str(path.relative_to(root)): hashlib.sha256(path.read_bytes()).hexdigest()
                  for path in sorted(Path(__file__).resolve().parent.glob("*.py"))
              }}
    try:
        result["code_commit"] = subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=root, stderr=subprocess.DEVNULL,
            text=True, timeout=5,
        ).strip()
        result["working_tree_dirty"] = bool(subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=root,
            stderr=subprocess.DEVNULL, text=True, timeout=5,
        ).strip())
    except (OSError, subprocess.SubprocessError):
        pass
    return result


def write_report(report: dict, output: Path | None) -> None:
    """Refuse non-finite JSON numbers before writing a possibly incomplete file."""
    serialized = json.dumps(report, indent=2, ensure_ascii=False, allow_nan=False)
    if output is None:
        print(serialized)
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(serialized + "\n", encoding="utf-8")
        print(f"Saved {output}")
