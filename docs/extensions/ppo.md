# PPO · 裁剪代理目标与优势估计

> 书外扩展。前置：教材第 10 章。依据：[PPO 原论文](https://arxiv.org/abs/1707.06347) 与 [GAE 原论文](https://arxiv.org/abs/1506.02438)。

## 用书内符号写 PPO-Clip

令 $\hat\delta_t$ 是优势估计，$\omega_t(\theta)$ 是新旧策略对同一个采样动作的概率比率。最大化目标为

$$
L^{\rm clip}(\theta)=\mathbb E_t\left[
\min\left(\omega_t\hat\delta_t,
\operatorname{clip}(\omega_t,1-\epsilon_{\rm clip},1+\epsilon_{\rm clip})\hat\delta_t\right)\right].
$$

这里 $\epsilon_{\rm clip}$ 是裁剪系数，区别于书内 ε-greedy 的探索概率。使用最小化优化器时，要给这个最大化目标加负号。

取 $\hat\delta_t=2$、$\omega_t=1.4$、$\epsilon_{\rm clip}=0.2$，未裁剪值为 2.8，最终取 2.4。负优势需要重新分析 `min` 的分支，不能仅靠正优势直觉判断。

<div class="rl-demo" data-rl-demo="ppo"><p>交互实验：切换优势正负号和裁剪系数，逐段绘制未裁剪项与 PPO 代理目标。</p></div>

## 从教材的 TD 误差继续到 GAE

教材第 10 章使用一次 TD 误差估计优势。GAE 对同一轨迹上的残差做加权组合：

$$
\hat\delta_t^{\rm GAE}=\sum_{l\geq0}(\gamma\lambda)^l\delta_{t+l},\qquad
\delta_t=r_{t+1}+\gamma v(s_{t+1},w)-v(s_t,w).
$$

$\lambda$ 是本节新增的迹衰减参数。真正终止时不再自举；持续任务的采样截断可从最后观测自举，但不能继续累加 reset 后新 episode 的残差。GAE 属于扩展内容，不放回教材第 10 章冒充原书公式。

## 从目标函数到训练还缺什么

实际训练需要旧策略 log-prob、rollout、价值目标、小批量更新与重新采样。重复使用一批数据时旧 log-prob 保持固定。裁剪改变部分样本的目标形状，并没有把所有比率强制锁在区间内，也不提供全局 KL 硬约束。

```bash
python3 -m examples.textbook --demo ppo
```

```python
from examples.textbook.core import ppo_objective

assert abs(ppo_objective(1.4, 2.0) - 2.4) < 1e-12
assert abs(ppo_objective(0.6, -2.0) + 1.6) < 1e-12
```

本实验验证代理目标的分段计算，不包含 PPO 训练器。
