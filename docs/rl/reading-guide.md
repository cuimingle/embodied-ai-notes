# 教材对照、覆盖范围与阅读校勘

主教材：**Shiyu Zhao，Mathematical Foundations of Reinforcement Learning，September 2024**。原始来源入口为[作者维护的教材仓库](https://github.com/MathFoundationRL/Book-Mathematical-Foundation-of-Reinforcement-Learning)。本次使用用户提供的 `Book-all-in-one_2024.09.pdf`，共 288 页；正文印刷页 1 对应 PDF 第 14 页。

本项目提供中文原创伴读、公式解释与教学代码。主线依据指定版本；其他教材和论文用于书外扩展与交叉核验，不改变主线的符号与章节顺序。

## 章节与页码

| 章 | 原书标题 | 印刷页 | PDF 页 | 对应笔记 |
| --- | --- | --- | --- | --- |
| 1 | Basic Concepts | 1–14 | 14–27 | [基本概念](01-basic-concepts.md) |
| 2 | State Values and Bellman Equation | 15–34 | 28–47 | [状态价值与 Bellman 方程](02-bellman-equation.md) |
| 3 | Optimal State Values and Bellman Optimality Equation | 35–56 | 48–69 | [Bellman 最优方程](03-bellman-optimality.md) |
| 4 | Value Iteration and Policy Iteration | 57–76 | 70–89 | [价值迭代与策略迭代](04-value-policy-iteration.md) |
| 5 | Monte Carlo Methods | 77–100 | 90–113 | [Monte Carlo 方法](05-monte-carlo.md) |
| 6 | Stochastic Approximation | 101–124 | 114–137 | [随机逼近](06-stochastic-approximation.md) |
| 7 | Temporal-Difference Methods | 125–150 | 138–163 | [TD 方法](07-temporal-difference.md) |
| 8 | Value Function Methods | 151–190 | 164–203 | [价值函数方法](08-value-function-methods.md) |
| 9 | Policy Gradient Methods | 191–214 | 204–227 | [策略梯度方法](09-policy-gradient.md) |
| 10 | Actor-Critic Methods | 215–236 | 228–249 | [Actor-Critic](10-actor-critic.md) |

附录 A、B 为概率论准备，附录 C 讨论确定性与随机序列收敛，附录 D 讨论梯度下降。阅读主线时按需要回查，不把附录里的假设省略掉。

## 递进关系

前 3 章先建立概念和方程；第 4 章用已知模型求解；第 5 章把模型期望换成回报样本；第 6 章提供增量随机逼近工具；第 7 章据此构造 TD；第 8 章从表格换成函数；第 9 章直接优化策略；第 10 章把策略梯度与 TD 价值估计结合。

TRPO、PPO、GRPO、GSPO 单列为[书外扩展](../extensions/index.md)。原书第 10 章末会提到部分进阶方法，但没有将它们组织成第 11–14 章；本站也不这样编号。

## 覆盖范围

本次提取了完整 PDF 文本，并对目录、符号页、基础环境、价值定义与策略梯度关键公式页做了视觉核对。10 篇伴读覆盖主线的主要定义、方程和更新式，并保留相应节号。它们不是逐页译文，也没有把原书所有证明、问答和大型数值实验标成已复现。

当前有 16 个书内交互实验，以及 4 个书外目标函数实验。浏览器执行的是本地 JavaScript 数值代码；同一概念另有可运行的 Python 标准库实现。目标网络动画只是机制演示，不能当作完整 DQN 训练；单状态策略梯度与 A2C 也不代表一般机器人任务的训练结果。

基础版本的 4×4 GridWorld 继续保留为[补充实验](../labs/gridworld.md)，其四动作、墙壁、终止与奖励规则不同，不作为本书例子的替代。

## 阅读校勘 {#calibration}

以下说明保留原书定义与位置，同时避免把排印、概率归一化或近似问题传给新的实现：

1. **印刷页 271，负定矩阵符号。** 该版 Symbols 的负定条目括号内误写成 $A\succ0$。本站按“负定”的定义写成 $A\prec0$；半负定为 $A\preceq0$。
2. **印刷页 138，n-step 回报关系。** 未来随机回报被条件期望 $q_\pi$ 替代后，一般只保持相应条件期望相等，不是逐条随机轨迹上 $G_t=G_t^{(n)}$。确定性且尾项精确的特例可以逐项相等。
3. **印刷页 202，式 (9.19)。** 按给出的定义，$\sum_s\rho_\pi(s)=1/(1-\gamma)$。本站保留它作为未归一化权重；改写为归一化概率期望时，显式补上比例因子。
4. **印刷页 203–205，定理 9.3。** 关于平稳分布加权、折扣价值的梯度使用近似。本站保留 $\approx$，不把关于分布导数项的讨论隐藏在等号里。
5. **印刷页 183，回放的均匀性。** 均匀抽取缓冲区条目，不自动产生整个状态动作空间的均匀分布；它仍取决于缓冲区中的经验覆盖。

这些校勘不改变本书的学习路线。后续若核对到新版勘误，应记录版本差异后再更新，避免静默混合不同版本。

## 后续维护

每章新增公式都写清原书节号或“扩展推导”；每个动画说明目标、状态定义和具体算法；每份运行记录保存种子、参数与适用范围。新增书内内容不得偷偷恢复为其他教材的 $V^\pi,Q^\pi,\pi_\theta$ 记号。
