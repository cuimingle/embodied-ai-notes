# 10 · Actor-Critic 方法

> 对照：原书第 10 章，印刷页 215–236（PDF 第 228–249 页）。顺序为 QAC、A2C、off-policy actor-critic、deterministic actor-critic。

## 10.1 · QAC：把动作价值估计交给 critic

上一章策略更新需要动作价值。若用 MC 估计它，得到 REINFORCE；若用 TD 学习估计它，就进入 actor-critic。原书算法框在本章常省略估计函数的帽子，写作 $q(s,a,w)$、$v(s,w)$；这里仍表示带参数的估计器。

QAC 的 actor 与 critic 分别更新：

$$
\begin{aligned}
\theta_{t+1}&=\theta_t+\alpha_\theta\nabla_\theta\ln\pi(a_t\mid s_t,\theta_t)q(s_t,a_t,w_t),\\
w_{t+1}&=w_t+\alpha_w[r_{t+1}+\gamma q(s_{t+1},a_{t+1},w_t)-q(s_t,a_t,w_t)]
\nabla_wq(s_t,a_t,w_t).
\end{aligned}
$$

后一个式子是 Sarsa 型价值估计。两个函数可以采用不同参数、不同步长，也可以有不同的近似误差。

## 10.2.1 · baseline 不改变梯度期望

若 $b(s)$ 不依赖当前动作，

$$
\sum_a\pi(a\mid s,\theta)\nabla_\theta\ln\pi(a\mid s,\theta)b(s)
=b(s)\nabla_\theta\sum_a\pi(a\mid s,\theta)=0.
$$

因此可以用 $q_\pi(s,a)-b(s)$ 替换策略梯度里的动作价值。原书给出的最小方差 baseline 带有 $\|\nabla_\theta\ln\pi\|^2$ 权重；取 $b(s)=v_\pi(s)$ 是更方便的选择，不能称为所有情形下的精确最优 baseline。

## 10.2.2 · 原书的优势记号是 δπ

$$
\delta_\pi(s,a)\doteq q_\pi(s,a)-v_\pi(s).
$$

它与其他资料中的 $A^\pi$ 对应，但本文主线采用原书的 $\delta_\pi$。真正的优势函数是条件期望；一次采样得到的 TD 误差 $\delta_t$ 是它的估计，二者不能直接混为同一个量。

原书算法 10.2 为

$$
\begin{aligned}
\delta_t&=r_{t+1}+\gamma v(s_{t+1},w_t)-v(s_t,w_t),\\
\theta_{t+1}&=\theta_t+\alpha_\theta\delta_t\nabla_\theta\ln\pi(a_t\mid s_t,\theta_t),\\
w_{t+1}&=w_t+\alpha_w\delta_t\nabla_wv(s_t,w_t).
\end{aligned}
$$

<div class="rl-demo" data-rl-demo="actor-critic"><p>交互实验：在单状态持续 MDP 中，让 actor 改变动作概率，同时观察 critic 跟踪当前策略的价值。</p></div>

这里是算法 10.2 的可手算特例：$v(s,w)=w$，$\nabla_wv=1$。目标曲线会随 actor 的策略改变，因此 critic 追踪的不是一个始终固定的数。

## 10.3 · Off-policy：先理解重要性采样

若目标分布为 $p_0$，样本来自 $p_1$，则在支持覆盖且期望存在的条件下，

$$
\mathbb E_{X\sim p_0}[X]
=\mathbb E_{X\sim p_1}\left[\frac{p_0(X)}{p_1(X)}X\right].
$$

<div class="rl-demo" data-rl-demo="importance"><p>交互实验：目标分布对 ±1 等概率，行为分布偏向 +1；比较直接均值与重要性加权均值。</p></div>

原书以 $\beta(a\mid s)$ 表示行为策略，actor 与 critic 更新都引入动作权重 $\pi(a_t\mid s_t,\theta_t)/\beta(a_t\mid s_t)$。动作权重修正不等于自动完成状态访问分布修正；原书定理 10.1 还定义了相应的折扣状态权重 $\rho$。推导、理想采样条件与实际算法需要分别记录。

## 10.4 · 确定性策略输出动作本身

原书用 $a=\mu(s,\theta)$ 表示确定性策略，而不是动作概率。其梯度模板为

$$
\nabla_\theta J(\theta)
=\sum_s\eta(s)\nabla_\theta\mu(s,\theta)
\left.\nabla_aq_\mu(s,a)\right|_{a=\mu(s,\theta)}.
$$

指标与状态权重 $\eta$ 按原书定理 10.3、10.4 的具体情形确定；转为归一化概率期望时需保留相应比例系数。连续动作下，先对动作求导，再代入 $a=\mu(s,\theta)$。critic 的目标动作来自目标策略，而采样动作可以来自另一行为策略。

当前可运行实现覆盖单状态 A2C 与重要性采样；QAC、一般 off-policy actor-critic 和连续动作训练暂只给出机制与公式，不标为已复现。

```bash
python3 -m examples.textbook --chapter 10 --steps 1000 --output outputs/book-ch10.json
python3 -m examples.textbook --demo importance --steps 500
```

书内主线到这里结束。GAE、TRPO、PPO、GRPO、GSPO 属于[书外扩展](../extensions/index.md)，继续沿用本书已有符号，并单独声明新增记号与假设。
