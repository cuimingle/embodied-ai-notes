# Project instructions

- 与用户使用中文交流，代码标识符和注释使用英文。
- 强化学习主线以 Shiyu Zhao 的 Mathematical Foundations of Reinforcement Learning（2024-09）为准；主线只有原书的 10 章。对照 `docs/book-manifest.json`、`docs/rl/notation.md` 和 `docs/rl/reading-guide.md`。
- 使用 `v_\pi`、`q_\pi`、`\pi(a\mid s,\theta)` 与原书的优势记号 `\delta_\pi`。区分随机变量、样本、估计值、等式与近似。
- 教材基础模型有 9 个状态、5 个动作，禁区可以进入，目标状态默认继续获得奖励。其他设置需明确单列。
- 公式引擎、动画和字体资源应由本站提供，不重新引入运行时 CDN 依赖。
- 动画采用真实数值更新，支持暂停、单步、重置和减少动态效果。补充机制实验不标为完整算法复现。
- 新增或迁移章节时更新导航和兼容跳转。原始教材、提取文本和页面截图仅作为本地参考，不随笔记发布。
- 提交前运行 `python3 -m unittest discover -s tests -v`、`node --test tests/test_textbook_browser.cjs`、`python3 scripts/check_links.py` 和 `.venv/bin/python -m mkdocs build --strict`。公式或交互改动还需在浏览器实际验证。
