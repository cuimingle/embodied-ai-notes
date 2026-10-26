# Embodied AI Notes · 具身智能学习笔记

**从强化学习出发，理解机器人如何感知、决策与行动。**

[在线阅读](https://cuimingle.github.io/embodied-ai-notes/) · [教材阅读对照](docs/rl/reading-guide.md) · [动画与代码](docs/labs/textbook.md)

强化学习主线以 **Shiyu Zhao（赵世钰），《Mathematical Foundations of Reinforcement Learning》，2024 年 9 月版**为准。符号、公式设定与章节递进遵循指定版本；TRPO、PPO、GRPO、GSPO 单列为书外扩展。

当前 v0.2 包含 10 章中文原创伴读、统一符号表、原书页码对照、16 个书内交互实验和 4 个扩展数学实验。动画执行真实的数值更新，支持播放、暂停、单步、参数调整与进度拖动；Python 配套代码仅使用标准库。内容不是逐页译文，机制小实验也不标记为完整训练复现。

## 十章主线

| 章 | 内容 |
| --- | --- |
| 01 | [基本概念](docs/rl/01-basic-concepts.md) |
| 02 | [状态价值与 Bellman 方程](docs/rl/02-bellman-equation.md) |
| 03 | [最优状态价值与 Bellman 最优方程](docs/rl/03-bellman-optimality.md) |
| 04 | [价值迭代与策略迭代](docs/rl/04-value-policy-iteration.md) |
| 05 | [Monte Carlo 方法](docs/rl/05-monte-carlo.md) |
| 06 | [随机逼近](docs/rl/06-stochastic-approximation.md) |
| 07 | [Temporal-Difference 方法](docs/rl/07-temporal-difference.md) |
| 08 | [价值函数方法](docs/rl/08-value-function-methods.md) |
| 09 | [策略梯度方法](docs/rl/09-policy-gradient.md) |
| 10 | [Actor-Critic 方法](docs/rl/10-actor-critic.md) |

先读[符号体系](docs/rl/notation.md)，再根据[阅读对照](docs/rl/reading-guide.md)回查原书。原版中涉及排印、概率归一化和近似的问题会显式记录校勘。后续自己的手写推导接入时，也按该版本核对假设。

[书外扩展](docs/extensions/index.md)继续介绍 TRPO、PPO、GRPO 与 GSPO，保留教材已有记号，另行定义新增变量与任务条件。[具身任务衔接](docs/rl/to-embodied.md)将理论映射到观测、动作、控制接口与评测。

## 立即运行

Python 3.11+，无需 GPU，无需第三方 Python 包：

```bash
python3 -m examples.textbook --chapter 1 --steps 12
python3 -m examples.textbook --chapter 4 --steps 240 --output outputs/book-ch04.json
python3 -m examples.textbook --chapter 7 --steps 500 --output outputs/book-ch07.json
python3 -m examples.textbook --demo ppo
```

`--chapter` 选择主实验，`--demo` 选择具体机制，`--output` 保存种子、参数与计算轨迹。详见[20 个实验入口](docs/labs/textbook.md)。浏览器中的动画使用随网站发布的 JavaScript，并非在线 Python 解释器。

教材基础环境采用 9 个状态、5 个动作，禁区可以进入，到达目标后仍可继续。旧的[4×4 GridWorld](docs/labs/gridworld.md)作为另一种终止任务单独保留，不将其数值冒充教材例子。

## 本地阅读网站

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

访问 `http://127.0.0.1:8000/`。MathJax、SVG 图形和动画均随站点发布，不依赖运行时 CDN 或公式字体服务。章节迁移保留旧网址跳转。发布步骤见[GitHub Pages 说明](docs/project/publishing.md)。

## 工程与验证

```text
docs/                   教材伴读、扩展、交互动画与来源对照
examples/textbook/      Python 标准库实验
examples/gridworld.py   原有独立 4×4 补充实验
tests/                  数学、环境、跨实现与结构验证
scripts/                文档检查与旧网址兼容
templates/              章节、论文与实验记录模板
```

```bash
python3 -m unittest discover -s tests -v
node --test tests/test_textbook_browser.cjs
python3 scripts/check_links.py
python -m mkdocs build --strict
```

Node.js 22 用于检查浏览器数值核，不是运行 Python 实验的依赖。公式和交互的修改还需在实际浏览器检查。

## 来源、贡献与许可

教材来源为[作者维护的仓库](https://github.com/MathFoundationRL/Book-Mathematical-Foundation-of-Reinforcement-Learning)，详细资料见[参考资料](docs/references.md)。本仓库不发布原教材 PDF、全文提取或教材截图。

欢迎按[贡献规范](CONTRIBUTING.md)补充推导与实验。原创笔记与代码使用 [MIT License](LICENSE)；随站点分发的 MathJax 保留其 Apache 2.0 许可证，外部教材与论文遵循各自许可。
