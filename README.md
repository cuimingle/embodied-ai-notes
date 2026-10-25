# Embodied AI Notes · 具身智能学习笔记

**从强化学习出发，理解机器人如何感知、决策与行动。**

[在线阅读](https://cuimingle.github.io/embodied-ai-notes/) · [GitHub 仓库](https://github.com/cuimingle/embodied-ai-notes) · [学习路线](docs/roadmap.md)

面向已经学过一轮强化学习、希望整理知识并进入具身智能实践的学习者。以中文笔记建立概念之间的联系，用小实验核对理解，再逐步补齐机器人学、控制、模仿学习与视觉语言动作模型。

当前为 **v0.1 初稿**：按作者已学过的主题建立复习主线，尚未包含深度强化学习或语言模型后训练的训练实现。手写推导原稿接入后继续修订。

## 从这里开始

| 想做什么 | 入口 |
| --- | --- |
| 看完整学习路线 | [路线与进度](docs/roadmap.md) |
| 复习强化学习 | [强化学习知识地图](docs/rl/index.md) |
| 先跑一个小实验 | [GridWorld：规划与学习](docs/labs/gridworld.md) |
| 将 RL 与机器人任务联系起来 | [从强化学习到具身任务](docs/rl/to-embodied.md) |
| 整理自己的笔记 | [写作与贡献规范](CONTRIBUTING.md)、[章节模板](templates/chapter.md) |
| 发布在线文档 | [本地预览与 GitHub Pages](docs/project/publishing.md) |

## 强化学习主线

1. [MDP、回报与部分可观测性](docs/rl/01-mdp.md)
2. [Bellman 方程与动态规划](docs/rl/02-bellman.md)
3. [Monte Carlo learning](docs/rl/03-monte-carlo.md)
4. [随机梯度与随机逼近](docs/rl/04-stochastic-gradient.md)
5. [Temporal Difference、SARSA 与 Q-learning](docs/rl/05-temporal-difference.md)
6. [价值函数逼近](docs/rl/06-value-approximation.md)
7. [策略函数逼近与策略梯度](docs/rl/07-policy-approximation.md)
8. [Actor-Critic 与 GAE](docs/rl/08-actor-critic.md)
9. [TRPO](docs/rl/09-trpo.md)
10. [PPO](docs/rl/10-ppo.md)
11. [GRPO](docs/rl/11-grpo.md)
12. [GSPO](docs/rl/12-gspo.md)

[从强化学习到具身任务](docs/rl/to-embodied.md) 将以上概念映射到机器人任务。GRPO、GSPO 先按语言模型后训练的原始设定整理，不将相关实验结论直接推广到物理控制。

后续主题包括机器人学与控制、模仿学习、VLA、世界模型及 Sim2Real。具体交付物和完成条件见路线页。

## 立即运行

教学实验只使用 Python 标准库，要求 Python 3.11+，无需 GPU：

```bash
python3 -m examples.gridworld --algorithm value-iteration
python3 -m examples.gridworld --algorithm q-learning --seed 0 --episodes 2000 --output outputs/q-learning-seed0.json
python3 -m unittest discover -s tests -v
```

本地阅读网站：

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-docs.txt
python -m mkdocs serve
```

打开终端提示的 `http://127.0.0.1:8000/`。网站支持中文搜索、章节导航、深浅色切换与公式渲染；公式渲染使用外部 MathJax，首次加载需要网络。直接在 GitHub 阅读 Markdown 不依赖文档构建。

## 工程结构

```text
docs/           在线文档与知识地图
examples/       可运行的最小实验
tests/          环境语义与算法验证
templates/      章节、论文与实验记录模板
scripts/        文档链接检查
.github/        持续集成、Pages 发布和协作模板
```

知识库按概念与实验组织，后续文章可以从中选题改写。

## 内容约定

- 区分教材结论、自己的推导、教学实现和实际测得的结果。
- 每章说明问题、假设、机制、实现陷阱及向具身任务的迁移条件。
- 实验保留种子、配置、原始计数与失败记录；参考结果只对明确的运行条件负责。
- 提纲不标记为完整教程，能运行示例不标记为论文复现。

## 致谢与许可

理论参考 Sutton & Barto、原始论文和官方文档，详见[参考资料](docs/references.md)。

新增原创文档与代码使用 [MIT License](LICENSE)。外链资料、引用内容及后续引入的第三方资源遵循各自许可。
