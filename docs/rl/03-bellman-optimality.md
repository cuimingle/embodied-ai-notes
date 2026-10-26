# 03 · 最优状态价值与 Bellman 最优方程

> 对照：原书第 3 章，印刷页 35–56（PDF 第 48–69 页）。本章先定义最优，再用最优方程和收缩映射分析存在性、唯一性与求解方法。

## 3.1–3.2 · 最优是逐状态比较

若对所有 $s\in\mathcal S$ 都有 $v_{\pi_1}(s)\geq v_{\pi_2}(s)$，则策略 $\pi_1$ 不差于 $\pi_2$。最优策略 $\pi^*$ 要满足

$$
v_{\pi^*}(s)\geq v_\pi(s),\qquad\forall s,\ \forall\pi.
$$

原书第 3 章的最优性是这种逐状态意义的最优，不是只针对某个初始状态分布的平均表现。参数化策略的标量指标在第 9 章才正式引入。

## 3.3 · 先对策略分布最大化

原书式 (3.1) 先写成

$$
v(s)=\max_{\pi(s)\in\Pi(s)}\sum_a\pi(a\mid s)q(s,a),
\quad q(s,a)\doteq\sum_rp(r\mid s,a)r+\gamma\sum_{s'}p(s'\mid s,a)v(s').
$$

给定 $v$ 后，$q(s,a)$ 是确定的数。因为策略概率构成凸组合，

$$
\sum_a\pi(a\mid s)q(s,a)\leq\max_aq(s,a).
$$

把概率集中给一个最大值动作即可取等号。因此最优方程等价于 $v(s)=\max_aq(s,a)$。若最大值有多个动作，最优策略可以不唯一。

<div class="rl-demo" data-rl-demo="optimality"><p>交互实验：观察 s₃ 的五个动作备份值，以及最大值动作随价值估计发生的变化。</p></div>

## 3.3.3–3.3.4 · 固定点与收缩映射

沿用原书记号

$$
f(\boldsymbol v)\doteq\max_\pi(\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v),
\qquad \boldsymbol v=f(\boldsymbol v).
$$

对两个向量，最大值之差可由逐动作差的最大绝对值控制。结合转移概率和为 1，得到

$$
\|f(\boldsymbol v_1)-f(\boldsymbol v_2)\|_\infty
\leq\gamma\|\boldsymbol v_1-\boldsymbol v_2\|_\infty.
$$

所以在有限维完备空间中，收缩映射定理保证唯一固定点，并保证 $\boldsymbol v_{k+1}=f(\boldsymbol v_k)$ 从任意初值收敛。这里的无穷范数很重要，不能不加证明换成其他范数。

<div class="rl-demo" data-rl-demo="contraction"><p>交互实验：先在原书的一维例子 f(x)=cx 中观察误差收缩，再理解向量版本。</p></div>

## 3.4 · 固定点为什么对应最优价值

固定点 $\boldsymbol v^*$ 满足对任意策略 $\pi$，

$$
\boldsymbol v^*\geq\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v^*.
$$

减去策略 $\pi$ 的 Bellman 方程，再重复使用 $P_\pi\geq0$，可得

$$
\boldsymbol v^*-\boldsymbol v_\pi
\geq\gamma^nP_\pi^n(\boldsymbol v^*-\boldsymbol v_\pi)\longrightarrow0.
$$

因此 $\boldsymbol v^*\geq\boldsymbol v_\pi$。用 $\boldsymbol v^*$ 提取贪心策略便得到一个最优策略。**唯一的是最优价值，不一定是最优策略。**

## 3.5 · 折扣率与奖励共同改变最优行为

禁区可进入，意味着最优策略可能接受一次惩罚以更早持续获得目标奖励。调节上方的 $\gamma$，观察 $s_3$ 的动作比较。不要把“目标是绕开禁区”的直觉当作没有条件的最优性结论。

```bash
python3 -m examples.textbook --chapter 3 --gamma 0.9 --output outputs/book-ch03.json
python3 -m examples.textbook --demo contraction
```

下一章把固定点迭代落到[价值迭代与策略迭代](04-value-policy-iteration.md)。
