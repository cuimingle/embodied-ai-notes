# 06 · 随机逼近

> 对照：原书第 6 章，印刷页 101–124（PDF 第 114–137 页）。本章是 TD 方法的数学准备，不提前把随机逼近全部等同于随机梯度下降。

## 6.1 · 均值的增量表达

沿用原书以 $w_{k+1}$ 表示前 $k$ 个样本的平均值：

$$
w_{k+1}=\frac1k\sum_{i=1}^kx_i
=w_k-\frac1k(w_k-x_k).
$$

等号来自代数重排，因此取步长 $1/k$ 时，这个递推与普通样本均值完全相同。换成一般 $\alpha_k$ 后，

$$
w_{k+1}=w_k-\alpha_k(w_k-x_k)
$$

通常不再等于所有已见样本的等权平均，必须重新分析其性质。

## 6.2 · Robbins–Monro：用带噪观测求根

要求解 $g(w)=0$，只能获得带噪观测 $\tilde g(w,\eta)=g(w)+\eta$ 时，原书给出

$$
w_{k+1}=w_k-a_k\tilde g(w_k,\eta_k).
$$

对均值估计，令 $g(w)=w-\mathbb E[X]$，观测为 $w-x_k$，就得到上一节的增量算法。优化问题也能通过 $g(w)=\nabla_wJ(w)$ 写成求根问题，但一般求根问题不一定来自某个损失的完整梯度。

经典步长条件包括

$$
\sum_{k=1}^\infty a_k=\infty,\qquad
\sum_{k=1}^\infty a_k^2<\infty.
$$

它们要与原书定理 6.1 中关于函数、噪声等条件一起使用。$1/k$ 满足这组条件；常数步长不满足第二项；$1/k^2$ 不满足第一项。不能仅凭步长形式证明任意神经网络算法收敛。

<div class="rl-demo" data-rl-demo="stochastic"><p>交互实验：在相同样本流上比较常数步长、1/k 和 1/k² 的均值估计。</p></div>

## 6.3 · Dvoretzky 定理的作用

原书继续通过误差递推和条件期望分析随机序列收敛，并给出适用于多状态更新的扩展。阅读时要逐项核对：当前历史包含什么、噪声的条件均值与条件方差如何受控、每个分量是否满足步长与访问条件。

这部分为第 7 章 TD 的收敛分析提供工具。动画只展示一条有限随机轨迹，不能替代几乎必然收敛的证明。

## 6.4 · SGD 是随机逼近的特例

原书的优化目标为

$$
\min_wJ(w)=\mathbb E[f(w,X)].
$$

在允许交换求导与期望的条件下，用一个样本 $x_k$ 替代期望梯度，得到

$$
w_{k+1}=w_k-\alpha_k\nabla_w f(w_k,x_k).
$$

BGD 用全体样本梯度平均，mini-batch GD 用一小批，SGD 使用单个样本。后续策略优化是最大化指标，方向改为梯度上升；若用最小化优化器，则应明确使用负目标。

```bash
python3 -m examples.textbook --chapter 6 --steps 500 --output outputs/book-ch06.json
```

```python
from examples.textbook.core import stochastic_approximation

result = stochastic_approximation(seed=7, steps=500)
print(result["estimates"], result["truth"])
```

下一章：[Temporal-Difference 方法](07-temporal-difference.md)，将随机逼近用于 Bellman 方程。
