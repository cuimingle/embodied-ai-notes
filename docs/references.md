# 参考资料

本页按用途记录一手资料。章节中的数学表达是复习整理，未替代原始证明；手写原稿接入后应补充逐步推导及对应章节。部分出版页面可能需要网络访问条件。

## 理论与课程

| 资料 | 在本项目中的用途 |
| --- | --- |
| Sutton & Barto, [Reinforcement Learning: An Introduction, 2nd edition](http://incompleteideas.net/book/the-book-2nd.html) | MDP、DP、MC、TD、函数逼近与策略梯度的教材入口 |
| [Berkeley Deep RL 课程](https://rail.eecs.berkeley.edu/deeprlcourse/) | 深度 RL 与机器人学习的后续课程入口 |
| [Spinning Up · PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html) | PPO 的目标与工程流程 |
| [Gymnasium · Handling Time Limits](https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/) | 终止、截断与 bootstrap 的语义 |

## 方法原文

| 方法 | 一手资料 | 首版阅读范围 |
| --- | --- | --- |
| DQN | Mnih et al., [Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602), 2013；[Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236), 2015 | 函数逼近的背景入口 |
| GAE | Schulman et al., [High-Dimensional Continuous Control Using Generalized Advantage Estimation](https://arxiv.org/abs/1506.02438), 2015 | 优势估计定义的出处 |
| TRPO | Schulman et al., [Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477), 2015 | 约束更新的出处 |
| PPO | Schulman et al., [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347), 2017 | PPO-Clip；并参考官方 Spinning Up 说明 |
| GRPO | Shao et al., [DeepSeekMath](https://arxiv.org/html/2402.03300v3), 2024 | 第 4 节，结果监督与组相对优势 |
| GSPO | Zheng et al., [Group Sequence Policy Optimization](https://arxiv.org/html/2507.18071v2), 2025 | 第 2、4 节，token 与序列目标对照 |

列出论文不表示已完成论文复现。有关 GRPO/GSPO 的实测优劣，须对照原文的模型、数据与预算；本项目首版不重述其性能数字。

## 工程与组织方式

- [MkDocs 官方文档](https://www.mkdocs.org/) 与 [Material 安装说明](https://squidfunk.github.io/mkdocs-material/getting-started/)：文档站构建。
- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)：发布配置。
