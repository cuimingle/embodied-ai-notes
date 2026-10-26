# TRPO · 用 KL 约束控制策略更新

> 书外扩展。前置：教材第 9、10 章。原始依据：[Trust Region Policy Optimization](https://arxiv.org/abs/1502.05477)。

## 从策略梯度到受约束更新

旧策略生成的数据只覆盖其访问的状态。一次更新过大时，代理目标对新策略实际表现的解释可能变差。定义同一状态下的动作概率比率

$$
\omega(\theta;s,a)=\frac{\pi(a\mid s,\theta)}{\pi(a\mid s,\theta_{\rm old})}.
$$

本文用 $\omega$ 表示概率比率，避免与教材中折扣状态访问权重 $\rho_\pi$ 混淆；原论文的优势记号统一写为教材的 $\delta_\pi$。

一种实用的约束代理形式为

$$
\max_\theta\ \mathbb E_{s\sim d_{\rm old},a\sim\pi_{\rm old}}
[\omega(\theta;s,a)\delta_{\pi_{\rm old}}(s,a)]
$$

$$
\text{s.t.}\quad\mathbb E_{s\sim d_{\rm old}}
[D_{\rm KL}(\pi_{\rm old}(\cdot\mid s)\|\pi(\cdot\mid s,\theta))]\leq\kappa.
$$

$d_{\rm old}$ 是这里使用的状态采样分布；动作比率没有精确修正所有状态访问分布变化。$\kappa$ 是本篇引入的 KL 预算。

## 局部近似与算法

对目标做一阶展开、对 KL 做二阶展开，可得到与局部曲率矩阵 $F$ 相关的方向 $F^{-1}g$。实际 TRPO 使用 Hessian-vector product、共轭梯度与回溯线搜索。理论界、平均 KL 近似和有限样本优化分别有条件，不宣称每一步实测回报都单调上升。

<div class="rl-demo" data-rl-demo="trpo"><p>交互实验：旧 Bernoulli 策略选择 a₂ 的概率为 0.4，扫描新概率，观察其 KL 是否超过预算。</p></div>

```bash
python3 -m examples.textbook --demo trpo
```

```python
from examples.textbook.core import bernoulli_kl

print(bernoulli_kl(0.4, 0.5))
```

本实验只计算分布差异，没有共轭梯度或环境训练。下一篇：[PPO](ppo.md)。
