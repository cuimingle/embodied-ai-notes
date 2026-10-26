# 09 · 策略梯度方法

> 对照：原书第 9 章，印刷页 191–214（PDF 第 204–227 页）。依次讨论策略表示、优化指标、指标梯度与 REINFORCE。

## 9.1 · 从策略表到策略函数

原书写作 $\pi(a\mid s,\theta)$，通过改变参数 $\theta$ 来改变动作概率。常见表示为

$$
\pi(a\mid s,\theta)=\frac{e^{h(s,a,\theta)}}{\sum_{a'}e^{h(s,a',\theta)}}.
$$

与第 3 章的无约束策略表不同，函数表示不一定能同时实现每个状态的最大价值，因此先定义一个需要最大化的标量指标 $J(\theta)$。

## 9.2 · 先选择指标，再计算梯度

原书区分固定状态权重 $d_0$ 与策略相关的平稳分布 $d_\pi$：

$$
\begin{aligned}
\bar v_\pi^0&=\sum_s d_0(s)v_\pi(s),\\
\bar v_\pi&=\sum_s d_\pi(s)v_\pi(s),\\
\bar r_\pi&=\sum_s d_\pi(s)r_\pi(s).
\end{aligned}
$$

两种平均价值的权重并不相同。对平稳分布加权的折扣价值，左乘 Bellman 方程可得

$$
\bar r_\pi=(1-\gamma)\bar v_\pi.
$$

这一关系依赖 $d_\pi^{\mathsf T}P_\pi=d_\pi^{\mathsf T}$，不能把 $d_\pi$ 任意换成 $d_0$ 后继续使用。

## 9.3.1 · 折扣情形：状态权重必须写清楚

沿原书式 (9.19)，定义未归一化折扣访问权重

$$
\rho_\pi(s)=\sum_{s'}d_0(s')\sum_{k=0}^\infty\gamma^k[P_\pi^k]_{s's}.
$$

固定 $d_0$ 时，梯度可严格写为

$$
\nabla_\theta\bar v_\pi^0
=\sum_s\rho_\pi(s)\sum_a\nabla_\theta\pi(a\mid s,\theta)q_\pi(s,a).
$$

由于 $\sum_s\rho_\pi(s)=1/(1-\gamma)$，它不是已归一化的概率分布。若令 $\tilde\rho_\pi=(1-\gamma)\rho_\pi$，则

$$
\nabla_\theta\bar v_\pi^0
=\frac1{1-\gamma}\mathbb E_{S\sim\tilde\rho_\pi,A\sim\pi}
[\nabla_\theta\ln\pi(A\mid S,\theta)q_\pi(S,A)].
$$

这保留原书的 $\rho_\pi$ 定义，同时显式写出从加权和转为概率期望时的比例因子。见[阅读校勘](reading-guide.md)。

原书定理 9.3 对平稳分布加权、折扣情形下的平均奖励梯度使用近似：

$$
\nabla_\theta\bar r_\pi\approx
\mathbb E_{S\sim d_\pi,A\sim\pi}
[\nabla_\theta\ln\pi(A\mid S,\theta)q_\pi(S,A)].
$$

这里的 $\approx$ 不能改写成无条件的等号；原书 §9.3.1 说明了关于 $\gamma$ 与分布导数项的讨论。

## 9.3.2 · 不折扣时要重新定义价值

当 $\gamma=1$，直接累加未来奖励可能发散。原书改用减去平均奖励后的差分价值，并得到 Poisson 方程

$$
\boldsymbol v_\pi=\boldsymbol r_\pi-\bar r_\pi\boldsymbol1+P_\pi\boldsymbol v_\pi.
$$

这与前几章的折扣价值不是同一个定义。差分价值需要相应的马尔可夫链条件，且通常还需固定一个加法常数来确定代表解。

## 9.4 · REINFORCE 用回报样本代替动作价值

利用 $\nabla_\theta\pi=\pi\nabla_\theta\ln\pi$，把理论梯度转为样本更新。原书算法 9.1 先生成一条轨迹，再计算

$$
q_t(s_t,a_t)=\sum_{k=t+1}^{T}\gamma^{k-t-1}r_k,
\qquad
\theta\leftarrow\theta+\alpha\nabla_\theta\ln\pi(a_t\mid s_t,\theta)q_t(s_t,a_t).
$$

原书也指出实际轨迹采样未必严格满足理想的状态分布条件。不能省略这层说明，宣称任意轨迹遍历方式都给出固定初始分布目标的无偏梯度；不同折扣约定也不能通过随意添加或删除 $\gamma^t$ 混用。

<div class="rl-demo" data-rl-demo="policy-gradient"><p>交互实验：在单状态、双动作的持续 MDP 中，比较精确梯度与样本梯度对策略概率的影响。</p></div>

该实验优化平均奖励 $\bar r_\pi$。令 $p=\pi(a_2\mid s,\theta)=\operatorname{sigmoid}(\theta)$，两个动作的奖励为 0 和 1，则 $\bar r_\pi=p$，精确梯度为 $p(1-p)$。样本更新使用 $r(a-p)$，其期望恰好等于该梯度。这里验证的是可手算的指标与梯度，不声称完成一般 MDP 的 REINFORCE 复现。

```bash
python3 -m examples.textbook --chapter 9 --steps 300 --output outputs/book-ch09.json
```

下一章：[Actor-Critic 方法](10-actor-critic.md)，把 MC 价值估计换成 TD 估计。
