---
title: MuJoCo 最小实践
description: 在 CPU 上运行固定版本的 MuJoCo，检查模型、步进、状态与重置，再比较接触参数。
---

<span class="kicker">SIMULATION / FIRST RUN</span>

# MuJoCo 最小实践

目标是在本地完成一次可复查的物理计算：加载一个方块与地面的模型，推进两秒，检查位置、接触和支撑力，最后重置。这个无执行器的场景用于隔离接触计算；控制与策略学习在后续任务中接入。

## 安装与版本

从仓库根目录执行。示例使用 Python 3.11+；本版实际验证环境为 Linux、Python 3.12.14、MuJoCo 3.3.7。Windows 可将激活命令替换为 `.venv\Scripts\Activate.ps1`。

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-simulation.txt
python -c "import mujoco; print(mujoco.__version__)"
```

物理实验不创建渲染器，不需要 GPU 或桌面窗口。文档网站与标准库振子可独立运行；MuJoCo 仅用于本页和接触实验。

## 从模型到状态

`examples/simulation/contact.py` 的 `model_xml()` 生成 MJCF 模型。它固定使用米、千克、秒：一个质量 1 kg、边长 0.1 m 的方块，中心从 0.5 m 高度静止释放，地面位于 z = 0，重力加速度为 9.81 m/s²。

```python
import mujoco

from examples.simulation.contact import ContactConfig, model_xml

config = ContactConfig()
model = mujoco.MjModel.from_xml_string(model_xml(config))
data = mujoco.MjData(model)

print("nq, nv, nu:", model.nq, model.nv, model.nu)
for _ in range(config.steps):
    mujoco.mj_step(model, data)

# Refresh geometry and forces at the final state without advancing time.
mujoco.mj_forward(model, data)
print("time:", data.time)
print("position:", data.qpos[:3])
print("linear velocity:", data.qvel[:3])
print("contacts:", data.ncon)

mujoco.mj_resetData(model, data)
mujoco.mj_forward(model, data)
print("reset time and position:", data.time, data.qpos[:3])
```

这里的自由关节有 7 个位置坐标（平移与四元数）和 6 个速度自由度，因此 `nq` 与 `nv` 不相等。这个模型没有执行器，`nu = 0`；它不接收控制输入。添加执行器后，控制指令写入 `data.ctrl`，其物理含义由执行器配置决定，不能统一当作关节力矩。

| 对象或操作 | 含义 | 检查重点 |
| --- | --- | --- |
| `MjModel` | 编译后的模型与选项 | 质量、惯量、碰撞形状、步长与求解器 |
| `MjData` | 可变状态和计算缓存 | 位置、速度、接触、力与时间 |
| `mj_step` | 计算并推进一个物理时间步 | 控制周期可能包含多个物理步 |
| `mj_forward` | 在当前状态重新计算派生量 | 不推进时间；手动修改状态后应刷新缓存 |
| `mj_resetData` | 恢复模型默认初始状态 | 自定义任务分布需再设置状态并调用 `mj_forward` |

## 跑通完整接触实验

```bash
python -m examples.simulation.contact --output outputs/contact.json
python -m examples.simulation.contact --sweep --output outputs/contact-sweep.json
```

第一条运行默认场景，第二条运行六组单因素对照。输出包括模型 XML、配置、版本与代码来源、测量窗口、实际轨迹及指标；本实验没有随机采样，报告中的 `seed` 为 `null`，不虚构随机种子。

读结果时先检查以下三件事：

1. **物体是否获得支撑**：尾段平均竖直支撑力是否接近 9.81 N，速度是否趋近于零。
2. **误差属于什么阶段**：冲击时的最大穿透与静止尾段平均穿透分别报告。
3. **只改变了哪个参数**：容差和迭代上限改变求解条件；接触时间常数改变软约束响应。

具体配置、观察结果与限制见[仿真基础实验](../labs/simulation-basics.md)。

## 怎样继续接到机器人任务

当前模型可以检查物理计算。接入控制时，需要加入关节、执行器、动作限制和更新周期；接入学习时，再定义策略观测、目标、重置分布与评价条件。

沿[从 RL 到具身任务](../rl/to-embodied.md)的定义表逐项实现。尤其要区分策略可见观测与仿真内部状态；本例读取的精确位置用于诊断，不代表真实机器人能直接获得同样的信息。

## 常见问题

- **找不到 `mujoco`**：确认激活了安装依赖的环境，使用同一个 `python -m pip` 与 `python`。
- **没有图形窗口**：这里运行的是无渲染物理实验，结果保存在 JSON。图像生成和可视化属于独立环节。
- **步进后力和位置似乎对不上**：注意引擎缓存的求值时刻。接触实验使用固定 Euler 积分器的分步接口，记录同一物理时刻的状态、接触几何与力，最后额外调用 `mj_forward`。
- **提高迭代上限结果没变**：简单场景可能已经收敛。先检查实际迭代统计，再决定是否需要提高预算。
- **设置非常硬的接触后不稳定**：结合[求解器](solvers.md)和[时间积分](time-stepping.md)检查；示例会拒绝违反默认 `refsafety` 下界的时间常数，避免请求值被引擎静默调整。

## 来源与版本

- [MuJoCo 3.3.7 Python 接口](https://mujoco.readthedocs.io/en/3.3.7/python.html)。
- [MuJoCo 3.3.7 仿真循环](https://mujoco.readthedocs.io/en/3.3.7/programming/simulation.html)。
- [MJCF XML 参考](https://mujoco.readthedocs.io/en/3.3.7/XMLreference.html)。

[回到仿真导览](index.md) · [打开实验室](../labs/simulation-basics.md)
