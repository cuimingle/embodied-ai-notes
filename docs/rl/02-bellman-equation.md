# 02 · 状态价值与 Bellman 方程

> 对照：原书第 2 章，印刷页 15–34（PDF 第 28–47 页）。主线依次为动机、状态价值、Bellman 方程、矩阵形式、求解方法与动作价值。

## 2.1–2.3 · 从随机回报到状态价值

同一状态出发，随机策略或随机环境会产生不同回报。原书定义

$$
v_\pi(s)\doteq\mathbb E[G_t\mid S_t=s].
$$

下标 $\pi$ 表示价值依赖所跟随的策略。它是一个条件期望，不是一条特定轨迹的回报。在平稳模型与固定策略下，它不再依赖时间下标 $t$。

## 2.4–2.5 · 一步递推与全期望

先把回报分解为

$$
G_t=R_{t+1}+\gamma G_{t+1}.
$$

对 $S_t=s$ 取条件期望，再分别展开即时奖励和未来回报。利用全期望公式与马尔可夫性，得到原书式 (2.7)：

$$
v_\pi(s)=\sum_{a\in\mathcal A}\pi(a\mid s)
\left[\sum_{r\in\mathcal R}p(r\mid s,a)r
+\gamma\sum_{s'\in\mathcal S}p(s'\mid s,a)v_\pi(s')\right].
$$

第一项对奖励求平均，第二项对下一状态求平均，然后对当前动作求平均。这里使用期望的线性性，不需要额外假设奖励与下一状态相互独立。

这是对**给定策略**做评价的方程。此处尚不对动作取最大值；寻找最优策略是下一章的问题。

## 2.6 · 矩阵与向量

沿用原书的小写向量、大写矩阵约定，定义

$$
\begin{aligned}
r_\pi(s)&\doteq\sum_a\pi(a\mid s)\sum_rp(r\mid s,a)r,\\
p_\pi(s'\mid s)&\doteq\sum_a\pi(a\mid s)p(s'\mid s,a),\\
[P_\pi]_{ij}&=p_\pi(s_j\mid s_i).
\end{aligned}
$$

把所有状态的标量方程叠起来，得到

$$
\boldsymbol v_\pi=\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v_\pi.
$$

$P_\pi$ 非负，且每一行之和为 1。行对应出发状态，列对应到达状态，不能在计算中悄悄换成转置。

## 2.7 · 闭式解与迭代解

有限状态、$0<\gamma<1$ 时，

$$
\boldsymbol v_\pi=(I-\gamma P_\pi)^{-1}\boldsymbol r_\pi.
$$

可逆性来自 Neumann 级数：$(I-\gamma P_\pi)^{-1}=I+\gamma P_\pi+\gamma^2P_\pi^2+\cdots$。数值实现通常直接解线性方程，而不显式求逆。

也可以反复执行

$$
\boldsymbol v_{k+1}=\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v_k.
$$

由于 $\|P_\pi\|_\infty=1$，误差满足 $\|\boldsymbol v_{k+1}-\boldsymbol v_\pi\|_\infty\leq\gamma\|\boldsymbol v_k-\boldsymbol v_\pi\|_\infty$。

<div class="rl-demo" data-rl-demo="evaluation"><p>交互实验：固定表 1.2 的策略，观察价值如何随评估轮次传播。</p></div>

## 2.8 · 从状态价值到动作价值

$$
\begin{aligned}
q_\pi(s,a)&\doteq\mathbb E[G_t\mid S_t=s,A_t=a],\\
v_\pi(s)&=\sum_a\pi(a\mid s)q_\pi(s,a),\\
q_\pi(s,a)&=\sum_rp(r\mid s,a)r+\gamma\sum_{s'}p(s'\mid s,a)v_\pi(s').
\end{aligned}
$$

$q_\pi$ 固定的是第一步动作，之后仍跟随 $\pi$。即使 $\pi$ 在某状态不选择某动作，该动作的 $q_\pi(s,a)$ 仍有定义。

再代入 $v_\pi(s')=\sum_{a'}\pi(a'\mid s')q_\pi(s',a')$，可得到原书 §2.8.2 的动作价值版本 Bellman 方程。

<div class="rl-demo" data-rl-demo="action-values"><p>交互实验：逐个展开 s₁ 的五个动作价值，保持后续策略不变。</p></div>

## 运行代码

```bash
python3 -m examples.textbook --chapter 2 --output outputs/book-ch02.json
python3 -m examples.textbook --demo action-values
```

```python
from examples.textbook.core import evaluate, example_policy, backup

v_pi = evaluate(example_policy(), gamma=0.9)
assert abs(v_pi[8] - 10.0) < 1e-9
assert max(abs(x-y) for x, y in zip(v_pi, backup(v_pi, example_policy(), 0.9))) < 1e-9
print(v_pi)
```

下一章：[最优状态价值与 Bellman 最优方程](03-bellman-optimality.md)。
