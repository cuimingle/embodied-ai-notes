"""Build the offline reader with .venv/bin/python scripts/export_quick_overview.py."""

from html import escape
from pathlib import Path
from xml.etree import ElementTree

from markdown import Markdown
from markdown.extensions.toc import slugify_unicode
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
[hidden] { display: none !important; }
a { color: var(--accent); text-underline-offset: .2em; }
a:hover { text-decoration-thickness: .13em; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.skip { position: fixed; top: -6rem; left: 1rem; z-index: 5; padding: .7rem; background: var(--paper); }
.skip:focus { top: .5rem; }
.site-head { position: sticky; top: 0; z-index: 2; background: var(--paper); border-bottom: 1px solid var(--line); }
.bar, .layout { max-width: 96rem; margin-inline: auto; padding-inline: clamp(1rem, 3vw, 3rem); }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.bar h1 { margin: 0; padding-block: .8rem; color: var(--ink); font-size: 1.28rem; line-height: 1.35; }
.bar nav { display: flex; gap: clamp(.45rem, 1.7vw, 1.7rem); }
.bar nav a { display: inline-block; padding: 1rem .12rem .85rem; border-bottom: .18rem solid transparent;
             color: var(--muted); font-size: .94rem; text-decoration: none; white-space: nowrap; }
.bar nav a[aria-current] { border-color: var(--accent); color: var(--accent); font-weight: 650; }
.layout { --offset: 5rem; display: grid; grid-template: "tree article outline" auto / minmax(10rem, 15rem) minmax(0, 45rem) minmax(10rem, 15rem);
          justify-content: center; align-items: start; column-gap: clamp(1.35rem, 3.4vw, 3.5rem); padding-block: 2rem; }
.tree { grid-area: tree; }
.outline { grid-area: outline; }
.side { position: sticky; top: var(--offset); max-height: calc(100vh - var(--offset) - 1rem); overflow: auto; padding: .25rem; }
.side summary { cursor: pointer; padding: .5rem 0; font-weight: 650; }
.side ul, .side ol { margin: .5rem 0; }
.tree ol { list-style: decimal-leading-zero; padding-left: 2.25rem; }
.tree li::marker { color: var(--muted); font-size: .85rem; }
.side a { display: block; padding: .38rem .55rem; color: var(--muted); font-size: .92rem; line-height: 1.55; text-decoration: none; }
.side a:hover, .bar a:hover { color: var(--accent); text-decoration: underline; }
.side a[aria-current] { color: var(--accent); background: var(--wash); box-shadow: inset 3px 0 var(--accent); font-weight: 650; }
.outline ul { padding: 0; list-style: none; }
.outline ul ul { margin: .15rem 0 .55rem .6rem; padding-left: .55rem; border-left: 1px solid var(--line); }
.outline p { margin: .9rem 0 .45rem; color: var(--muted); font-size: .85rem; font-weight: 650; }
main { grid-area: article; min-width: 0; }
article { padding-bottom: 3rem; line-height: 1.85; font-size: clamp(1rem, 1.35vw, 1.1rem); overflow-wrap: anywhere; }
article:not([hidden]) + article:not([hidden]) { margin-top: 2rem; }
article, main, article :is(h2, h3, h4, h5, h6) { scroll-margin-top: var(--offset); }
article > h2 { margin: 0; font-size: clamp(1.65rem, 3.5vw, 2.4rem); line-height: 1.4; }
.edition { margin: .55rem 0 1.5rem; color: var(--muted); font-size: .91rem; }
article h3 { margin: 2em 0 .65em; font-size: 1.35em; line-height: 1.45; }
article p { margin: .95em 0; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; min-width: 32rem; font-size: .92em; line-height: 1.55; }
th, td { text-align: left; vertical-align: top; padding: .65em .75em; border-bottom: 1px solid var(--line); }
th { background: var(--wash); }
td:first-child { min-width: 7em; }
@media (max-width: 62rem) {
  .layout { --offset: 5rem; grid-template: "tree outline" auto "article article" auto / repeat(2, minmax(0, 1fr));
            gap: .75rem 1rem; max-width: 48rem; padding-top: 1rem; }
  .side { position: static; max-height: none; overflow: visible; padding: 0; border-bottom: 1px solid var(--line); }
  .side details[open] { padding-bottom: .6rem; }
}
@media (max-width: 36rem) {
  .bar { display: block; }
  .bar h1 { padding: .65rem 0 .15rem; font-size: 1.15rem; }
  .bar nav { justify-content: space-between; overflow-x: auto; }
  .bar nav a { padding: .45rem 0 .5rem; font-size: .84rem; }
  .layout { --offset: 6.3rem; }
}
@media print {
  :root { color-scheme: light; }
  .layout { display: block; }
  .site-head { position: static; }
  nav, .skip, .ov-controls, .ov-mode { display: none; }
  article[hidden] { display: block !important; }
  article + article { break-before: page; }
  .overview-demo, tr { break-inside: avoid; }
}
"""


class OfflineLinks(Treeprocessor):
    """Adjust Markdown elements before HTML serialization."""

    def run(self, root):
        self.title = "".join(root.find("h1").itertext())
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


READER_SCRIPT = """
(() => {
  const articles = Array.from(document.querySelectorAll("main article"));
  const outlines = document.querySelectorAll("[data-outline]");
  const chapterLinks = document.querySelectorAll("[data-chapter]");
  const sideMenus = document.querySelectorAll(".side details");
  const compact = matchMedia("(max-width: 62rem)");

  function sizeMenus() {
    for (const menu of sideMenus) menu.open = !compact.matches;
  }
  function navigate(moveFocus) {
    let id = "";
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* Ignore invalid fragments. */ }
    const anchor = document.getElementById(id);
    const chapter = anchor?.closest("article") || articles[0];
    const previous = articles.find(item => !item.hidden && item !== chapter);
    if (previous) {
      for (const status of previous.querySelectorAll('.ov-status[aria-live="off"]')) {
        status.closest(".overview-demo").querySelector('[data-action="play"]').click();
      }
    }
    for (const item of articles) item.hidden = item !== chapter;
    for (const link of chapterLinks) {
      if (link.dataset.chapter === chapter.id) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    for (const item of outlines) {
      item.hidden = item.dataset.outline !== chapter.id;
      for (const link of item.querySelectorAll("a")) {
        if (link.getAttribute("href") === "#" + id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    }
    const heading = chapter.querySelector("h2");
    document.title = heading.textContent + " · 具身智能快速概览";
    if (anchor?.closest("article")) {
      const target = anchor === chapter ? heading : anchor;
      if (compact.matches && moveFocus) {
        for (const menu of sideMenus) menu.open = false;
      }
      if (moveFocus) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      target.scrollIntoView({ block: "start" });
    }
  }
  sizeMenus();
  compact.addEventListener("change", sizeMenus);
  document.querySelector(".skip").addEventListener("click", event => {
    event.preventDefault();
    const heading = document.querySelector("article:not([hidden]) > h2");
    heading.tabIndex = -1;
    heading.focus();
  });
  for (const link of document.querySelectorAll(".side a, .bar a")) {
    link.addEventListener("click", event => {
      if (link.hash && link.hash === location.hash && !event.metaKey && !event.ctrlKey &&
          !event.shiftKey && !event.altKey) {
        event.preventDefault();
        navigate(true);
      }
    });
  }
  addEventListener("hashchange", () => navigate(true));
  navigate(false);
})();
"""


def prepare_chapter(slug):
    def section_id(text, separator):
        return f"{slug}--{slugify_unicode(text, separator)}"

    renderer = Markdown(
        extensions=["tables", "toc"],
        extension_configs={"toc": {"slugify": section_id, "toc_depth": "3-6"}},
    )
    processor = OfflineLinks(renderer)
    renderer.treeprocessors.register(processor, "offline_reader", 15)
    source = (DOCS / "quick-overview" / f"{slug}.md").read_text(encoding="utf-8")
    body, _ = get_data(source)
    article = renderer.convert(body)
    return processor.title, article, renderer.toc


def build():
    contents = []
    tabs = []
    tree = []
    outlines = []
    for slug, name in CHAPTERS.items():
        title, article, toc = prepare_chapter(slug)
        link = f'href="#{slug}" data-chapter="{slug}"'
        tabs.append(f'<a {link}>{escape(name)}</a>')
        tree.append(f'<li><a {link}>{escape(title)}</a></li>')
        outlines.append(f'<section data-outline="{slug}"><p>{escape(name)}</p>{toc}</section>')
        contents.append(f'<article id="{slug}">\n{article}\n</article>')
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
  <noscript><style>.overview-demo:empty {{ display: none; }}</style></noscript>
</head>
<body>
<a class="skip" href="#content">跳到正文</a>
<header class="site-head"><div class="bar"><h1>具身智能快速概览</h1>
<nav aria-label="栏目导航">{''.join(tabs)}</nav></div></header>
<div class="layout">
<nav class="side tree" aria-label="系列目录"><details><summary>系列目录</summary>
<ol>{''.join(tree)}</ol></details></nav>
<nav class="side outline" aria-label="小节目录"><details><summary>小节目录</summary>
{''.join(outlines)}</details></nav>
<main id="content" tabindex="-1">{chapters}</main>
</div>
<script>{javascript}\n{READER_SCRIPT}</script>
</body>
</html>
"""


if __name__ == "__main__":
    document = build()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(document, encoding="utf-8")
    print(OUTPUT)
