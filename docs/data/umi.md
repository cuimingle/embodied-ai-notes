---
title: UMI 数据
description: 理解 UMI 手持工具示范怎样重建动作，比较原始 UMI、FastUMI 与 DexUMI 的采集字段、训练定位和迁移边界。
---

<span class="kicker">DATA / UMI</span>

# UMI：先采集操作，再交给机器人

UMI（Universal Manipulation Interface）是一套采集与策略学习方法：**人拿着带相机的手持夹爪完成真实操作，再将工具的运动转换为机器人可以学习的动作轨迹。** 采集时无需机器人跟随执行，因此不等同于直接遥控机械臂；它也比普通操作视频多了一层可恢复的工具运动信息。[原始 UMI 项目](https://umi-gripper.github.io/)

这里把原始 UMI 及相关手持、穿戴式示范接口放在一起比较。它们可以与第一视角、人类动作数据重叠，但传感器和动作语义并不统一。资料核验日期为 **2026-11-15**。


## 看一段演示，理解这类数据 {#visual-guide}

<div class="data-media" markdown>

<p class="data-media-label">实拍 · 手持夹具采集</p>

<video class="data-video" controls playsinline preload="none" poster="../../assets/diagrams/data-umi.svg" aria-label="UMI：手持夹具采集杯子操作" aria-describedby="umi-video-caption">
  <source src="https://umi-gripper.github.io/videos/teaser_data_collection_cup.mp4" type="video/mp4">
  您的浏览器未能播放嵌入视频，可通过下方链接观看官方演示。
</video>

<p class="data-poster-note">封面为本站绘制的概念示意；点击播放，查看官方演示。</p>

<p id="umi-video-caption">UMI 官方“Human Demonstration with UMI”中的杯子操作示范。采集时由人手持带相机的夹具完成任务，后续恢复工具轨迹，再用于机器人策略学习。</p>

<div class="data-watch-notes" markdown>

**观看时留意**

- 移动的是人手持的工具，现场不需要机械臂跟随。
- 相机与夹爪一起运动，观察接近机器人腕部视角。
- 夹具的位姿和开合需要与视觉对齐，普通视频不自动带有这些动作字段。

</div>

<p class="data-media-credit">来源：<a href="https://umi-gripper.github.io/">UMI：手持夹具采集杯子操作</a> · Cheng Chi et al. · Universal Manipulation Interface / RSS 2024</p>
<p class="data-media-links"><a href="https://umi-gripper.github.io/videos/teaser_data_collection_cup.mp4">直接打开视频 ↗</a><a href="https://umi-gripper.github.io/">官方项目页 ↗</a></p>

</div>

<figure class="data-photo">
  <a href="https://umi-gripper.github.io/images/UMI_hardware.jpg" aria-label="查看官方原图"><img src="https://umi-gripper.github.io/images/UMI_hardware.jpg" alt="官方硬件图展示相机、平行夹爪与轨迹恢复所需的设计。图中的硬件机制配合处理流程，才能把手持示范变成可用的动作监督。" loading="lazy" decoding="async"></a>
  <figcaption><strong>UMI 硬件设计。</strong>官方硬件图展示相机、平行夹爪与轨迹恢复所需的设计。图中的硬件机制配合处理流程，才能把手持示范变成可用的动作监督。<br>来源：<a href="https://umi-gripper.github.io/">UMI project team</a> · 点击图片查看原图</figcaption>
</figure>

## 从手持示范到训练轨迹

1. **构造采集接口。** 将相机、夹爪与跟踪方案组合，使采集和机器人执行时的观察位置与接触几何尽可能一致。
2. **人在真实环境操作。** 拿起、移动、放置物体，同时记录视频及用于恢复运动的传感信息。
3. **重建工具运动。** 恢复工具中心点（TCP）的位姿与夹爪开合，并与图像对齐；检查跟踪失败、遮挡和时间误差。
4. **构造动作监督。** 将轨迹转换为策略使用的相对位姿或其他动作表示，再检查目标机器人的可达性与执行时延。

原始 UMI 提供 SLAM 处理、训练数据生成与 Diffusion Policy 训练流程；官方同时指出，SLAM 仍是流程中较脆弱的部分。因此，“视频已经拍完”距离“得到可训练数据”还有重建和质检环节。[UMI 处理与训练代码](https://github.com/real-stanford/universal_manipulation_interface)

## 实际记录了什么

原始 UMI 的训练数据生成脚本写入相机 RGB、末端位置、轴角旋转、夹爪宽度和示范起止位姿。名称中即便出现 `robot0`，采集来源仍是手持工具，不是机器人编码器。[UMI 数据生成脚本](https://github.com/real-stanford/universal_manipulation_interface/blob/main/scripts_slam_pipeline/07_generate_replay_buffer.py)

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 数据层 | 能提供什么 | 不能自动推断什么 |
| --- | --- | --- |
| 腕部视觉 | 操作对象、接触附近的视觉上下文 | 完整环境状态或无遮挡的物体姿态 |
| 工具位姿与开合 | 用于模仿学习的末端运动与夹取时序 | 目标机器人的实测关节角、电机力矩 |
| 重建与转换结果 | 对齐后的轨迹、相对动作或逆运动学解 | 所有轨迹都可达，或转换结果等于真机执行反馈 |
| 扩展传感 | 依项目加入手指编码器、触觉等 | 所有 UMI 数据都具有力觉或完整手部姿态 |

</div>

一个具体例子是 FastUMI：官方数据卡中的 `qpos` 是三维位置与四元数，示例 `action` 与其同值；不能看到 `qpos` 就按关节状态读取。采集代码还提供 TCP 与关节空间的不同处理路径，必须按实际导出版本判断动作含义。[FastUMI 数据卡](https://huggingface.co/datasets/IPEC-COMMUNITY/FastUMI-Data)、[处理说明](https://github.com/zxzm-zak/FastUMI_Data)

## 在具身学习中的定位

UMI 的核心价值是扩大**带结构化动作信息的真实操作示范**：在多个场景采集工具运动，训练观察到动作的策略，再适配目标机器人。它位于普通人类视频与真机遥操之间：保留真实物体交互，也提供较明确的动作监督，但没有直接记录目标机器人的执行动力学。

是否能迁移，取决于观察视角、工具几何、动作空间、可达范围和时延是否匹配。原始 UMI 使用相对轨迹与执行时延匹配，并展示了不同机械臂上的部署；这支持跨平台迁移的可能性，但不能扩展为任意身体都能直接使用。[UMI 方法与实验](https://umi-gripper.github.io/)

## 代表项目与扩展

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 项目与性质 | 采集接口与数据 | 主要用途与边界 |
| --- | --- | --- |
| [原始 UMI](https://umi-gripper.github.io/)：采集、策略学习框架及任务数据 | 手持平行夹爪与 GoPro；恢复末端轨迹和夹爪宽度，提供杯子摆放等处理后数据 | 面向平行夹爪操作；需要可靠轨迹重建，不能直接覆盖灵巧手的手指动作 |
| [FastUMI](https://arxiv.org/abs/2409.19499)：接口改造与数据项目 | 使用现成跟踪模块简化位姿获取；官方实现结合 T265、GoPro 和标记检测，提供 TCP、关节空间转换 | 降低采集部署复杂度；应区分原始位姿、估计宽度与逆运动学生成的关节动作，不混用各版格式 |
| [DexUMI](https://dex-umi.github.io/)：灵巧操作采集与学习框架 | 可穿戴手部外骨骼、腕部视觉与手指动作映射；部分实验加入触觉，并用机器人手图像替换人手外观 | 扩展到多指操作；需适配机器人手的运动学与视觉，人的触感不会自动成为机器人传感信号 |

</div>

DexUMI 与原始平行夹爪方案属于相关研究路线，不能直接拼接动作维度。其官方实验还记录了图像修复缺陷、机械回差和外骨骼形变等迁移误差来源。[DexUMI 方法与局限](https://dex-umi.github.io/)

## 落地时先检查什么

从一个任务的小样本开始，验证轨迹重建、夹爪宽度和视频时序，再在目标机械臂上检查动作是否可执行。保存标定、坐标转换、重建质量与数据处理版本，才能定位失败发生在示范、重建还是部署环节。

采集规划也要覆盖部署时的光照、物体与接触方式。手持工具能自然完成的姿态，机械臂可能受关节限位或碰撞约束影响。将这些不可执行片段在训练前识别出来，比单纯增加视频时长更有价值。

[返回数据地图](index.md)
