# 强化学习：按指定教材建立主线

以赵世钰《Mathematical Foundations of Reinforcement Learning》2024 年 9 月版为准，统一符号、公式设定与 10 章递进关系。先读[符号体系](notation.md)，再按章学习；需要回查原书时使用[章节与页码对照](reading-guide.md)。

## 十章主线

| 阶段 | 章节 | 要理解的变化 |
| --- | --- | --- |
| 定义问题 | [01 · 基本概念](01-basic-concepts.md) | 状态、动作、奖励、回报、策略与 MDP |
| 评价策略 | [02 · 状态价值与 Bellman 方程](02-bellman-equation.md) | 从随机回报到条件期望与价值递推 |
| 定义最优 | [03 · Bellman 最优方程](03-bellman-optimality.md) | 从策略加权到最大化与收缩映射 |
| 用模型求解 | [04 · 价值迭代与策略迭代](04-value-policy-iteration.md) | 一步、截断与充分策略评估 |
| 从模型到样本 | [05 · Monte Carlo](05-monte-carlo.md) | 用轨迹回报估计价值 |
| 从批量到增量 | [06 · 随机逼近](06-stochastic-approximation.md) | 均值估计、RM 与 SGD |
| 加入自举 | [07 · TD 方法](07-temporal-difference.md) | TD、Sarsa、n-step 与 Q-learning |
| 从表格到函数 | [08 · 价值函数方法](08-value-function-methods.md) | 参数共享、TD 半梯度与 DQN |
| 直接优化策略 | [09 · 策略梯度](09-policy-gradient.md) | 指标、状态分布、梯度与 REINFORCE |
| 联合优化 | [10 · Actor-Critic](10-actor-critic.md) | QAC、A2C、off-policy 与确定性策略 |

## 三个贯穿问题

当前是在评价给定策略，还是寻找最优策略？更新使用精确模型、MC 回报还是 TD 自举？对象是每个状态的独立表项，还是共享参数的函数？每次切换方法，都先回答这三个问题。

## 统一记号 {#notation}

<span id="_4"></span>

| 记号 | 含义 |
| --- | --- |
| $S_t,A_t,R_{t+1}$ 与 $s_t,a_t,r_{t+1}$ | 随机变量与经验样本 |
| $p(s'\mid s,a),p(r\mid s,a)$ | 状态与奖励模型 |
| $v_\pi(s),q_\pi(s,a)$ | 状态价值与动作价值 |
| $\hat v(s,w),\hat q(s,a,w)$ | 参数化价值近似 |
| $\pi(a\mid s,\theta)$ | 参数化随机策略 |
| $\delta_\pi(s,a)$ 与 $\delta_t$ | 优势函数与一次采样 TD 误差 |

完整约定、矩阵方向和概率归一化见[符号体系](notation.md)。原书中的少量排印与近似问题见[阅读校勘](reading-guide.md#calibration)。

## 文章中的动画与代码

每章都有可播放、可单步、可调整参数的数值实验，按其真实更新规则生成动画；没有自动播放，也不需要外部 CDN。每个对应的 Python 命令可以在仓库根目录执行：

```bash
python3 -m examples.textbook --chapter 2 --output outputs/book-ch02.json
python3 -m examples.textbook --chapter 7 --steps 500 --output outputs/book-ch07.json
```

16 个书内实验与 4 个扩展实验的索引见[实验使用说明](../labs/textbook.md)。TRPO、PPO、GRPO、GSPO 从[书外扩展](../extensions/index.md)继续；机器人问题另见[具身任务衔接](to-embodied.md)。
