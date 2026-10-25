# 08 · Actor-Critic 与 GAE

> 状态：整理初稿。实现与多种子实验待补。

## 两个函数承担什么工作

Actor $\pi_\theta$ 选择动作，critic $V_w$ 或 $Q_w$ 估计长期效果。简单的一步 actor-critic 可用 TD 误差作为优势的近似：

$$
\delta_t=r_{t+1}+\gamma(1-d_t)V_w(s_{t+1})-V_w(s_t).
$$

Actor 用 $\delta_t\nabla_\theta\log\pi_\theta(a_t\mid s_t)$ 的方向改进策略，critic 用 TD 目标更新价值。折扣权重和状态采样沿用上一章的约定。

当 critic 不准确时，策略信号也会受到影响。引入 critic 可以减少采样方差，同时引入估计误差与自举偏差，并不自动使训练稳定。

## GAE 如何结合多个时间尺度

沿真实轨迹，广义优势估计对 TD 残差做加权求和：

$$
\hat A_t^{\mathrm{GAE}(\gamma,\lambda)}
=\sum_{l=0}^{L-1}(\gamma\lambda)^l\delta_{t+l}.
$$

该表达要求不越过 episode 边界。$\lambda=0$ 只用一步残差；增大 $\lambda$ 纳入更远信号。取 $\lambda=1$ 且轨迹完整终止时，和式可化为回报减去当前价值；截断的 rollout 仍需边界自举。

原始定义与分析见 [GAE 论文](https://arxiv.org/abs/1506.02438)。

## 两种 mask 不要混用

计算 $\delta_t$ 的未来价值时，只有真正终止才置零。反向递推优势时，则要在 episode 边界停止，避免把 reset 后的新 episode 串入旧轨迹。

因此因时间限制截断的一步可以从最后状态自举，但不应继续累加 reset 后新轨迹的优势。批次末尾结束采样时同样要使用最后一个有效状态，而非重置后的观测。

## 准备给 PPO 使用的数据

采样阶段保存观测、动作、旧策略 log-prob、旧价值、奖励和边界。根据旧 rollout 计算优势与价值目标，并在优化同一批数据时保持其语义一致。优势归一化是额外工程选择，需要单独记录。

**自检**：critic 的训练目标与 actor 的优化目标是否相同？截断时为什么“继续价值自举”和“停止优势串接”可以同时成立？

下一章：[TRPO](09-trpo.md)。
