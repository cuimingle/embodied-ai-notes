# 04 · 价值迭代与策略迭代

> 对照：原书第 4 章，印刷页 57–76（PDF 第 70–89 页）。本章顺序为 value iteration、policy iteration、truncated policy iteration。

## 4.1 · 价值迭代

原书把一次价值迭代拆成两步：

$$
\begin{aligned}
\pi_{k+1}&\in\arg\max_\pi(\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v_k),\\
\boldsymbol v_{k+1}&=\boldsymbol r_{\pi_{k+1}}+\gamma P_{\pi_{k+1}}\boldsymbol v_k.
\end{aligned}
$$

合并两步就是上一章的 $\boldsymbol v_{k+1}=f(\boldsymbol v_k)$。第一步产生当前估计下的贪心策略，第二步只做一次价值备份。它并没有把这个策略完整评估到 $\boldsymbol v_{\pi_{k+1}}$。

## 4.2 · 策略迭代

策略迭代先评估给定策略，再做贪心改进：

$$
\begin{aligned}
\boldsymbol v_{\pi_k}&=\boldsymbol r_{\pi_k}+\gamma P_{\pi_k}\boldsymbol v_{\pi_k},\\
\pi_{k+1}&\in\arg\max_\pi(\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v_{\pi_k}).
\end{aligned}
$$

改进策略满足 $T_{\pi_{k+1}}\boldsymbol v_{\pi_k}\geq\boldsymbol v_{\pi_k}$，反复应用单调算子并取极限，得到 $\boldsymbol v_{\pi_{k+1}}\geq\boldsymbol v_{\pi_k}$。这里 $T_\pi\boldsymbol v$ 只是对 $\boldsymbol r_\pi+\gamma P_\pi\boldsymbol v$ 的简写。

如果只是近似评估，不能把精确策略改进结论原封不动搬过来。实现也需要固定平局处理，避免在等价动作之间反复切换。

## 4.3 · 截断策略迭代把两者连接起来

固定本轮策略后，以当前价值为初值做 $m$ 次评估：

$$
\boldsymbol v^{(0)}=\boldsymbol v_k,\qquad
\boldsymbol v^{(j+1)}=\boldsymbol r_{\pi_{k+1}}+\gamma P_{\pi_{k+1}}\boldsymbol v^{(j)},
\quad j=0,\ldots,m-1.
$$

最后取 $\boldsymbol v_{k+1}=\boldsymbol v^{(m)}$。$m=1$ 对应价值迭代；把评估做充分，或直接解线性方程，就得到策略迭代的评估步骤。不能仅比较外层轮数就断言哪个方法更快，因为每轮计算量不同。

<div class="rl-demo" data-rl-demo="iteration"><p>交互实验：切换一次评估、三次评估和精确评估，观察同一个环境中的价值传播。</p></div>

## 运行与核对

```bash
python3 -m examples.textbook --chapter 4 --steps 120 --output outputs/book-ch04.json
```

```python
from examples.textbook.core import planning

vi = planning(iterations=240)
pi = planning(exact=True)
assert max(abs(x-y) for x, y in zip(vi["values"], pi["values"])) < 1e-7
print(vi["values"][8])  # The continuing target value is 10 when gamma=0.9.
```

公共实现从 $\boldsymbol v_0=0$ 诱导初始贪心策略，再进入评估与改进循环；精确评估使用带主元选择的线性方程求解。它属于原书模型设定下的教学实现，不复刻书中所有大地图实验。

下一章：[Monte Carlo 方法](05-monte-carlo.md)，用采样回报替代模型期望。
