# 05 · Monte Carlo 方法

> 对照：原书第 5 章，印刷页 77–100（PDF 第 90–113 页）。顺序为均值估计、MC Basic、MC Exploring Starts、MC ε-Greedy，以及探索与利用。

## 5.1 · 先理解均值估计

设 $X$ 为随机变量，$x_1,\ldots,x_n$ 是独立同分布样本。用

$$
\bar x=\frac1n\sum_{i=1}^n x_i
$$

估计 $\mathbb E[X]$。大数定律说明样本数增长时的性质，不说明有限样本一定准确。独立样本情况下，样本均值的方差为 $\operatorname{var}(X)/n$。

## 5.2 · MC Basic：用采样代替模型期望

第 4 章需要已知模型来评估策略。本章固定一个状态动作对 $(s,a)$，第一步执行 $a$，之后跟随策略 $\pi$，得到回报样本 $g_1,\ldots,g_n$，再计算

$$
q_\pi(s,a)\approx\frac1n\sum_{i=1}^n g_i.
$$

MC Basic 的核心顺序是：为各个状态动作对收集多条轨迹、估计动作价值、贪心更新策略。它保留了策略迭代的“评价—改进”结构，只是不再直接使用模型求和。

<div class="rl-demo" data-rl-demo="mc"><p>交互实验：从固定的 (s₁,a₂) 采样多条轨迹，看回报均值如何接近对应的 qπ。</p></div>

动画的后续策略是均匀随机策略。目标是持续任务中的动作价值，轨迹只采样前 $H$ 步；因为 $|r|\leq1$，被忽略的尾项有界：

$$
\left|\sum_{k=H}^\infty\gamma^k r_{t+k+1}\right|\leq\frac{\gamma^H}{1-\gamma}.
$$

因此有限 $H$ 的估计不是无限回报的严格无偏估计。切换 $H=20$ 和 $H=80$，同时观察采样波动与截断误差界。

## 5.3 · MC Exploring Starts：更充分地使用轨迹

原书先说明同一条轨迹可以为沿途多个状态动作对提供回报，再将策略改进提前到每条轨迹之后。Exploring starts 要求不同状态动作对有充分的起始探索。

First-visit 只使用一条轨迹里某状态动作对的第一次访问；every-visit 使用所有访问。原书 MC Exploring Starts 的伪代码采用 every-visit。倒序递推回报时，不要把 first-visit 错写成 last-visit；同一轨迹内的多个回报也不是彼此独立的样本。

## 5.4 · MC ε-Greedy：把探索放进策略

设 $m=|\mathcal A(s)|$，选定一个贪心动作 $a^*$。原书的策略为

$$
\pi(a\mid s)=\begin{cases}
1-\epsilon+\epsilon/m,&a=a^*,\\
\epsilon/m,&a\ne a^*.
\end{cases}
$$

先以概率 $1-\epsilon$ 利用贪心动作，再以概率 $\epsilon$ 从所有动作中均匀选择；第二步仍可能选到贪心动作。因此贪心动作的总概率不是单纯的 $1-\epsilon$。

<div class="rl-demo" data-rl-demo="epsilon"><p>交互实验：调整 ε，比较理论动作概率与同一随机种子下的实际采样频率。</p></div>

## 5.5 · 探索与利用的条件

探索策略给动作正概率，有助于覆盖状态动作空间，但还需要环境中的可达性和足够长的采样过程。不能只看到 $\epsilon>0$ 就断言每个状态一定得到充分访问。

```bash
python3 -m examples.textbook --chapter 5 --steps 300 --output outputs/book-ch05.json
python3 -m examples.textbook --demo epsilon
```

```python
from examples.textbook.core import epsilon_greedy, monte_carlo

print(epsilon_greedy([1, 3, 2, -1, 0], epsilon=0.2))
result = monte_carlo(samples=300, horizon=80)
print(result["estimate"], result["truth"], result["tail_bound"])
```

下一章：[随机逼近](06-stochastic-approximation.md)，把“先收集再求平均”改成逐样本更新。
