# 01 · 基本概念

> 对照：赵世钰《Mathematical Foundations of Reinforcement Learning》，2024-09 版，第 1 章，印刷页 1–14（PDF 第 14–27 页）。本文为原创伴读，符号、章节顺序与环境规则以该版为准。

## 1.1–1.3 · 从格子世界定义状态、动作与转移

原书的基础例子有 9 个状态，按从左到右、从上到下编号为 $s_1,\ldots,s_9$。状态空间记为 $\mathcal S$，动作空间记为 $\mathcal A(s)$。每个状态都有 5 个动作：

| 动作 | $a_1$ | $a_2$ | $a_3$ | $a_4$ | $a_5$ |
| --- | --- | --- | --- | --- | --- |
| 含义 | 上 | 右 | 下 | 左 | 停留 |

一般模型使用 $p(s'\mid s,a)$ 描述转移。基础例子的转移是确定的：例如 $p(s_2\mid s_1,a_2)=1$。越界会返回原状态；禁区 $s_6,s_7$ **仍可进入**。禁区和无法穿过的墙是两种不同的建模方式，当前主线采用前者。

## 1.4 · 策略是每个状态上的动作分布

$$
\pi(a\mid s)\geq0,\qquad\sum_{a\in\mathcal A(s)}\pi(a\mid s)=1.
$$

确定性策略只给一个动作概率 1；随机策略可以给多个动作正概率。原书表 1.2 中，$s_1$ 以各 $0.5$ 的概率向右或向下。策略需要定义所有状态上的行为，而不只是一条从起点出发的路径。

## 1.5 · 奖励与状态转移分别定义

原书基础奖励为：越界 $-1$，进入禁区 $-1$，到达目标 $s_9$ 获得 $+1$，其他情况为 0。一般奖励过程写作 $p(r\mid s,a)$。它与 $p(s'\mid s,a)$ 一起组成环境模型。

判断顺序也有意义：在 $s_9$ 选择停留，奖励为 $+1$；向右越界虽然仍在 $s_9$，奖励却是 $-1$。因此不能仅根据下一状态是否为目标来决定奖励。

## 1.6 · 轨迹、回报与持续任务

遵循原书，大写 $S_t,A_t,R_{t+1}$ 表示随机变量，小写 $s_t,a_t,r_{t+1}$ 表示一次观测到的样本。折扣回报为

$$
G_t\doteq R_{t+1}+\gamma R_{t+2}+\gamma^2R_{t+3}+\cdots,
\qquad 0<\gamma<1.
$$

基础例子中，目标是普通状态，到达后仍可离开或继续停留。沿 $s_1\to s_2\to s_5\to s_8\to s_9$ 再一直停留，奖励为 $0,0,0,1,1,\ldots$，所以

$$
G_0=\frac{\gamma^3}{1-\gamma}.
$$

当 $\gamma=0.9$ 时，该值为 $7.29$。把过程改成“第一次到目标就终止”，会得到另一个任务，不能继续使用这个数值。

<div class="rl-demo" data-rl-demo="trajectory"><p>交互实验：播放机器人转移，比较绕开禁区与经过禁区的折扣回报。</p></div>

## 1.7 · MDP 与马尔可夫性

本章依次定义集合 $\mathcal S,\mathcal A(s),\mathcal R(s,a)$，模型 $p(s'\mid s,a),p(r\mid s,a)$，以及策略 $\pi(a\mid s)$。马尔可夫性要求给定当前状态和动作后，过去历史不再额外改变下一状态和奖励的分布。模型和策略固定时，MDP 诱导一个马尔可夫过程。

机器人单幅图像未必是充分状态。历史观测、隐状态与部分可观测问题放在[具身任务衔接](to-embodied.md)讨论，不混入本章有限 MDP 的假设。

## 运行代码

```bash
python3 -m examples.textbook --chapter 1 --steps 12 --output outputs/book-ch01.json
```

```python
from examples.textbook.core import BookGrid, trajectory

grid = BookGrid()
assert grid.transition(9, 5) == (9, 1.0)
assert grid.transition(9, 2) == (9, -1.0)
print(trajectory(gamma=0.9)["infinite_return"])
```

代码中的状态和动作索引从 1 开始，与书中的 $s_i,a_j$ 对齐。下一章用回报的条件期望定义[状态价值与 Bellman 方程](02-bellman-equation.md)。
