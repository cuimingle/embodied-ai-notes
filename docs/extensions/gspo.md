# GSPO · 以序列为优化单位

> 书外扩展。依据 [Group Sequence Policy Optimization v2](https://arxiv.org/html/2507.18071v2)。

## 从 token 比率到长度归一化序列比率

继续使用 $\pi(\cdot\mid\cdot,\theta)$ 表示参数化策略，定义

$$
\omega_i^{\rm seq}(\theta)
=\left[\frac{\pi(y_i\mid x,\theta)}{\pi(y_i\mid x,\theta_{\rm old})}\right]^{1/|y_i|}
=\exp\left[\frac1{|y_i|}\sum_t
\ln\frac{\pi(y_{i,t}\mid x,y_{i,<t},\theta)}{\pi(y_{i,t}\mid x,y_{i,<t},\theta_{\rm old})}\right].
$$

省略 KL 正则时，使用组相对信号 $\hat\delta_i$ 的目标为

$$
\mathbb E\left[\frac1G\sum_i\min\left(
\omega_i^{\rm seq}\hat\delta_i,
\operatorname{clip}(\omega_i^{\rm seq},1-\epsilon_{\rm clip},1+\epsilon_{\rm clip})\hat\delta_i
\right)\right].
$$

它对整个回答的比率做裁剪，而不是分别裁剪每个 token。长度归一化后的比率不是原始完整轨迹的重要性权重，不能直接宣称对原始回报目标给出无偏估计。

<div class="rl-demo" data-rl-demo="gspo"><p>交互实验：逐个加入 token 的 log 比率，计算其几何平均；改变第二个 token 的比率观察差别。</p></div>

两个 token 的比率为 1.8 与 0.5 时，序列比率为 $\sqrt{0.9}\approx0.949$。它既不是算术平均，也不是完整序列比率 $0.9$。裁剪系数的数值口径因此不能机械照搬 token 级方法。

```bash
python3 -m examples.textbook --demo gspo
```

```python
import math
from examples.textbook.core import sequence_ratio

assert abs(sequence_ratio([1.8, 0.5]) - math.sqrt(0.9)) < 1e-12
```

本实验只计算比率和目标的含义，没有进行语言模型或机器人策略训练。
