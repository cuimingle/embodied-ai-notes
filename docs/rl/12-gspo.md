# 12 · Group Sequence Policy Optimization

> 状态：概念初稿。按 GSPO 论文 v2 的序列级目标整理，未实现训练。

## 优化单位从 token 转向序列

[GSPO 原论文](https://arxiv.org/html/2507.18071v2) 使用长度归一化的序列似然比：

$$
s_i(\theta)=\left(\frac{\pi_\theta(y_i\mid x)}
{\pi_{\mathrm{old}}(y_i\mid x)}\right)^{1/|y_i|}
=\exp\left[\frac1{|y_i|}\sum_t
\log\frac{\pi_\theta(y_{i,t}\mid x,y_{i,<t})}
{\pi_{\mathrm{old}}(y_{i,t}\mid x,y_{i,<t})}\right].
$$

结合组内优势，省略 KL 正则时的最大化目标为：

$$
\mathbb E\left[\frac1G\sum_i
\min\left(s_i\hat A_i,\operatorname{clip}(s_i,1-\epsilon,1+\epsilon)\hat A_i\right)\right].
$$

| 比较点 | 本章的 GRPO 设定 | GSPO |
| --- | --- | --- |
| 比率 | 单 token 比率 | 长度归一化序列比率 |
| 裁剪 | token 层面 | 整个回答层面 |
| 优势 | 组内相对得分 | 组内相对得分 |

## 一个数值区别

两个 token 的比率为 $1.8$ 和 $0.5$ 时，GSPO 比率为 $\sqrt{0.9}\approx0.949$；分别裁剪再平均通常不会得到相同结果。

归一化后的比率不等于完整轨迹的重要性权重，不能直接宣称得到对原回报目标的无偏估计。裁剪参数也不能机械沿用 token 级配置。

原论文的性能证据来自语言模型实验；机器人控制中的效果仍需另做验证。

继续阅读：[从 RL 到具身任务](to-embodied.md)。
