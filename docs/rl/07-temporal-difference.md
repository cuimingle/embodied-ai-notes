# 07 · Temporal-Difference 方法

> 对照：原书第 7 章，印刷页 125–150（PDF 第 138–163 页）。顺序为状态价值 TD、Sarsa、n-step Sarsa、Q-learning、统一视角。

## 7.1 · TD 学习给定策略的状态价值

对策略 $\pi$，Bellman 方程可写为

$$
v_\pi(s)=\mathbb E[R_{t+1}+\gamma v_\pi(S_{t+1})\mid S_t=s].
$$

用样本 $s_t,r_{t+1},s_{t+1}$ 构造随机逼近，得到原书式 (7.1)：

$$
v_{t+1}(s_t)=v_t(s_t)-\alpha_t(s_t)
\left[v_t(s_t)-\left(r_{t+1}+\gamma v_t(s_{t+1})\right)\right].
$$

未访问状态保持 $v_{t+1}(s)=v_t(s)$。记 TD 误差为 $\delta_t=r_{t+1}+\gamma v_t(s_{t+1})-v_t(s_t)$，更新也可写成 $v_{t+1}(s_t)=v_t(s_t)+\alpha_t(s_t)\delta_t$。

## 7.2 · Sarsa：把状态价值换成动作价值

$$
q_{t+1}(s_t,a_t)=q_t(s_t,a_t)+\alpha_t(s_t,a_t)
\left[r_{t+1}+\gamma q_t(s_{t+1},a_{t+1})-q_t(s_t,a_t)\right].
$$

这里使用实际按策略抽到的下一动作 $a_{t+1}$。固定策略时，它估计 $q_\pi$；结合策略改进之后，才形成用于控制的 Sarsa。要把“策略评估”与“策略更新”分别说清楚。

## 7.3 · n-step Sarsa 连接一步 TD 与 MC

$$
G_t^{(n)}\doteq\sum_{i=1}^n\gamma^{i-1}R_{t+i}
+\gamma^nq_\pi(S_{t+n},A_{t+n}).
$$

$n=1$ 是一步 Sarsa 的目标结构；随着采样长度增加，更多未来奖励由真实样本提供，更少依赖价值自举。随机环境中，不同 $G_t^{(n)}$ **通常不是同一个样本值**；使用真实 $q_\pi$ 且遵循同一策略时，它们的条件期望相同。详见[阅读校勘](reading-guide.md)。

<div class="rl-demo" data-rl-demo="n-step"><p>交互实验：在确定性路径上逐步展开采样奖励与精确自举尾项，观察二者怎样组成同一个目标。</p></div>

## 7.4 · Q-learning 直接对应最优方程

$$
q_{t+1}(s_t,a_t)=q_t(s_t,a_t)+\alpha_t(s_t,a_t)
\left[r_{t+1}+\gamma\max_aq_t(s_{t+1},a)-q_t(s_t,a_t)\right].
$$

与 Sarsa 的区别在目标：使用下一动作价值，还是下一状态的最大动作价值。Q-learning 的行为策略可以探索，而自举目标对应贪心策略，因此可以 off-policy 地更新。

<div class="rl-demo" data-rl-demo="td"><p>交互实验：在同一个持续任务里切换 TD、Sarsa 与 Q-learning，核对每一步的状态、奖励、目标和误差。</p></div>

## 7.5 · 从统一视角检查算法

| 方法 | 对应的方程 | 使用的未来信号 |
| --- | --- | --- |
| MC 评估 | 回报的条件期望定义 | 采样回报 |
| TD(0) | 状态价值 Bellman 方程 | 下一状态价值 |
| Sarsa | 动作价值 Bellman 方程 | 实际下一动作的价值 |
| Q-learning | 动作价值最优方程 | 下一状态的最大动作价值 |

动画中的 TD 和 Sarsa 使用固定均匀策略做评估；Q-learning 使用均匀行为策略采样并学习贪心目标，不把它伪装成 Sarsa 控制。

## 持续任务与终止任务分别配置

原书图 7.2 的路径实验会在目标终止，并采用另一组奖励。本页动画使用第 1 章的持续环境，以便前后比较。若任务真正终止，目标去掉未来价值；若只是为了收集数据而截断持续轨迹，则仍需自举。不能把原书不同实验的奖励与结束规则混用。

```bash
python3 -m examples.textbook --chapter 7 --steps 500 --output outputs/book-ch07.json
python3 -m examples.textbook --demo n-step
```

下一章：[价值函数方法](08-value-function-methods.md)，把表项换成带共享参数的函数。
