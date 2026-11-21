"""Build the offline reader with .venv/bin/python scripts/export_quick_overview.py."""

from html import escape
from pathlib import Path
from xml.etree import ElementTree

from markdown import Markdown
from markdown.treeprocessors import Treeprocessor
from mkdocs.utils.meta import get_data


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUTPUT = ROOT / "articles" / "快速概览" / "具身智能快速概览.html"
CHAPTERS = {
    "concept": "什么是具身智能",
    "tasks": "四类任务",
    "stack": "主要技术栈",
    "papers": "分方向读论文",
}
SCRIPTS = (
    "overview-hand-scenes.js",
    "overview-navigation-scenes.js",
    "overview-paper-scene.js",
    "overview-player.js",
)

READER_CSS = """
:root {
  color-scheme: light dark;
  --paper: #fafbf6; --ink: #232b24; --muted: #536354;
  --accent: #315f3c; --line: #ced6ca; --wash: #edf1e7;
  font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--paper); color: var(--ink);
}
@media (prefers-color-scheme: dark) {
  :root { --paper: #1a201c; --ink: #f0f2ea; --muted: #b5c2b4;
          --accent: #b0d99e; --line: #4f6151; --wash: #283128; }
}
* { box-sizing: border-box; }
body { margin: 0; }
header, .layout { max-width: 72rem; margin-inline: auto; padding-inline: clamp(1rem, 4.5vw, 4rem); }
header { padding-top: clamp(2.3rem, 6vw, 5rem); padding-bottom: 1.6rem; }
header h1 { margin: 0; color: var(--accent); font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.2; }
.layout { display: grid; grid-template-columns: 12rem minmax(0, 45rem); gap: clamp(2rem, 5vw, 5rem); }
nav { position: sticky; top: 1.5rem; align-self: start; padding-block: 1.2rem; border-top: 2px solid var(--accent); }
nav h2 { margin: 0 0 .65rem; font-size: 1.05rem; }
nav ol { margin: 0; padding-left: 1.8rem; list-style: decimal-leading-zero; }
nav li { color: var(--muted); padding-left: .2rem; }
nav li::marker { font-size: .85rem; font-variant-numeric: tabular-nums; }
nav a { display: inline-block; padding-block: .4rem; }
a { color: var(--accent); text-underline-offset: .2em; }
a:hover { text-decoration-thickness: .13em; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
main { min-width: 0; }
article { border-top: 1px solid var(--line); padding-block: 1.25rem 3rem;
          line-height: 1.85; font-size: clamp(1rem, 1.6vw, 1.1rem); overflow-wrap: anywhere; }
article > h2 { margin: 0; font-size: clamp(1.65rem, 3.5vw, 2.4rem); line-height: 1.4; }
.edition { margin: .55rem 0 1.5rem; color: var(--muted); font-size: .91rem; }
article h3 { margin: 2em 0 .65em; font-size: 1.35em; line-height: 1.45; }
article p { margin: .95em 0; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 32rem; font-size: .92em; line-height: 1.55; }
th, td { text-align: left; vertical-align: top; padding: .65em .75em; border-bottom: 1px solid var(--line); }
th { background: var(--wash); }
td:first-child { min-width: 7em; }
@media (max-width: 48rem) {
  .layout { display: block; }
  nav { position: static; padding-block: .8rem 1.3rem; }
  nav ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 1.5rem; }
}
@media print {
  :root { color-scheme: light; }
  .layout { display: block; }
  nav, .ov-controls, .ov-mode { display: none; }
  article + article { break-before: page; }
  .overview-demo, tr { break-inside: avoid; }
}
"""


class OfflineLinks(Treeprocessor):
    """Adjust Markdown elements before HTML serialization."""

    def run(self, root):
        for link in root.iter("a"):
            target = link.get("href", "").removeprefix("./")
            for slug in CHAPTERS:
                if target == f"{slug}.md":
                    link.set("href", f"#{slug}")
                    break

        # The reader has one document title above the four article titles.
        for item in root.iter():
            if item.tag in ("h1", "h2", "h3", "h4", "h5"):
                item.tag = f"h{int(item.tag[1]) + 1}"
        for paragraph in root.findall("p"):
            if (paragraph.text or "").startswith("具身智能快速概览 · 第"):
                paragraph.set("class", "edition")
        for table in root.findall("table"):
            index = list(root).index(table)
            root.remove(table)
            wrapper = ElementTree.Element(
                "div", {"class": "table-wrap", "role": "region", "aria-label": "对照表", "tabindex": "0"}
            )
            wrapper.append(table)
            root.insert(index, wrapper)


def build():
    renderer = Markdown(extensions=["tables"])
    renderer.treeprocessors.register(OfflineLinks(renderer), "offline_reader", 15)
    contents = []
    for slug in CHAPTERS:
        source = (DOCS / "quick-overview" / f"{slug}.md").read_text(encoding="utf-8")
        body, _ = get_data(source)
        contents.append(f'<article id="{slug}">\n{renderer.reset().convert(body)}\n</article>')

    navigation = "\n".join(f'<li><a href="#{slug}">{escape(name)}</a></li>' for slug, name in CHAPTERS.items())
    player_css = (DOCS / "assets/stylesheets/overview-player.css").read_text(encoding="utf-8")
    scripts = [
        (DOCS / "assets/javascripts" / filename).read_text(encoding="utf-8")
        for filename in SCRIPTS
    ]
    chapters = "\n".join(contents)
    javascript = "\n".join(scripts)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>具身智能快速概览</title>
  <style>{READER_CSS}\n{player_css}</style>
</head>
<body>
<header><h1>具身智能快速概览</h1></header>
<div class="layout">
<nav aria-label="系列目录"><h2>目录</h2><ol>{navigation}</ol></nav>
<main>{chapters}</main>
</div>
<script>{javascript}</script>
</body>
</html>
"""


if __name__ == "__main__":
    document = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(document, encoding="utf-8")
    print(OUTPUT)
