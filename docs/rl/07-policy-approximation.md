# 07 · Policy function approximation 与策略梯度

> 状态：整理初稿。完整轨迹概率求导与手稿中的中间步骤待接入。

## 直接参数化行为

令策略为 $\pi_\theta(a\mid s)$，目标是最大化 $J(\theta)=\mathbb E[G_0]$。离散动作可以用 softmax；连续动作可以用高斯分布，再处理动作边界与尺度。

动作的概率质量与连续概率密度需要区分。使用连续分布时，log-prob 必须对应实际采样及变换后的动作，且多个独立动作维通常需合并为联合 log-prob。

## 从轨迹概率到梯度

对有限长度轨迹 $\tau$，有 $p_\theta(\tau)=\rho_0(s_0)\prod_t\pi_\theta(a_t\mid s_t)P(s_{t+1}\mid s_t,a_t)$。若环境不依赖策略参数：

$$
\nabla_\theta\log p_\theta(\tau)
=\sum_t\nabla_\theta\log\pi_\theta(a_t\mid s_t).
$$

利用 score-function 恒等式和因果性，对从起点定义的折扣目标，可得 REINFORCE 形式：

$$
\nabla_\theta J
=\mathbb E\left[\sum_t\gamma^t
\nabla_\theta\log\pi_\theta(A_t\mid S_t)G_t\right].
$$

这里 $G_t$ 从时刻 $t$ 重新计折扣，因此外侧还有 $\gamma^t$。也有文献把折扣吸收到状态访问分布或回报记号里；对照手稿和实现时先统一目标与采样约定。

## baseline 为什么不改变期望梯度

对不依赖当前动作的 $b(s)$，有 $\mathbb E_{a\sim\pi}[\nabla\log\pi(a\mid s)b(s)]=b(s)\nabla\sum_a\pi(a\mid s)=0$。因此可将 $G_t$ 替换为 $G_t-b(S_t)$，降低估计方差。

用于 actor 更新时，baseline 或优势估计作为固定权重处理；若不恰当地让梯度穿过它，优化的就可能不再是上述估计。

## 与价值方法的连接

价值方法通过评价动作间接改进策略；策略梯度直接改变动作分布。二者可以结合：让 critic 估计 baseline 或优势，再由 actor 执行梯度更新。

**自检**：为什么不需要对环境动力学求导？为什么不能任意减去一个依赖当前动作的 baseline？

下一章：[Actor-Critic 与 GAE](08-actor-critic.md)。理论背景见[参考资料](../references.md)。
