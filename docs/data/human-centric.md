---
title: HumanCentric · 人体与交互数据
description: 从 AMASS、GRAB、ARCTIC 与 DexYCB 理解人体动作、手物几何和接触标注，以及它们如何连接机器人学习。
---

<span class="kicker">DATA / 04 · HUMAN-CENTRIC</span>

# HumanCentric：把人的运动与交互变成结构化数据

本站用 HumanCentric 指**以人体、手以及人与物体交互的动作或几何标注为核心**的数据。这是便于阅读的组织口径，不是领域内唯一的标准分类。它回答“重点记录什么”，[EGO](egocentric.md) 则回答“从哪里看”；两者可以同时成立。

这类数据让研究者看到手指怎样弯曲、身体怎样配合、物体怎样转动。它比只有视频的资料多了一层结构，但人体关节、手部模型参数和机器人关节命令仍是不同对象。


## 看一段演示，理解这类数据 {#visual-guide}

<div class="data-media" markdown>

<p class="data-media-label">几何演示 · 双手与物体</p>

<video class="data-video" controls playsinline preload="none" poster="../../assets/diagrams/data-human-centric.svg" aria-label="ARCTIC：把双手与物体转成三维标注" aria-describedby="human-centric-video-caption">
  <source src="https://download.is.tue.mpg.de/arctic/static/videos/dexterous.mp4" type="video/mp4">
  您的浏览器未能播放嵌入视频，可通过下方链接观看官方演示。
</video>

<p class="data-poster-note">封面为本站绘制的概念示意；点击播放，查看官方演示。</p>

<p id="human-centric-video-caption">ARCTIC 官方“灵巧运动与动态接触”演示，重点观察双手与关节物体如何一起变化。它说明这类数据关注连续的手物几何与交互关系；这些标注仍需经过重定向，才能连接机器人动作。</p>

<div class="data-watch-notes" markdown>

**观看时留意**

- 右侧颜色表示手物距离，越亮代表越近；它不是接触力的读数。
- 把视频观测和拟合后的手部模型分开理解：后者属于处理得到的几何标注。
- 从人的动作迁移到机器人，还要处理骨架、关节限位与接触约束。

</div>

<p class="data-media-credit">来源：<a href="https://arctic.is.tue.mpg.de/">ARCTIC：把双手与物体转成三维标注</a> · ARCTIC 项目团队 · Dexterous Motion + Dynamic Contact 官方演示</p>
<p class="data-media-links"><a href="https://download.is.tue.mpg.de/arctic/static/videos/dexterous.mp4">直接打开视频 ↗</a><a href="https://arctic.is.tue.mpg.de/">官方项目页 ↗</a></p>

</div>

## 怎样采集与加工

常见路线有两条：一条用光学动捕跟踪人体与物体上的标记点，再拟合人体和物体模型；另一条用标定、同步的多视角 RGB 或 RGB-D 视频，结合人工关键点和几何优化估计姿态。ARCTIC 将动捕与多视角视频同步，DexYCB 则从多视角 RGB-D 和标注恢复手物姿态。[ARCTIC 论文](https://download.is.tue.mpg.de/arctic/arctic_april_24.pdf)、[DexYCB 论文](https://openaccess.thecvf.com/content/CVPR2021/papers/Chao_DexYCB_A_Benchmark_for_Capturing_Hand_Grasping_of_Objects_CVPR_2021_paper.pdf)

加工流程通常是：**采集/汇集序列 → 标定与同步 → 拟合人体、手和物体 → 计算交互关系 → 检查质量与划分数据**。其中“汇集”很重要：AMASS 并非重新拍摄所有动作，而是把既有光学动捕数据转换为统一人体模型表示。[AMASS 项目](https://amass.is.tue.mpg.de/)

## 实际能拿到什么

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 内容层 | 可能提供的字段 | 需要保留的区别 |
| --- | --- | --- |
| 人体和手 | 关节位置、旋转、身体形状、参数化网格、全局位移 | 关节定义和坐标系不同，参数不能直接拼接 |
| 物体 | 模型网格、6D 位姿、关节物体的开合状态 | 刚体姿态与物体自身关节角是不同字段 |
| 交互 | 人体与物体的距离、接触区域、操作序列 | 几何接近推得的接触不等于测量到的接触力 |
| 配套观测 | 视具体项目提供 RGB、深度、相机参数 | 动捕集合未必有配对视频；渲染深度也不是传感器深度 |

</div>

“3D 真值”同样需要追问来源：标记点测量之后拟合的网格、人工点标注之后优化的姿态，都经过模型和算法处理。训练与评估时应保留这条来源链。

## 代表项目

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 数据与一手入口 | 采集与实际字段 | 在具身中的定位 | 使用边界 |
| --- | --- | --- | --- |
| [AMASS](https://amass.is.tue.mpg.de/) | 统一已有光学动捕集合；用 MoSh++ 将标记点序列转换为人体模型参数与网格 | 人体运动先验、动作生成、重定向参考 | 不是新拍摄的视频库；不能默认包含手物交互或配对图像 |
| [GRAB](https://grab.is.tue.mpg.de/) | 动捕人体、手和物体，拟合时序网格与物体姿态，并计算接触 | 抓握、全身配合、人与物体接触先验 | 几何接触不是力觉；人体抓握需适配目标机器人 |
| [ARCTIC](https://arctic.is.tue.mpg.de/) | 动捕同步 8 个固定视角和 1 个头戴视角；双手、关节物体几何及交互标注 | 双手操作、关节物体运动、手物重建与接触关系 | 可同时归入 EGO/第三视角；距离场不代表力或摩擦参数 |
| [DexYCB](https://dex-ycb.github.io/) | 8 台同步 RGB-D 相机记录桌面抓取；手部 3D 姿态、物体 6D 位姿等 | 手物感知、人向机器人递物时的抓取研究 | 是人的抓取序列，不能当作机器人的动作日志 |

</div>

四者的重点也不相同：AMASS 主要帮助建模身体运动，GRAB 补充全身与物体的交互，ARCTIC 聚焦双手与可活动物体，DexYCB 强调 RGB-D 下的手物感知。不能仅用总帧数排出统一优劣。

## 怎样连接机器人学习

根据上述字段，可以把用途分为三层。第一层是**感知监督**：从图像估计手、物体和接触关系。第二层是**运动与交互先验**：学习动作时序、抓握构型、身体协调或物体可操作部位。第三层是**动作迁移的参考**：把人的示范转换成机器人可尝试的目标。

第三层需要额外工程。人的手指数量、臂长和自由度与机器人可能不同；重定向通常要定义对应关系，求解逆运动学，并检查关节限位、碰撞、动力学和接触是否可行。人体姿态可作为约束或参考，不能直接命名为“可执行动作”。这些是从数据走向部署的选型建议，并非每个项目随数据附带的能力。

## 使用前确认

- **先对齐几何约定。** 检查单位、左右手、根节点、旋转表示、世界/相机/物体坐标系和身体模型版本。
- **分清测量与派生。** 深度、模型拟合、渲染、距离阈值接触应分别记录，避免把派生标签当成独立传感器真值。
- **避免评估泄漏。** 同一序列的不同相机帧应保持同组；新人、新物体和新动作需要不同测试划分。
- **确认可获取范围。** 发布版本、申请条件和许可各不相同，下载到的字段才是训练设计的依据。

*资料核验：2026-11-15。所列为代表项目；HumanCentric 在本站采用上述内容口径。*

[返回数据地图](index.md)
