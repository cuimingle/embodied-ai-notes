# 10 · Proximal Policy Optimization

> 状态：整理初稿。尚未实现 PPO 训练；下一步补手稿中的分段目标和数值实验。

## PPO-Clip 的目标

令 $r_t(\theta)=\exp(\log\pi_\theta(a_t\mid s_t)-\log\pi_{\mathrm{old}}(a_t\mid s_t))$。本章使用 PPO-Clip：

$$
L^{\mathrm{clip}}(\theta)=\mathbb E_t\left[
\min\left(r_t\hat A_t,
\operatorname{clip}(r_t,1-\epsilon,1+\epsilon)\hat A_t\right)\right].
$$

它是最大化目标，优化器若做最小化，就使用负号。实践通常还包含价值损失与熵项，应分别记录系数、符号和更新范围。定义见 [PPO 原论文](https://arxiv.org/abs/1707.06347)。

## 用正负优势看裁剪

取 $\epsilon=0.2$。若 $\hat A_t=2,r_t=1.4$，两项分别为 $2.8$ 和 $2.4$，最终取 $2.4$，减少继续增大该概率的激励。若 $\hat A_t=-2,r_t=0.6$，两项为 $-1.2$ 和 $-1.6$，取 $-1.6$，抑制继续减小该概率的收益。

裁剪只改变部分样本的代理目标形状，不会把所有实际概率比率硬性锁在区间内，也不构成全局 KL 的硬约束。一次更新会通过共享参数影响许多状态与动作。

## 同一批数据为什么能更新多轮

采样策略固定为 $\pi_{\mathrm{old}}$。优势与旧 log-prob 随批次保存，优化时更新当前策略并重新计算比率。若每轮把旧 log-prob 替换成当前值，比率会被错误地重置。

数据可以在一轮采样后的若干 epoch 内重复使用；完成后通常重新采样。PPO 因而仍通常归为 on-policy 方法。实现背景见 [Spinning Up PPO](https://spinningup.openai.com/en/latest/algorithms/ppo.html)。

## 需要观察的信号

同时观察任务表现、价值误差、优势尺度、近似 KL、裁剪比例与熵。高训练回报不能代替独立评测。KL 提前停止、价值裁剪和优势归一化属于实现选择，不应把它们全部当成 PPO-Clip 定义的一部分。

**自检**：为什么优势为负时也必须仔细分析 `min`？为什么 PPO 多轮优化不等于可以无限复用历史数据？

下一章：[GRPO](11-grpo.md)。
