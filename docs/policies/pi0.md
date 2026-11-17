---
title: π₀ · 用流匹配生成连续动作
description: 理解 π₀ 如何连接 PaliGemma、动作专家与跨本体机器人数据，并区分流匹配时间、动作执行时间及后续模型版本。
---

<span class="kicker">POLICIES / PI0</span>

# π₀：视觉语言知识怎样变成连续动作

**π₀ 把预训练视觉语言模型接到机器人动作生成上：图像和指令提供上下文，动作专家通过流匹配生成一段连续动作。** 这里的 π₀ 是模型名称；它与强化学习中的策略符号有关联，但本篇讨论的是具体的模型架构与示范训练流程。

资料核验：**2026-11-17**。原理以 [2024 年原论文 v1](https://arxiv.org/html/2410.24164v1) 为依据，实现对照 [OpenPI](https://github.com/Physical-Intelligence/openpi) 与 [LeRobot π₀ 文档](https://huggingface.co/docs/lerobot/pi0)。状态：文献笔记；本站尚未完成模型训练或真机复现。

## 输入什么，输出什么

| 接口 | 内容 | 使用时要明确 |
| --- | --- | --- |
| 视觉 | 多个相机的 RGB 图像 | 相机位置、顺序与图像预处理 |
| 语言 | 当前任务或子任务指令 | 指令是否与训练标注一致 |
| 本体状态 | 当前关节等机器人状态 | 维度、归一化及缺失字段 |
| 动作 | 未来若干控制步组成的连续动作块 | 每维的物理含义、单位、坐标与控制频率 |

原论文使用长度为 50 的动作块。一次生成 50 个控制步，不代表每秒进行 50 次完整模型推理；模型推理频率、动作发送频率和底层控制器频率需要分别记录。动作块也不必全部执行后才读取新观测。[原论文 §IV](https://arxiv.org/html/2410.24164v1#S4)

例如，一套关节位置控制接口需要的是各关节目标值。把同样的数值数组接到末端速度控制器上，含义就变了。LeRobot 当前文档区分绝对动作与相对动作，并要求相对动作的统计量、转换和训练配置一致；数组长度相同无法保证接口兼容。[LeRobot 动作配置](https://huggingface.co/docs/lerobot/pi0#relative-actions)

## PaliGemma 与动作专家怎样配合

原版由约 **3B 的 PaliGemma** 和约 **300M 的动作专家**构成，总计约 3.3B 参数。视觉语言部分继承预训练权重；动作专家从随机初始化学习机器人状态和动作。两组权重通过注意力交换信息，连续动作对应的序列位置可以相互关注。[原论文 §IV、附录 A-B](https://arxiv.org/html/2410.24164v1#S4)

可以沿四步理解一次预测：

1. 图像与语言形成条件表示。
2. 当前机器人状态与带噪动作进入动作专家。
3. 专家预测动作空间中的变化方向，数次更新后得到动作块。
4. 执行接口取出要发送的动作，依据新观测再次预测。

这里的“动作 token”表示 Transformer 中的序列位置，不意味着动作已被量化为词表编号。原版 π₀ 的动作生成使用连续数值与流匹配。[OpenPI 模型说明](https://github.com/Physical-Intelligence/openpi#openpi)

## 流匹配：学习怎样把噪声移到示范动作

下面采用 **OpenPI 代码的时间方向**：人工时间 $\tau=1$ 对应噪声，$\tau=0$ 对应动作。$t$ 才是机器人采样时刻，两种时间互不等同。

令 $\mathbf a$ 为时刻 $t$ 对应的一个示范动作块样本，$c_t$ 为图像、语言与本体状态的条件，$\boldsymbol\epsilon$ 为从标准高斯分布抽取的噪声样本。训练时构造

$$
\mathbf x^\tau=\tau\boldsymbol\epsilon+(1-\tau)\mathbf a,
\qquad
\frac{\mathrm d\mathbf x^\tau}{\mathrm d\tau}
=\boldsymbol\epsilon-\mathbf a.
$$

以 $f_\theta$ 表示预测向量场，目标可写成

$$
\mathcal L(\theta)=
\mathbb E\!\left[
\left\|f_\theta(\mathbf x^\tau,c_t,\tau)
-(\boldsymbol\epsilon-\mathbf a)\right\|_2^2
\right].
$$

期望覆盖示范样本、噪声和人工时间的抽样；实际训练用小批量估计。这里的 $f_\theta$ 描述生成过程中的向量场，不能解释为关节实际运动速度，也不是教材的状态价值 $v_\pi$。

推理从高斯噪声开始，沿 $\tau=1\rightarrow0$ 数值积分。令 $\Delta>0$，一步 Euler 近似的计算式为

$$
\hat{\mathbf x}^{\tau-\Delta}
=\hat{\mathbf x}^{\tau}
-\Delta f_\theta(\hat{\mathbf x}^{\tau},c_t,\tau).
$$

帽号表示生成的中间估计。训练中的示范动作在推理时不可用；模型只看到当前条件与中间动作。公式的插值、目标符号和负积分步长须成套理解。[OpenPI 损失与采样实现](https://github.com/Physical-Intelligence/openpi/blob/main/src/openpi/models/pi0.py)

!!! note "论文与代码的时间约定"
    原论文 v1 §IV 写出 $\tau\mathbf a+(1-\tau)\boldsymbol\epsilon$ 的插值和 $\boldsymbol\epsilon-\mathbf a$ 的目标。按该插值求导应得 $\mathbf a-\boldsymbol\epsilon$，因此这里存在需要核对的符号疑点；这不是作者发布的勘误。OpenPI 源码明确说明时间方向与论文相反，本页按代码统一插值、目标和积分方向。

**一个手算例子。** 假设归一化动作只有一维，示范为 $a=0.4$、噪声样本为 $\epsilon=-0.2$。当 $\tau=0.75$ 时，$x^\tau=-0.05$，目标向量为 $-0.6$。若预测恰好等于此目标，将人工时间降低 $0.25$，更新得到 $0.10$，正好等于 $\tau=0.5$ 时的插值。这个例子只解释方向与符号；真实模型有预测误差，中间噪声值也不会逐个发送给机器人。

## 跨本体预训练与任务适配

π₀ 的训练结合了已有视觉语言知识、公开机器人数据及团队采集的多机器人示范。广泛的预训练提供行为覆盖，再用任务相关示范进行后训练。官方演示包含叠衣服、桌面整理等任务，应连同对应平台与适配条件阅读。[Physical Intelligence 官方介绍](https://www.pi.website/blog/pi0)

对学习者而言，关键问题是数据怎样进入同一个接口：不同机器人可能有不同关节数、相机数与动作语义。填充和掩码可以对齐张量形状，仍需正确处理坐标、归一化及控制周期。可先用[数据地图](../data/index.md)核查来源，再核对所选检查点的处理流程。

设想让机械臂“把杯子放到托盘”：语言描述目标，图像给出当前物体关系，本体状态帮助确定机器人姿态。若执行后杯子发生滑动，下一次观测会改变条件。真正要检验的是模型能否据此恢复，而非只在示范起点生成一条看似合理的动作曲线。

## 评测与使用边界

阅读或复现结果时，应把**基础检查点直接评测**与**目标任务微调后评测**分开，并注明任务是否出现在预训练数据中。跨机器人训练带来的经验可以帮助适配，但不能保证新设备无需数据和接口转换就能工作。OpenPI 也提示公开检查点在新任务上的表现取决于数据与机器人设置。[OpenPI 预训练模型说明](https://github.com/Physical-Intelligence/openpi#pre-trained-models)

本站建议至少报告成功次数与总次数、初始条件、人工接管、恢复失败及推理延迟。与 [ACT](act.md) 或 [SmolVLA](smolvla.md) 比较时，要固定机器人、测试任务和微调数据，并披露预训练差异；离线流匹配损失较低不能直接推出闭环成功率更高。

## 在 LeRobot 中定位原版与后续版本

LeRobot 的 `pi0` 实现由 OpenPI 适配而来。实践记录需要同时保存 LeRobot 版本或提交、检查点 revision、相机映射、动作处理和归一化统计。本页解释模型，训练命令以对应版本的[官方文档](https://huggingface.co/docs/lerobot/pi0)为准。

| 名称 | 本篇采用的边界 |
| --- | --- |
| π₀ | 本篇主体：连续动作、流匹配、VLM 与动作专家 |
| π₀-FAST | 使用 FAST 动作 tokenizer 的自回归 VLA，需要单独解释动作编码与生成目标 |
| π₀.₅ | 后续的泛化与训练方案扩展，不能把其结果直接归给原版 π₀ |

上述模型在 [OpenPI](https://github.com/Physical-Intelligence/openpi#openpi) 中分别说明。继续阅读时，可回到[策略模型地图](index.md)比较输入、动作生成与训练方式，再用 [SmolVLA](smolvla.md)对照较小模型的架构和执行设计。
