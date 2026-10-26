# 教材实验：动画、单步更新与本地代码

主线对应指定教材的 10 章。文章中直接嵌入了 16 个书内实验，扩展区另有 4 个数学实验。每个动画都由当前参数下的实际计算结果驱动，不使用预制的成功曲线。

## 使用方式

点击“播放”顺序查看数值更新，点击“单步”检查一次更新，拖动进度查看已有帧。改变参数会重新计算并重置轨迹，以便保持同一随机种子下的可比性。“重置”恢复当前参数下的初始帧，不会静默改掉参数。

浏览器执行随网站发布的 JavaScript，既不需要 GPU，也不向外部服务提交代码。Python 实验仅使用标准库；它们是独立可运行的对应实现，页面并未伪装成在线 Python 解释器。

## 20 个实验入口

| 教材位置 | 动画与代码 | Python 的 `--demo` |
| --- | --- | --- |
| 第 1 章 | 状态、转移、持续回报 | `trajectory` |
| 第 2 章 | 策略评估；第一步动作比较 | `evaluation`、`action-values` |
| 第 3 章 | 最优备份；收缩固定点 | `optimality`、`contraction` |
| 第 4 章 | VI、PI、截断 PI 对照 | `iteration` |
| 第 5 章 | MC 回报均值；ε-greedy 频率 | `mc`、`epsilon` |
| 第 6 章 | 同一噪声样本流的三种步长 | `stochastic` |
| 第 7 章 | TD/Sarsa/Q-learning；n-step 尾项 | `td`、`n-step` |
| 第 8 章 | TD 线性逼近；目标冻结 | `approximation`、`dqn-target` |
| 第 9 章 | 可手算的平均奖励梯度 | `policy-gradient` |
| 第 10 章 | 单状态 A2C；重要性采样 | `actor-critic`、`importance` |
| 书外扩展 | TRPO、PPO、GRPO、GSPO 的数学机制 | `trpo`、`ppo`、`grpo`、`gspo` |

## 在仓库根目录运行

```bash
python3 -m examples.textbook --chapter 1 --steps 12
python3 -m examples.textbook --chapter 4 --steps 240 --output outputs/book-ch04.json
python3 -m examples.textbook --demo n-step
python3 -m examples.textbook --demo approximation --steps 5000 --output outputs/value-approximation.json
```

`--chapter` 选择一章的主要实验，`--demo` 选择表中某个实验。使用 `--seed`、`--gamma`、`--steps` 调整随机种子、折扣与样本预算；`--output` 保存原始轨迹与结果。两个选择参数互斥。完整代码见仓库的 [Python 实现](https://github.com/cuimingle/embodied-ai-notes/tree/main/examples/textbook)与[浏览器实验实现](https://github.com/cuimingle/embodied-ai-notes/blob/main/docs/assets/javascripts/rl-simulations.js)。

## 环境口径

教材主线的 `BookGrid` 按第 1 章表 1.1、表 1.3 实现：状态 $s_1\ldots s_9$、动作 $a_1\ldots a_5$、可进入的禁区、到达目标后仍继续。单状态策略梯度实验和目标冻结实验会单独声明它们是教学简化模型。

旧的 [4×4 GridWorld](gridworld.md) 使用四动作、墙壁和到达即终止的另一套规则，作为补充保留，不用它的数值冒充教材实验。

## 验证标准

检查模型表、概率归一化、Bellman 残差、规划结果一致性、梯度数值差分、随机序列可复现性，以及浏览器/Python 公共数学核的一致性。有限次数的运行不构成一般收敛定理的证明。

```bash
python3 -m unittest discover -s tests -v
node --test tests/test_textbook_browser.cjs
```
