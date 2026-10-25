# 05 · Temporal Difference、SARSA 与 Q-learning

> 状态：整理初稿。Q-learning 已有教学实现，TD(0) 与 SARSA 对照实验待补。

## 从完整回报改为一步自举

TD(0) 评估固定策略时，用 $R_{t+1}+\gamma V(S_{t+1})$ 估计完整回报：

$$
\delta_t=R_{t+1}+\gamma V(S_{t+1})-V(S_t),\qquad
V(S_t)\leftarrow V(S_t)+\alpha\delta_t.
$$

TD 目标混合了真实奖励和已有价值估计。它无需等待整个 episode 结束，但估计误差会通过自举传播。

## SARSA 与 Q-learning 改变了哪个目标

$$
\begin{aligned}
y_t^{\text{SARSA}}&=R_{t+1}+\gamma Q(S_{t+1},A_{t+1}),\\
y_t^{\text{Q-learning}}&=R_{t+1}+\gamma\max_{a'}Q(S_{t+1},a').
\end{aligned}
$$

两者都做 $Q\leftarrow Q+\alpha(y-Q)$。SARSA 使用当前行为策略实际选择的下一动作；Q-learning 用下一状态的贪心动作构造目标。探索行为与目标策略因此可以不同。

Off-policy 并不自动意味着能够在固定离线数据上可靠学习。离线数据缺少覆盖时，价值最大化还可能利用未经数据支持的动作估计。

## 终止与截断

真正终止时，目标不再包含未来价值；因采样时长限制而停止时，若建模目标仍是未结束的过程，应从截断前的最后观测自举：

$$
y_t=R_{t+1}+\gamma(1-\mathrm{terminated}_t)V(S_{t+1}).
$$

`terminated or truncated` 用于决定是否重置；两者的合并结果通常不应直接充当价值目标的 mask。若有限时域本身就是任务的一部分，则还需在状态里表达剩余时间，并按真正终止处理。

这一语义遵循 [Gymnasium 的时间限制说明](https://gymnasium.farama.org/tutorials/gymnasium_basics/handling_time_limits/)。本项目 GridWorld 的步数上限是采样截断，目标到达才是真正终止。

## 实验中检查什么

运行 Q-learning 后关闭探索再评测，检查是否到达目标、用了多少步、累计奖励是多少。训练中探索造成的绕路，不能当作最终贪心策略的路径长度。

有限表格 Q-learning 的经典收敛结论要求充分访问、合适步长等条件。本项目使用常数步长做教学实验，测试通过只说明固定任务与配置的结果。

**自检**：为什么同一条状态转移在 SARSA 和 Q-learning 中可能产生不同目标？超时后为什么可能仍然需要未来价值？

下一章：[价值函数逼近](06-value-approximation.md)。配套[实验](../labs/gridworld.md)。
