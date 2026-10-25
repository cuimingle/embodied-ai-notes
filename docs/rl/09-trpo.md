# 09 · Trust Region Policy Optimization

> 状态：整理初稿。性能差异引理、界的证明和共轭梯度细节待对照手稿补齐。

## 为什么需要控制更新幅度

策略梯度估计来自旧策略访问的状态。若一次更新改变太大，新策略会访问不同分布，基于旧数据得到的局部估计可能失准。

TRPO 用旧策略样本构造代理目标，并限制平均 KL 距离。下面是实用近似形式，省略与优化无关的比例常数：

$$
\max_\theta\ \mathbb E_{s\sim d_{\mathrm{old}},a\sim\pi_{\mathrm{old}}}
\left[\frac{\pi_\theta(a\mid s)}{\pi_{\mathrm{old}}(a\mid s)}
A^{\mathrm{old}}(s,a)\right]
$$

$$
\text{s.t. }\mathbb E_{s\sim d_{\mathrm{old}}}
\left[D_{\mathrm{KL}}(\pi_{\mathrm{old}}(\cdot\mid s)\Vert\pi_\theta(\cdot\mid s))\right]\leq\delta.
$$

重要性比率修正同一状态下的动作概率，不会精确补偿全部新旧状态访问分布差异。

## 从约束到更新方向

在旧参数附近，对目标做一阶近似，对 KL 做二阶近似，得到带二次约束的问题。其方向与 $F^{-1}g$ 有关，$F$ 是局部 KL 曲率矩阵，$g$ 是代理目标梯度。

实际实现通过 Hessian-vector product、共轭梯度和回溯线搜索，避免显式构造并求逆大型矩阵。线搜索检查采样估计的目标与 KL；有限样本下仍可能存在误差。

理论动机和实用算法见 [TRPO 原论文](https://arxiv.org/abs/1502.05477)。

## 理论保证与工程算法

严格的策略改进下界有特定假设与距离约束。把最坏状态约束换成采样平均 KL，再用近似优化求解后，不能宣称每次实测回报必然单调上升。

整理手稿时，应分成三层：性能差异关系、可证明的下界、实际使用的近似算法。每一步写清替换了什么，便于解释 PPO 为什么继续简化。

**自检**：动作比率修正了哪个分布？平均 KL 小是否代表每个状态上的 KL 都小？

下一章：[PPO](10-ppo.md)。
