---
hide:
  - toc
---

<div class="hero" markdown>

<span class="eyebrow">EMBODIED AI NOTES / 从全貌到主线</span>

# 先看清全貌，<br>再深入行动。

用一张脑图连接身体、感知、规划、控制与学习，再沿强化学习主线深入理解决策。

[建立具身智能全貌](embodied-ai-overview.md){ .md-button .md-button--primary }
[进入强化学习](rl/index.md){ .md-button }

<span class="hero-note">中文知识梳理 · 最小可运行实验 · 持续修订</span>

</div>

## 把学过的知识，连成可以使用的体系

学完一遍强化学习后，接下来要整理的是概念之间的依赖：Bellman 方程怎样导向 TD 更新，价值估计怎样服务策略优化，算法又在什么假设下能够用于机器人任务。

这里以“问题、机制、实现、证据”为线索。每次补充一段推导或一个实验，都让知识地图更具体。

<div class="grid cards" markdown>

- **01 / 建立具身智能全貌**

    从脑图看清八个知识方向，理解机器人闭环，以及 RL 在其中的位置。

    [阅读知识体系总览 →](embodied-ai-overview.md)

- **02 / 深入强化学习主线**

    从 MDP 到策略优化，配合教材伴读与数值实验，核对概念和更新规则。

    [浏览强化学习十章 →](rl/index.md) · [查看 20 个实验 →](labs/textbook.md)

- **03 / 连接物理任务**

    从观测、动作、奖励与评测定义出发，把算法映射到机器人系统。

    [从 RL 走向具身任务 →](rl/to-embodied.md)

- **04 / 逐步扩展边界**

    为控制、模仿学习、VLA 和世界模型定义下一阶段的具体产出。

    [查看路线与进度 →](roadmap.md)

</div>

## 当前版本能读到什么

在 RL 之前，先读[具身智能知识体系总览](embodied-ai-overview.md)：用脑图认识整体结构，再用一个操作任务理解各分支之间的关系。

主线严格按赵世钰《Mathematical Foundations of Reinforcement Learning》2024 年 9 月版的 10 章编排，配有统一符号、原书页码与 16 个交互实验。TRPO、PPO、GRPO、GSPO 单列为书外扩展，另有 4 个目标函数实验。Python 配套代码只依赖标准库。

这些内容是原创伴读与机制实验，不是教材逐页译文，也不将简化数值例子标记为完整深度训练复现。原有手写推导接入时，同样以指定版本的定义与假设为准。

## 项目的起点

本项目从已经学习过的强化学习出发，建立自己的概念关联、实验记录和写作积累。理论出处集中在[参考资料](references.md)，个人观点与实验结果在对应章节说明。
