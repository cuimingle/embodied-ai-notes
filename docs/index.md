---
hide:
  - toc
---

<div class="hero" markdown>

<span class="eyebrow">EMBODIED AI NOTES / 001 · REINFORCEMENT LEARNING</span>

# 从理解奖励，<br>到学会行动。

用强化学习整理决策的基础，沿着控制、数据和策略学习，逐步走向具身智能。

[进入强化学习](rl/index.md){ .md-button .md-button--primary }
[运行第一个实验](rl/01-basic-concepts.md){ .md-button }

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

    按指定教材的规则，比较已知模型的规划与通过样本学习。

    [查看 20 个动画与代码实验 →](labs/textbook.md)

- **03 / 连接物理任务**

    从观测、动作、奖励与评测定义出发，把算法映射到机器人系统。

    [从 RL 走向具身任务 →](rl/to-embodied.md)

- **04 / 逐步扩展边界**

    为控制、模仿学习、VLA 和世界模型定义下一阶段的具体产出。

    [查看路线与进度 →](roadmap.md)

</div>

## 当前版本能读到什么

主线严格按赵世钰《Mathematical Foundations of Reinforcement Learning》2024 年 9 月版的 10 章编排，配有统一符号、原书页码与 16 个交互实验。TRPO、PPO、GRPO、GSPO 单列为书外扩展，另有 4 个目标函数实验。Python 配套代码只依赖标准库。

这些内容是原创伴读与机制实验，不是教材逐页译文，也不将简化数值例子标记为完整深度训练复现。原有手写推导接入时，同样以指定版本的定义与假设为准。

## 项目的起点

本项目从已经学习过的强化学习出发，建立自己的概念关联、实验记录和写作积累。理论出处集中在[参考资料](references.md)，个人观点与实验结果在对应章节说明。
