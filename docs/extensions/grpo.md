# GRPO · 从同题回答构造组相对信号

> 书外扩展。采用 [DeepSeekMath](https://arxiv.org/html/2402.03300v3) 的结果监督设定，不将其当作教材主线章节。

## 与教材已有概念连接

同一个问题 $x$，旧策略生成 $G$ 个回答 $y_1,\ldots,y_G$。将结果奖励样本记为 $r_i=r(x,y_i)$，组相对信号记为 $\hat\delta_i$：

$$
\hat\delta_i=\frac{r_i-\operatorname{mean}_j r_j}{\operatorname{std}_j r_j}.
$$

沿用教材“随机变量大写、样本小写”的约定；这里 $G$ 是组大小，与时间相关的回报随机变量 $G_t$ 不同。组相对信号也不直接等于某个精确的优势函数 $\delta_\pi$。

<div class="rl-demo" data-rl-demo="grpo"><p>交互实验：先收齐四个回答的奖励，再计算组均值、标准差与相对信号；也可切换为全相同奖励。</p></div>

## 数学边界与实现口径

总体标准差下，奖励 $[0,0,1,1]$ 的均值为 0.5、标准差为 0.5，相对信号为 $[-1,-1,1,1]$。若标准差为零，需要明确处理策略；本教学实现把相对信号设为零。

完整原始 GRPO 还包含 token 级概率比率、裁剪代理项、回答长度聚合及参考策略 KL。旧策略负责描述生成数据的策略，参考策略负责约束偏移，二者不是一个角色。这里只演示组相对计算，不把这一条标准化公式当作完整训练算法。

```bash
python3 -m examples.textbook --demo grpo
```

```python
from examples.textbook.core import group_advantages

assert group_advantages([0, 0, 1, 1]) == [-1, -1, 1, 1]
assert group_advantages([1, 1, 1, 1]) == [0, 0, 0, 0]
```

把该思路用于机器人，需要重新定义组内任务条件、重置分布、轨迹奖励和采样成本，而不是直接迁移语言模型实验结论。
