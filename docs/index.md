---
hide:
  - toc
---

<div class="hero" markdown>

<span class="eyebrow">EMBODIED AI NOTES / 001 · REINFORCEMENT LEARNING</span>

# 从理解奖励，<br>到学会行动。

用强化学习整理决策的基础，沿着控制、数据和策略学习，逐步走向具身智能。

[进入强化学习](rl/index.md){ .md-button .md-button--primary }
[运行第一个实验](labs/gridworld.md){ .md-button }

<span class="hero-note">中文知识梳理 · 最小可运行实验 · 持续修订</span>

</div>

## 把学过的知识，连成可以使用的体系

学完一遍强化学习后，接下来要整理的是概念之间的依赖：Bellman 方程怎样导向 TD 更新，价值估计怎样服务策略优化，算法又在什么假设下能够用于机器人任务。

这里以“问题、机制、实现、证据”为线索。每次补充一段推导或一个实验，都让知识地图更具体。

<div class="grid cards" markdown>

- **01 / 建立知识地图**

    从 MDP 到策略优化，明确每个方法改变了什么、依赖什么。

    [浏览强化学习主线 →](rl/index.md)

- **02 / 用代码核对理解**

    在同一个 GridWorld 中比较已知模型的规划与交互学习。

    [运行价值迭代与 Q-learning →](labs/gridworld.md)

- **03 / 连接物理任务**

    从观测、动作、奖励与评测定义出发，把算法映射到机器人系统。

    [从 RL 走向具身任务 →](rl/to-embodied.md)

- **04 / 逐步扩展边界**

    为控制、模仿学习、VLA 和世界模型定义下一阶段的具体产出。

    [查看路线与进度 →](roadmap.md)

</div>

## 当前版本能读到什么

强化学习 12 篇复习初稿，涵盖 Bellman 方程、规划、MC/TD、随机梯度、函数逼近、Actor-Critic 及 TRPO/PPO/GRPO/GSPO；另有具身任务衔接页、一个标准库实现的 GridWorld 实验，以及章节和实验记录规范。完整手稿推导与深度算法实现后续补充。

本站尚未接入作者原有的强化学习笔记，新增初稿需要结合个人学习过程继续校订。未来主题的完成条件统一记录在路线页。

## 项目的起点

本项目从已经学习过的强化学习出发，建立自己的概念关联、实验记录和写作积累。理论出处集中在[参考资料](references.md)，个人观点与实验结果在对应章节说明。
