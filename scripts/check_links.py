"""Check inline Markdown file links; MkDocs separately checks site anchors."""

import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", ".venv", "site", ".learnings", "outputs"}
LINK = re.compile(r"!?\[[^\]]*\]\(([^\s)]+)(?:\s+\"[^\"]*\")?\)")


def main():
    failures = []
    checked = 0
    files = [
        path for path in ROOT.rglob("*.md")
        if not any(part in SKIP for part in path.relative_to(ROOT).parts)
    ]
    for source in files:
        in_fence = False
        for number, line in enumerate(source.read_text(encoding="utf-8").splitlines(), 1):
            if line.lstrip().startswith("```"):
                in_fence = not in_fence
                continue
            if in_fence:
                continue
            for match in LINK.finditer(line):
                target = urlsplit(match.group(1).strip("<>"))
                if target.scheme or target.netloc or not target.path:
                    continue
                checked += 1
                destination = (source.parent / unquote(target.path)).resolve()
                if not destination.exists():
                    failures.append(f"{source.relative_to(ROOT)}:{number}: missing {target.path}")
    if failures:
        raise SystemExit("\n".join(failures))
    print(f"Checked {checked} local inline links in {len(files)} Markdown files.")


if __name__ == "__main__":
    main()
