# 08 · 价值函数方法

> 对照：原书第 8 章，印刷页 151–190（PDF 第 164–203 页）。顺序为表示方式、状态价值 TD、动作价值逼近、deep Q-learning。

## 8.1 · 从表格表示到函数表示

沿用原书，真实价值写作 $v_\pi(s)$，近似价值写作 $\hat v(s,w)$。$w$ 是待学习的参数向量，而不是某个状态的下标。线性近似器为

$$
\hat v(s,w)=\phi^{\mathsf T}(s)w.
$$

若 $\phi(s_i)$ 是第 $i$ 个 one-hot 向量，$\hat v(s_i,w)=w_i$，便恢复表格方法。共享特征则让一次更新影响多个状态，既带来泛化，也带来表示误差。

## 8.2 · 从误差目标走到可实施的 TD 更新

原书先讨论

$$
J(w)=\mathbb E[(v_\pi(S)-\hat v(S,w))^2].
$$

必须明确 $S$ 的分布。均匀分布给每个状态等权；原书重点采用策略诱导的平稳分布 $d_\pi$，其条件是 $d_\pi^{\mathsf T}P_\pi=d_\pi^{\mathsf T}$。平稳分布的唯一性与长期极限还需要马尔可夫链的相应条件。

真实 $v_\pi$ 不可直接获取，所以用 MC 回报或 TD 目标替代。原书式 (8.13) 为

$$
w_{t+1}=w_t+\alpha_t
\left[r_{t+1}+\gamma\hat v(s_{t+1},w_t)-\hat v(s_t,w_t)\right]
\nabla_w\hat v(s_t,w_t).
$$

线性情况下，梯度就是 $\phi(s_t)$。这是半梯度更新：只对当前预测求导，不沿自举目标反向传播。

<div class="rl-demo" data-rl-demo="approximation"><p>交互实验：在固定均匀策略下运行 TD，比较 one-hot、线性与二次共享特征的拟合结果。</p></div>

本页采用原书式 (8.15)、(8.16) 的多项式特征：将列、行坐标归一化到 $[-1,1]$，分别取 $\phi(s)=[1,x,y]^{\mathsf T}$ 与 $\phi(s)=[1,x,y,x^2,y^2,xy]^{\mathsf T}$，在第 1 章的 3×3 环境中观察参数共享。均匀随机策略在这个对称转移格子中诱导均匀平稳分布；图中的 RMSE 是全状态诊断指标，真实价值只用于画参考线，不参与 TD 更新。原书的更大地图与傅里叶特征实验另行扩充。

## 8.2.5 · TD 实际解什么问题

原书明确指出：上面的 TD 更新一般**不直接最小化**最初的价值平方误差。在线性情形，定义特征矩阵 $\Phi$、平稳分布对角矩阵 $D$，可将期望更新写成

$$
\begin{aligned}
A&=\Phi^{\mathsf T}D(I-\gamma P_\pi)\Phi,\qquad
b=\Phi^{\mathsf T}D\boldsymbol r_\pi,\\
w_{t+1}&=w_t+\alpha_t(b-Aw_t).
\end{aligned}
$$

在特征满秩、状态覆盖与原书相应条件成立时，分析得到 TD 固定点 $Aw^*=b$，并联系投影 Bellman 误差。不能把这一结果不加条件地推广到任意非线性网络、off-policy 数据或任意常数步长。

## 8.3 · 动作价值的函数逼近

将 $\hat v(s,w)$ 换成 $\hat q(s,a,w)$，可得到 Sarsa 和 Q-learning 的函数逼近形式。例如 Q-learning 使用

$$
w_{t+1}=w_t+\alpha_t\left[
r_{t+1}+\gamma\max_a\hat q(s_{t+1},a,w_t)-\hat q(s_t,a_t,w_t)
\right]\nabla_w\hat q(s_t,a_t,w_t).
$$

目标中的最大化、自举和参数共享共同改变稳定性，表格方法的收敛结论不能直接继承。

## 8.4 · DQN：冻结目标与经验回放

按原书使用主网络参数 $w$ 和目标网络参数 $w_T$：

$$
y_T=r+\gamma\max_a\hat q(s',a,w_T),\qquad
J(w)=\mathbb E[(y_T-\hat q(S,A,w))^2].
$$

优化时固定 $w_T$，每隔若干次更新同步 $w_T\leftarrow w$；从回放缓冲区中随机取小批量样本。均匀抽取缓冲区条目，不意味着状态动作对在整个空间上变成均匀分布。

<div class="rl-demo" data-rl-demo="dqn-target"><p>交互实验：用两个小数值表隔离展示主估计更新与目标估计冻结；切换同步周期。</p></div>

第二个动画只有数值表，不包含神经网络，因此只验证目标冻结机制。实际 DQN 训练、回放分布对照及原书全部深度网络实验尚未实现。

```bash
python3 -m examples.textbook --chapter 8 --steps 5000 --output outputs/book-ch08.json
python3 -m examples.textbook --demo dqn-target --steps 40
```

下一章：[策略梯度方法](09-policy-gradient.md)，开始直接参数化策略。
