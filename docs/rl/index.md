---
title: 强化学习主线
---

<div class="track-intro" markdown>

<span class="kicker">02 / REINFORCEMENT LEARNING</span>

# 强化学习：从目标到策略

用十章建立决策的数学主线。先定义问题，再评价行为，最后学习怎样改进策略。

以赵世钰《Mathematical Foundations of Reinforcement Learning》2024 年 9 月版为准。阅读前可先看[知识全貌](../embodied-ai-overview.md)，理解 RL 在机器人系统中的位置。

<div class="track-summary"><span><strong>10 章</strong> 原创伴读</span><span><strong>16 个</strong> 书内机制实验</span><span><strong>统一符号</strong> 对照指定版本</span></div>

[教材与页码对照](reading-guide.md){ .md-button }
[符号体系](notation.md){ .md-button }
[实验使用说明](../labs/textbook.md){ .md-button }

</div>

## 沿着问题，逐章深入

<div class="chapter-list" markdown>

[<span class="chapter-no">01</span><strong>基本概念</strong><small>状态、动作、奖励、回报与 MDP：先定义决策问题。</small>](01-basic-concepts.md)

[<span class="chapter-no">02</span><strong>状态价值与 Bellman 方程</strong><small>从随机回报到条件期望，理解价值的递推关系。</small>](02-bellman-equation.md)

[<span class="chapter-no">03</span><strong>Bellman 最优方程</strong><small>从评价给定策略，走向定义最优行为。</small>](03-bellman-optimality.md)

[<span class="chapter-no">04</span><strong>价值迭代与策略迭代</strong><small>已知模型时，怎样交替评价与改进策略。</small>](04-value-policy-iteration.md)

[<span class="chapter-no">05</span><strong>Monte Carlo</strong><small>用采样轨迹的回报，估计未知的价值。</small>](05-monte-carlo.md)

[<span class="chapter-no">06</span><strong>随机逼近</strong><small>从样本均值到增量更新，理解步长与随机噪声。</small>](06-stochastic-approximation.md)

[<span class="chapter-no">07</span><strong>Temporal-Difference 方法</strong><small>通过自举学习，连接 TD、Sarsa 与 Q-learning。</small>](07-temporal-difference.md)

[<span class="chapter-no">08</span><strong>价值函数方法</strong><small>从逐状态表格，走向共享参数与函数近似。</small>](08-value-function-methods.md)

[<span class="chapter-no">09</span><strong>策略梯度</strong><small>直接对参数化策略求梯度，优化长期表现。</small>](09-policy-gradient.md)

[<span class="chapter-no">10</span><strong>Actor-Critic</strong><small>结合价值估计与策略更新，理解两者如何协作。</small>](10-actor-critic.md)

</div>

## 三个贯穿问题

当前是在评价给定策略，还是寻找最优策略？更新使用精确模型、MC 回报还是 TD 自举？对象是每个状态的独立表项，还是共享参数的函数？每次切换方法，都先回答这三个问题。

## 统一记号 {#notation}

<span id="_4"></span>

| 记号 | 含义 |
| --- | --- |
| $S_t,A_t,R_{t+1}$ 与 $s_t,a_t,r_{t+1}$ | 随机变量与经验样本 |
| $p(s'\mid s,a),p(r\mid s,a)$ | 状态与奖励模型 |
| $v_\pi(s),q_\pi(s,a)$ | 状态价值与动作价值 |
| $\hat v(s,w),\hat q(s,a,w)$ | 参数化价值近似 |
| $\pi(a\mid s,\theta)$ | 参数化随机策略 |
| $\delta_\pi(s,a)$ 与 $\delta_t$ | 优势函数与一次采样 TD 误差 |

完整约定、矩阵方向和概率归一化见[符号体系](notation.md)。原书中的少量排印与近似问题见[阅读校勘](reading-guide.md#calibration)。

## 文章中的动画与代码

每章都有可播放、可单步、可调整参数的数值实验，按其真实更新规则生成动画；没有自动播放，也不需要外部 CDN。每个对应的 Python 命令可以在仓库根目录执行：

```bash
python3 -m examples.textbook --chapter 2 --output outputs/book-ch02.json
python3 -m examples.textbook --chapter 7 --steps 500 --output outputs/book-ch07.json
```

16 个书内实验与 4 个扩展实验的索引见[实验使用说明](../labs/textbook.md)。TRPO、PPO、GRPO、GSPO 从[书外扩展](../extensions/index.md)继续；机器人问题另见[具身任务衔接](to-embodied.md)。
