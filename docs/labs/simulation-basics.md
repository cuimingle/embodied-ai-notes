---
title: 仿真基础实验
description: 用振子解析解检查时间积分，用 MuJoCo 方块落地分辨求解精度与接触模型的影响。
---

<span class="kicker">LAB / SIMULATION BASICS</span>

# 仿真基础实验：先检查世界怎样运行

两个实验分别隔离时间积分与接触计算。振子有解析解，可以核对数值轨迹；方块落地有静态受力基准，可以检查接触支撑。它们不含策略训练，结果只对应文中明确的模型和配置。

本页数值来自 2026-11-16 的实际运行。[下载参考结果摘要](../assets/data/simulation-reference.json)，可查看完整配置、模型 XML、依赖版本与源文件 SHA256；逐步轨迹由下方命令重新生成。

## 实验一：无阻尼弹簧振子

模型为 $m\ddot{x}+kx=0$，默认 $m=1\,\mathrm{kg}$、$k=1\,\mathrm{N/m}$、$x_0=1\,\mathrm{m}$、$v_0=0$，总时长 20 s。解析解为 $x(t)=\cos t$、$v(t)=-\sin t$，机械能恒为 0.5 J。

下面的图形由浏览器实时计算；切换位移与能量，比较显式 Euler、半隐式 Euler 和解析解。固定时长后改变步长，观察轨迹误差如何积累。

<div class="simulation-widget" data-simulation-widget="oscillator">
  <p>交互实验需要启用 JavaScript。也可按下方命令运行 Python 实验，查看完整计算轨迹。</p>
</div>

图中的曲线是三个计算过程在同一组初始条件下的结果。半隐式 Euler 在本例满足稳定步长条件时，能量围绕基准波动；它不逐步精确守恒，也不适用于任意大步长。推导见[时间积分与控制频率](../simulation/time-stepping.md)。

### 在本地复查

振子只使用 Python 标准库。从仓库根目录运行：

```bash
python -m examples.simulation.oscillator --output outputs/oscillator.json
python -m examples.simulation.oscillator --dt 0.025 --steps 800 --output outputs/oscillator-finer.json
```

两条命令都模拟 20 s。改变步长时同时调整步数，避免把总时长变化混入对照。JSON 的 `trajectories.euler` 和 `trajectories.semi_implicit` 保存每步时间、位移、速度、解析解和能量；`metrics` 保存误差统计。

### 参考运行结果

本次 Linux / Python 3.12.14 实际运行，在默认步长 0.05 s、400 步下得到：

| 方法 | 20 s 时能量 / J | 全程最大位置绝对误差 / m |
| --- | ---: | ---: |
| 解析解 | 0.500000 | 0 |
| 显式 Euler | 1.357446 | 0.604346 |
| 半隐式 Euler | 0.491240 | 0.026803 |

这支持“本配置中显式 Euler 能量增长、半隐式 Euler 误差较小”的观察。稳定性条件由原理页分析，不能仅由一张曲线推断一般结论。

## 实验二：方块落地与接触求解

按[MuJoCo 最小实践](../simulation/mujoco.md)安装依赖，再运行：

```bash
python -m examples.simulation.contact --output outputs/contact.json
python -m examples.simulation.contact --sweep --output outputs/contact-sweep.json
```

场景为质量 1 kg、边长 0.1 m 的自由刚体方块，从中心高度 0.5 m、零速度落向水平地面。物理步长 0.002 s，总时长 2 s，积分器固定 Euler，求解器为 Newton，迭代上限 50、容差 $10^{-10}$。默认接触参数为 `solref="0.02 1"`、`solimp="0.9 0.95 0.001 0.5 2"`，完整模型 XML 写入报告。

### 分别改变求解精度和接触响应

`--sweep` 运行六种配置。每种配置只相对默认值改变一个参数，初始位置、步长、质量和积分器都相同。

| 配置 | 唯一变化 | 全程最大几何穿透 / mm | 尾段平均穿透 / mm | 尾段平均支撑力 / N |
| --- | --- | ---: | ---: | ---: |
| 默认 | 无 | 17.2208 | 0.057133 | 9.810000 |
| 迭代上限 1 | `iterations: 50 → 1` | 17.2208 | 0.057133 | 9.810000 |
| 迭代上限 5 | `iterations: 50 → 5` | 17.2208 | 0.057133 | 9.810000 |
| 放宽容差 | `tolerance: 1e-10 → 1e-3` | 17.2208 | 0.057133 | 9.810000 |
| 更软的响应 | 时间常数 `0.02 → 0.1 s` | 101.4198 | 0.738951 | 9.809973 |
| 更硬的响应 | 时间常数 `0.02 → 0.01 s` | 6.6802 | 0.014337 | 9.810000 |

以上为 MuJoCo 3.3.7 / Python 3.12.14 的实际结果。尾段固定取最后四分之一，即约 1.5–2 s；取这个窗口本身不保证已经静止，还需检查速度。默认场景尾段竖直速度 RMS 约 $10^{-15}$ m/s，更软配置约 $1.96\times10^{-5}$ m/s。

这里最重要的两个观察是：

- **提高迭代预算并未改变这个简单对称场景的结果。** 它不足以说明复杂堆叠或抓取任务也能用一次迭代完成，应检查具体问题的收敛。
- **改变接触时间常数显著改变了穿透。** 更软配置在冲击阶段的穿透甚至超过方块边长；它是用于显示模型敏感性的对照，不是校准过的真实材料参数。冲击期峰值和静止尾段必须分开看。

接触模型与求解器的职责见[物理求解器](../simulation/solvers.md)。软约束允许的形变、数值求解误差与时间离散误差会共同影响结果；不能把所有穿透都解释成“迭代次数不够”。

### 指标怎样测量

几何穿透按方块世界坐标中的最低点与 z = 0 地面之差计算；即使方块旋转，也使用旋转后的包围高度。支撑力由接触坐标系转换到世界坐标系，取作用于方块的竖直分量并求和。

实验使用 `mj_step1` / `mj_step2` 将同一时刻的状态、接触几何与求解后的力配对，末帧使用 `mj_forward` 刷新。该分步实现固定 Euler 积分器；更换积分器需要重新检查接口语义。

JSON 保留每个场景的 `config`、`model_xml`、`environment`、`measurement_window`、`warnings`、`trajectory` 和 `metrics`。这里没有随机化，`seed` 明确为空。报告中的源文件摘要用于核对代码，未经修改的参数也完整保留。

## 怎样核对与继续

实验的检查包含解析解、积分误差、静态支撑力、初次接触前的自由落体与参数对照。浏览器与 Python 在同一组参数下核对轨迹。重新运行时以你生成的 JSON 为准，表格给出的是本次参考结果。

```bash
python -m unittest discover -s tests -p 'test_simulation.py' -v
node --test tests/test_simulation_browser.cjs
```

下一步是在固定物理步长下加入单关节 PD 控制，分别改变控制周期和惯量，再接入策略训练。当前实验不提供真机迁移的证据。

[回到仿真导览](../simulation/index.md) · [MuJoCo 实践说明](../simulation/mujoco.md)
