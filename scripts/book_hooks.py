"""Preserve old chapter URLs after aligning the main track with the textbook."""

import html
import json
import os
from pathlib import Path

REDIRECTS = {
    "rl/01-mdp/": "rl/01-basic-concepts/",
    "rl/02-bellman/": "rl/02-bellman-equation/",
    "rl/03-monte-carlo/": "rl/05-monte-carlo/",
    "rl/04-stochastic-gradient/": "rl/06-stochastic-approximation/",
    "rl/05-temporal-difference/": "rl/07-temporal-difference/",
    "rl/06-value-approximation/": "rl/08-value-function-methods/",
    "rl/07-policy-approximation/": "rl/09-policy-gradient/",
    "rl/08-actor-critic/": "rl/10-actor-critic/",
    "rl/09-trpo/": "extensions/trpo/",
    "rl/10-ppo/": "extensions/ppo/",
    "rl/11-grpo/": "extensions/grpo/",
    "rl/12-gspo/": "extensions/gspo/",
}


def on_post_build(config, **kwargs):
    site = Path(config["site_dir"])
    for old, new in REDIRECTS.items():
        destination = site / old / "index.html"
        destination.parent.mkdir(parents=True, exist_ok=True)
        target = os.path.relpath(site / new, destination.parent).replace(os.sep, "/") + "/"
        if not (site / new / "index.html").exists():
            raise ValueError(f"redirect target missing: {new}")
        destination.write_text(
            '<!doctype html><html lang="zh"><meta charset="utf-8">'
            f'<meta http-equiv="refresh" content="0; url={html.escape(target)}">'
            '<title>章节已更新</title>'
            f'<p>章节已按教材重新编排。<a href="{html.escape(target)}">打开新章节</a></p>'
            f'<script>location.replace({json.dumps(target)} + location.search + location.hash);</script>'
            '</html>', encoding="utf-8"
        )
