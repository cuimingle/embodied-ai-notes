---
title: 仿真数据
description: 区分仿真环境、场景资产、任务配置与交互轨迹，理解操作和导航数据如何生成、训练与评测。
---

<span class="kicker">DATA / SIMULATION</span>

# 仿真：把可交互的环境变成数据

仿真数据来自虚拟环境中的渲染与物理计算。它既可以是提前保存的专家示范，也可以是策略训练时在线产生的观测、动作、奖励和下一步观测。**仿真说明数据在哪里产生；遥操、规划器和强化学习说明行动由谁产生。** 在仿真里遥操，仍然属于遥操采集。

首先分清四样东西：模拟器负责运行世界，场景资产提供几何与材质，任务配置规定初始条件和目标，交互轨迹记录实际执行过程。下载一批场景或导航任务配置，不代表已经得到同等数量的专家示范。

要进一步理解环境怎样计算运动与接触，进入[仿真模拟](../simulation/index.md)。其中的[物理求解器](../simulation/solvers.md)与[时间积分](../simulation/time-stepping.md)解释轨迹背后的模型和数值条件；本文继续讨论数据生成与使用。


## 看一段演示，理解这类数据 {#visual-guide}

<div class="data-media" markdown>

<p class="data-media-label">仿真渲染 · 操作示范</p>

<video class="data-video" controls playsinline preload="none" poster="../../assets/diagrams/data-simulation.svg" aria-label="ManiSkill：PickCube 仿真操作示范" aria-describedby="simulation-video-caption">
  <source src="https://raw.githubusercontent.com/mani-skill/ManiSkill/main/figures/environment_demos/PickCube-v1_rt.mp4" type="video/mp4">
  您的浏览器未能播放嵌入视频，可通过下方链接观看官方演示。
</video>

<p class="data-poster-note">封面为本站绘制的概念示意；点击播放，查看官方演示。</p>

<p id="simulation-video-caption">仿真渲染的成功示范：Panda 机械臂抓起红色方块并移到目标位置。这里展示环境中的执行过程；具体轨迹由规划器、遥操还是策略产生，需要查对应数据元信息。</p>

<div class="data-watch-notes" markdown>

**观看时留意**

- 机械臂、方块和目标都位于模拟场景中。
- 图像只是轨迹的一部分，动作、环境状态和成功标签可另行记录。
- 官方任务卡说明初始位置与目标随机化；一段成功视频不能代表完整泛化结果。

</div>

<p class="data-media-credit">来源：<a href="https://maniskill.readthedocs.io/en/latest/tasks/table_top_gripper/index.html#pickcube-v1">ManiSkill：PickCube 仿真操作示范</a> · ManiSkill Contributors · PickCube-v1 官方任务演示</p>
<p class="data-media-links"><a href="https://raw.githubusercontent.com/mani-skill/ManiSkill/main/figures/environment_demos/PickCube-v1_rt.mp4">直接打开视频 ↗</a><a href="https://maniskill.readthedocs.io/en/latest/tasks/table_top_gripper/index.html#pickcube-v1">官方项目页 ↗</a></p>

</div>

## 怎样生成

**搭建场景与机器人 → 配置传感器、控制器和目标 → 选择数据生成者 → 执行动作并记录 → 验证成功与回放一致性。** 常见生成者包括：人工脚本与运动规划器、人在仿真中遥操、已经训练好的专家策略，以及正在探索的学习策略。

这几类轨迹的分布不同。规划器往往产生几何上规整的路径；人会停顿、修正和尝试；强化学习策略受奖励和训练分布影响。成功演示可供模仿学习，探索中的失败轨迹则能帮助学习价值、风险和恢复，不能只按文件格式把它们混为一类。

## 应保存哪些字段

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 层次 | 典型字段 | 作用 |
| --- | --- | --- |
| 策略可见信息 | RGB、深度、机器人本体状态、任务指令 | 定义部署时策略真正能用的输入 |
| 交互过程 | 动作、时间戳、奖励、终止与截断、成功标记 | 构建模仿学习或 RL 样本，检查失败与超时 |
| 特权信息 | 精确物体位姿、全局地图、碰撞和接触状态 | 专家生成、评测、辅助监督；需与策略输入隔离 |
| 可复现信息 | 场景与任务 ID、随机种子、控制模式、物理后端及版本 | 回放、重渲染、解释训练与评测差异 |

</div>

这些是建议检查的字段，不是每个项目都会全部保存。动作必须附带坐标系、单位、控制频率和控制器含义；同样的数值在关节位置控制与末端增量控制中不是同一个动作。

## 代表环境与数据

<div class="data-table" markdown>

<p class="data-table-hint">左右滑动查看完整对照 →</p>

| 项目 | 数据实际怎样产生 | 观测与监督 | 具身定位 |
| --- | --- | --- | --- |
| [RLBench](https://arxiv.org/abs/1909.12271) | 任务作者设置路点，运动规划器沿路点生成操作示范；环境也支持策略在线交互 | 可配置多相机 RGB、深度、点云、掩码和机器人状态；任务语言与控制目标按接口选取 | 多任务操作、模仿学习、RL 与任务泛化评测 |
| [ManiSkill](https://maniskill.readthedocs.io/en/latest/user_guide/learning_from_demos/setup.html) | 来源随任务和版本变化，包括规划、RL 专家和遥操；应查轨迹 JSON 元数据 | 动作、环境状态及可回放生成的视觉观测；控制器、观测模式、物理后端有明确区分 | 操作策略训练、示范学习及物体泛化 |
| [LIBERO](https://github.com/Lifelong-Robot-Learning/LIBERO) 原版 | 发布数据为人类在仿真中遥操得到的示范，不应笼统称为脚本生成 | 外部与腕部 RGB、关节和夹爪状态、动作，以及任务语言 | 语言条件操作、终身学习和知识迁移评测 |
| [Habitat](https://aihabitat.org/docs/habitat-lab/quickstart.html) 的导航任务 | 加载场景与 episode 配置，策略在线运行；也可用最短路径跟随器生成导航轨迹 | 按任务配置提供图像、目标、动作与指标；episode 本身主要记录场景、起点、目标等 | 视觉导航、语言导航、IL / RL 与场景泛化 |

</div>

RLBench 的观测字段可查[官方 Observation 定义](https://github.com/stepjam/RLBench/blob/master/rlbench/backend/observation.py)；LIBERO 的视觉与本体输入可查[默认数据配置](https://github.com/Lifelong-Robot-Learning/LIBERO/blob/master/libero/configs/data/default.yaml)。ManiSkill 的[演示格式](https://maniskill.readthedocs.io/en/latest/user_guide/datasets/demos.html)说明：下载的压缩轨迹可能不含图像，需要回放状态生成观测，不能把“未存图像”误判为不支持视觉训练。

Habitat 的 [NavigationEpisode](https://aihabitat.org/docs/habitat-lab/habitat.tasks.nav.nav.NavigationEpisode.html) 与[最短路径跟随示例](https://github.com/facebookresearch/habitat-lab/blob/main/examples/shortest_path_follower_example.py)也应分开看：前者是任务定义，后者才会实际执行动作。类似地，[Isaac Lab](https://isaac-sim.github.io/IsaacLab/main/index.html) 是机器人学习框架，不能仅凭框架名称推断某份数据的采集方式和监督字段。

## 在训练链条中怎样使用

仿真允许重置环境、控制变量和反复试错，适合用专家示范初始化策略，再通过在线交互优化；也适合固定任务与种子比较算法。若要训练视觉策略，应明确哪些状态只供专家或价值网络使用，哪些输入在最终部署时仍然可获得。

**特权状态泄漏是需要主动检查的边界。** 用精确物体位姿指导专家生成数据是合理设计；把这个位姿悄悄拼进待部署视觉策略的输入，则改变了问题。导航中的精确定位、全局地图和最短路径同样需要说明使用权限。

**仿真成功率不能直接等同真机能力。** 摩擦、柔顺性、接触求解、传感器噪声、延迟和物体外观都可能不同。域随机化与系统辨识可以缩小部分差异，最终仍需真机评测。训练和测试还应隔离场景、物体及任务变化；复用同一资产换几个随机种子，通常不足以说明跨环境泛化。

资料核验：2026-11-15。本文按官方项目文档区分数据与平台，不将不同版本、任务和派生数据的规模合并计算。

[返回数据地图](index.md)
