---
title: 遥操数据
description: 从 ALOHA、DROID 和 BridgeData V2 理解机器人遥操如何采集观测、动作与执行状态，以及它们在模仿学习中的作用。
---

<span class="kicker">DATA / TELEOPERATION</span>

# 遥操：把人的操作变成机器人示范

遥操数据来自这样一个过程：**人发出控制意图，机器人实际执行，系统同步记录机器人看到什么、收到什么指令、最终怎样运动。** 操作者可以使用主从机械臂、VR 控制器等接口。它最有价值的部分，是把真实环境中的观测与机器人动作连接起来。

这里按**采集方式**归类。同一条遥操轨迹可以同时包含腕部视角和第三视角图像；“遥操”也不能直接说明有没有深度、触觉或语言标注。下文区分采集系统与公开数据集，资料核验日期为 **2026-11-15**。


## 看一段演示，理解这类数据 {#visual-guide}

<div class="data-media" markdown>

<p class="data-media-label">实拍 · 主从遥操示教</p>

<video class="data-video" controls playsinline preload="none" poster="../../assets/diagrams/data-teleoperation.svg" aria-label="ALOHA：人控制主臂，机器人同步执行" aria-describedby="teleoperation-video-caption">
  <source src="https://tonyzhaozh.github.io/aloha/resources/teleop_all.mp4" type="video/mp4">
  您的浏览器未能播放嵌入视频，可通过下方链接观看官方演示。
</video>

<p class="data-poster-note">封面为本站绘制的概念示意；点击播放，查看官方演示。</p>

<p id="teleoperation-video-caption">ALOHA 官方遥操系统演示：操作者移动主臂，从臂同步执行操作。这里展示的是人在控制回路中的示教过程；学习所需的图像、状态与控制命令还要由采集系统同步保存。</p>

<div class="data-watch-notes" markdown>

**观看时留意**

- 操作者怎样通过主臂把动作意图传给从臂。
- 双臂与夹爪怎样协调完成接触操作。
- 视频只是可见部分，学习还需要同步记录状态和控制命令。

</div>

<p class="data-media-credit">来源：<a href="https://tonyzhaozh.github.io/aloha/">ALOHA：人控制主臂，机器人同步执行</a> · Tony Z. Zhao, Vikash Kumar, Sergey Levine, Chelsea Finn · ALOHA / RSS 2023</p>
<p class="data-media-links"><a href="https://tonyzhaozh.github.io/aloha/resources/teleop_all.mp4">直接打开视频 ↗</a><a href="https://tonyzhaozh.github.io/aloha/">官方项目页 ↗</a></p>

</div>

<figure class="data-photo">
  <a href="https://droid-dataset.github.io/figures/droid_setup.png" aria-label="查看官方原图"><img src="https://droid-dataset.github.io/figures/droid_setup.png" alt="另一套遥操配置：Franka 机械臂、腕部与外部立体相机、Oculus Quest 2 遥操接口。用于比较同类采集方式下不同的硬件接口。" loading="lazy" decoding="async"></a>
  <figcaption><strong>DROID 的遥操硬件。</strong>另一套遥操配置：Franka 机械臂、腕部与外部立体相机、Oculus Quest 2 遥操接口。用于比较同类采集方式下不同的硬件接口。<br>来源：<a href="https://droid-dataset.github.io/">DROID Dataset Team</a> · 点击图片查看原图</figcaption>
</figure>

## 一条示范怎样产生

1. **定义任务与接口。** 明确机器人、夹爪、控制模式、工作空间及成功条件。不同平台可能接受关节位置、末端位姿或速度指令。
2. **操作者控制机器人。** 接口将人的运动映射为机器人命令；人依据现场或相机反馈继续操作。
3. **记录并对齐。** 保存图像、机器人状态、发送的动作及时间信息，检查相机和控制回路之间的延迟。
4. **审核与组织。** 标记成功、失败、人工接管与异常片段，再补充任务描述。场景复位和质量审核也是采集成本的一部分。

例如 ALOHA 由操作者移动主臂、从臂执行任务；DROID 则使用 VR 接口操控 Franka。接口不同，动作空间与时间对齐方式也不同。[ALOHA 采集代码](https://github.com/tonyzhaozh/aloha)、[DROID 项目](https://droid-dataset.github.io/)

## 记录什么，哪些字段不能混用

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 数据层 | 常见内容 | 使用时要确认 |
| --- | --- | --- |
| 环境观测 | 腕部或外部 RGB，部分版本有立体图像、深度 | 相机位置、标定、缺失视角；不能默认每条轨迹模态齐全 |
| 机器人状态 | 关节位置、速度、末端位姿、夹爪状态 | 是测量值还是估计值；坐标系、单位和时间戳 |
| 动作命令 | 目标关节位置、末端运动、夹爪命令 | 绝对量或增量、位置或速度、执行周期 |
| 任务与结果 | 语言指令、片段边界、成功标签 | 哪些由人工标注，哪些由转换脚本生成 |

</div>

**动作命令不等于实际运动。** 控制器存在跟踪误差和延迟，把下一帧测得的关节位置直接当成当时发送的命令，会改变学习目标。ALOHA 的采集脚本分别保存 `action` 与 `observations/qpos`、`qvel`、`effort`；其中 `effort` 也不能直接视为经过标定的末端接触力。[ALOHA 字段定义](https://github.com/tonyzhaozh/aloha/blob/main/aloha_scripts/record_episodes.py)

## 在具身学习中的定位

遥操最适合提供**可对应到机器人控制接口的行为监督**：用观察—动作序列训练行为克隆、动作分块或扩散策略；具备语言条件时，也可用于语言条件策略和 VLA 的动作学习。它还适合为高精度操作提供目标平台上的适配数据。

但“有动作”不代表“可以直接做离线强化学习”。还需明确奖励、终止条件和数据覆盖范围。DROID 的 RLDS 文档说明，示范的末步奖励按约定设置为 1；这是一种数据编码规则，不能据此推断具有丰富的逐步奖励。[DROID 数据格式](https://droid-dataset.github.io/droid/the-droid-dataset)

## 代表系统与数据集

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 项目与性质 | 怎样采集、记录什么 | 主要用途 | 适用边界 |
| --- | --- | --- | --- |
| [ALOHA](https://tonyzhaozh.github.io/aloha/)：双臂遥操硬件与采集系统 | 主从臂示教；多视角 RGB、双臂关节状态与动作 | 双臂精细操作、[ACT](../policies/act.md) 等模仿学习 | ALOHA 是系统，ACT 是算法；不同团队的 ALOHA 数据不是同一个统一语料 |
| [DROID](https://droid-dataset.github.io/)：真实机器人数据集 | VR 操控 Franka；腕部与外部相机、关节与末端状态、动作、语言 | 多场景操作策略训练与泛化研究 | 原始立体视频与 RLDS 版本内容不同；应核对相机标定和动作表示 |
| [BridgeData V2](https://rail-berkeley.github.io/bridgedata/)：多任务操作数据集 | WidowX 的 VR 遥操，并包含脚本策略采集部分；图像、轨迹、任务语言 | 目标图像或语言条件学习；项目提供模仿与离线 RL 实现 | 多数轨迹只有主视角；不能把全库都称为人工遥操，也不能默认四路相机齐全 |

</div>

BridgeData V2 的官方下载与处理代码明确区分 `demos` 和 `scripted` 数据；训练时可以保留这个来源标签，用于分析示范质量与行为分布。[BridgeData V2 数据与训练说明](https://github.com/rail-berkeley/bridge_data_v2)

## 落地时先检查什么

先抽取若干完整轨迹，将图像、夹爪开合、状态曲线和动作一起回放，核对抓取时刻是否对应。再统一坐标、控制频率和归一化方式，保留原始字段与转换记录。

评测集应按场景、物体或操作者划分，避免相邻帧随机拆分导致结果虚高。只保留顺利完成的示范，模型可能学不到脱离熟悉状态后的恢复动作；是否加入失败、纠正与接管片段，应由训练方法和部署需求决定。选择数据时，优先判断目标机器人能否解释并执行这些动作，再比较轨迹数量。

[返回数据地图](index.md)
