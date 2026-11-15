---
title: EGO · 第一人称数据
description: 从可穿戴相机到时序语义，理解 Ego4D、EPIC-KITCHENS 与 Ego-Exo4D 的采集方式、监督信号和具身用途。
---

<span class="kicker">DATA / 03 · EGOCENTRIC</span>

# EGO：从行动者的视角理解世界

EGO（egocentric）首先描述**相机站在谁的视角**。本页聚焦人佩戴相机记录的第一人称数据：手伸向哪里、物体怎样变化、一个任务如何展开。它接近行动现场，但人的视野、身体和机器人并不相同。

因此，EGO 可以同时带有 [HumanCentric](human-centric.md) 的手部几何，也可以与第三视角同步采集。它不是与遥操互斥的数据类型，更不能仅凭“第一人称”就判断是否有可训练机器人策略的动作标签。


## 看一段演示，理解这类数据 {#visual-guide}

<div class="data-media" markdown>

<p class="data-media-label">实拍 · 第一人称活动</p>

<video class="data-video" controls playsinline preload="none" poster="../../assets/diagrams/data-egocentric.svg" aria-label="EPIC-KITCHENS：从第一人称看厨房操作" aria-describedby="egocentric-video-caption">
  <source src="https://epic-kitchens.github.io/static/videos/03x03_videoWall.mp4" type="video/mp4">
  您的浏览器未能播放嵌入视频，可通过下方链接观看官方演示。
</video>

<p class="data-poster-note">封面为本站绘制的概念示意；点击播放，查看官方演示。</p>

<p id="egocentric-video-caption">官方 3×3 视频墙展示真实厨房活动的第一人称录像。这里看到的是人在做什么，以及手与物体怎样交互；画面本身并不是机器人动作命令。</p>

<div class="data-watch-notes" markdown>

**观看时留意**

- 相机随佩戴者移动，操作的手和物体常处于画面近处。
- 同一动作的背景、对象和视角会变化，是理解泛化难度的直观例子。
- 视频中的行为仍需叙述、动作类别和起止时间等标注来组织监督。

</div>

<p class="data-media-credit">来源：<a href="https://epic-kitchens.github.io/2025">EPIC-KITCHENS：从第一人称看厨房操作</a> · EPIC-KITCHENS 团队 / University of Bristol 等；官方项目页公开演示。 · 项目数据许可：<a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a></p>
<p class="data-media-links"><a href="https://epic-kitchens.github.io/static/videos/03x03_videoWall.mp4">直接打开视频 ↗</a><a href="https://epic-kitchens.github.io/2025">官方项目页 ↗</a></p>

</div>

## 怎样采集

典型流程是：**佩戴相机 → 记录日常活动或指定技能 → 对齐时间与传感器 → 补充叙述和任务标注 → 按参与者、场景或任务划分数据**。

头戴相机能跟随人的移动，持续看到操作附近的环境；代价是头部运动、遮挡和视野外动作。音频、IMU、眼动和空间定位取决于设备与发布子集，不能把某个项目的全部模态当作所有 EGO 数据的标配。Ego4D 的附加模态仅覆盖部分数据；Ego-Exo4D 则使用 Aria 眼镜，并同步外部 GoPro 视角。[Ego4D 项目](https://ego4d-data.org/)、[Ego-Exo4D 数据说明](https://docs.ego-exo4d-data.org/overview/)

采集完视频还需要定义监督目标。逐段叙述“打开抽屉”、标注动作起止时间、寻找拿走杯子的时刻，是不同的标注任务。叙述的时间点也不必然等于动作开始时间；EPIC-KITCHENS 的官方标注明确区分这些字段。[EPIC-KITCHENS 标注说明](https://github.com/epic-kitchens/epic-kitchens-100-annotations)

## 实际能拿到什么

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 信号层 | 常见内容 | 对使用者意味着什么 |
| --- | --- | --- |
| 观测 | 视频帧、音频、时间戳；部分数据有 IMU | 可以学习外观与时序，仍需检查帧率和同步 |
| 语义 | 叙述、动词与名词、动作区间、任务步骤 | 监督“发生了什么”“接下来可能做什么” |
| 几何 | 特定项目提供手/人体关键点、相机轨迹、点云 | 必须区分人工标注、三角化和模型估计 |
| 通常缺少 | 机器人关节状态、控制命令、力矩、控制周期 | 不能直接组成机器人观测—动作训练对 |

</div>

这张表描述需要检查的字段层次，不表示每个项目都提供所有字段。尤其要分清视频中的 **action 类别**与控制器接收的 **action 数值**：前者可以是“切胡萝卜”，后者可能是一组关节目标。

## 代表项目

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 数据与一手入口 | 采集与实际字段 | 在具身中的定位 | 使用边界 |
| --- | --- | --- | --- |
| [Ego4D](https://ego4d-data.org/) | 头戴相机记录多样日常活动；视频、叙述及面向不同基准的标注，附加模态按子集提供 | 情景记忆、手物交互、活动预测与通用视频表征 | 标注服务于具体基准；不能默认所有视频具有 3D 手姿态 |
| [EPIC-KITCHENS-100](https://epic-kitchens.github.io/2025) | 在参与者家庭厨房中录制非脚本活动；动作起止时间、动词/名词、叙述；另有自动手物标注 | 厨房操作识别、动作预判、视频与语言对齐 | “动作类别”不是轨迹；自动标注与人工标注应分开使用 |
| [Ego-Exo4D](https://ego-exo4d-data.org/) | Aria 与外部相机同步记录技能活动；提供视听、IMU、空间处理结果及多类语言/姿态标注 | 跨视角对应、技能步骤理解、人体与手部研究 | 字段覆盖随标注子集变化；人体和相机轨迹不等于机器人控制量 |

</div>

Ego-Exo4D 特别适合解释分类的交叉：同一次动作可以同时拥有第一视角、第三视角，以及人体关键点；它无需被强行塞进唯一目录。[官方数据与标注概览](https://docs.ego-exo4d-data.org/overview/)

## 在具身学习链条中的位置

从这些数据的观测和标注出发，较自然的用途是训练视觉或视频语言表征，让模型辨认操作对象、理解状态变化、定位任务步骤，以及利用历史推测后续事件。这些能力可以服务于机器人的感知和高层决策。

若目标是机器人动作生成，还需要建立跨身体的连接：例如增加人体与物体几何、学习动作表征，再与机器人示范配对或做动作重定向。这里描述的是选型思路，不能据此断言上述数据已提供完整的机器人训练管线。**看懂人的操作，是策略学习可利用的条件；机器人如何执行仍需要额外监督和验证。**

## 使用前确认

- **先看标注子集。** 视频、眼动、手部关键点和文本可能具有不同覆盖范围，缺失值不能当作零值。
- **按任务选划分。** 相邻片段或同一次录制的多视角不应跨越训练与测试集合；泛化到新人、新环境需要单独评估。
- **检查时间含义。** 叙述时间、动作边界、视频帧和传感器时间需对齐；离线预判实验不能读到未来帧。
- **保留来源与版本。** 记录下载版本、标注来源及许可。Ego4D / Ego-Exo4D 的获取入口可能迁移，以官方文档为准。

*资料核验：2026-11-15。以上为代表项目，字段以所下载版本和对应子集为准。*

[返回数据地图](index.md)
