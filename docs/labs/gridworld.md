# 补充实验 · 4×4 GridWorld

> 状态：可运行的教学实验。仅依赖 Python 3.11+ 标准库。

这是项目早期的独立实验：四个动作、不可穿越的墙、目标到达即终止。它与当前主教材第 1 章的五动作、可进入禁区、持续目标设定不同。阅读教材主线请使用[对应的动画与代码](textbook.md)，不要把两套规则的价值数值直接比较。

## 实验问题

同一张地图中，已知环境模型时可以用价值迭代与策略迭代做规划；不知道转移结果时，可以通过交互更新 Q 值。比较它们如何得到策略，并核对公式与实现的关系。

本实验使用自定义简化环境，没有继承 Gymnasium 的环境接口；`step` 返回的四项为下一状态、奖励、真正终止、采样截断。

## 任务定义

```text
S . . .
. # . .
. # . .
. . . G
```

行列从 0 开始，起点 `(0, 0)`，目标 `(3, 3)`。上下左右移动，撞墙或越界保持原位。每步奖励 $-1$，到达目标的那一步改为 $+1$，然后终止；吸收状态后续奖励为 0。

默认 $\gamma=0.95$。100 步采样上限只导致截断，不改变所求解的折扣 MDP。Q-learning 在截断前的最后状态保留自举，再重置环境继续采样。

## 三种运行方式

从仓库根目录执行：

```bash
python3 -m examples.gridworld --algorithm value-iteration --output outputs/value-iteration.json
python3 -m examples.gridworld --algorithm policy-iteration --output outputs/policy-iteration.json
python3 -m examples.gridworld --algorithm q-learning --seed 0 --episodes 2000 --output outputs/q-learning-seed0.json
```

默认 Q-learning 配置：$\alpha=0.2$、$\epsilon=0.2$、固定起点训练 2000 个 episode。每次训练使用独立的带种子随机数生成器。改变 `--seed` 可检查不同采样过程；`--alpha`、`--epsilon`、`--gamma` 与 `--max-steps` 可以覆盖默认配置。

## 代码阅读顺序

文件 `examples/gridworld.py` 中：

| 函数 | 作用 | 对应概念 |
| --- | --- | --- |
| `GridWorld.transition` | 不改变环境内部状态的模型查询 | 已知 $P,r$ 的规划 |
| `GridWorld.step` | 执行当前动作并跟踪边界 | 交互采样 |
| `td_target` | 根据真正终止构造自举目标 | TD target |
| `value_iteration` | 同步最优备份 | $V\leftarrow T_*V$ |
| `policy_iteration` | 迭代评估到容差后改进 | 评估与贪心改进 |
| `q_learning` | 只从 `step` 得到转移，更新动作表 | Off-policy TD control |
| `evaluate` | 关闭探索，逐起点评测 | 训练与评测分离 |

策略迭代的评估通过迭代逼近到容差，并非矩阵精确求解。规划器与学习器使用同一张地图，比较的是方法机制，不是它们的算力效率。

## 实际验证结果

2026-10-21，macOS、Python 3.14.3，本项目初始实现，使用上述默认配置测得：

| 方法 | 训练种子 | 到达目标的评测起点 | 默认起点步数 | 默认起点未折扣回报 |
| --- | --- | --- | --- | --- |
| 价值迭代 | 不涉及随机采样 | 13 / 13 | 6 | -4 |
| 策略迭代 | 不涉及随机采样 | 13 / 13 | 6 | -4 |
| Q-learning | 0、1、2，分别运行 | 每个种子均 13 / 13 | 每个种子均 6 | 每个种子均 -4 |

评测对每个非终止、非障碍状态各运行一次确定性贪心 rollout，合计 13 次。这里是有限地图的全起点评测，不是 13 个随机独立场景；相同地图也不能支持新环境泛化的结论。不同最优路径的动作表可能不同。

`return` 字段记录未折扣奖励和；规划器的 `values` 是折扣价值，两者数值不同。默认起点共六步，前五步各 $-1$，最后一步 $+1$，所以未折扣回报为 $-4$。

## 验证与复现

```bash
python3 -m unittest discover -s tests -v
```

测试用独立 BFS 求最短距离，再推算最优折扣价值；还验证墙壁、吸收状态、截断后的自举、随机种子复现与多种子学习结果。保存的 JSON 包含环境配置、参数、策略、评测结果；Q-learning 额外保存每个 episode 的长度、回报与边界，以及最终 Q 表。

发布实验记录时附上 `git rev-parse HEAD` 的结果。首版尚无提交时记录“未提交工作区”，不能据此伪造代码版本。

## 下一组对照

将训练步数减少到 10、100、500，观察是否仍能学到所有起点的正确动作。改变探索率时同时查看训练绕路和评测路径，避免把探索成本与最终策略混为一谈。后续补 MC 与 SARSA 时继续使用相同任务定义。
