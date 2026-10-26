/* Deterministic teaching traces. Each frame is an actual numerical update. */
(function (root, factory) {
  const core = typeof module === "object" && module.exports ? require("./rl-core.js") : root.RLTeaching;
  const api = factory(core);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RLSimulations = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (C) {
  "use strict";
  const copy = x => JSON.parse(JSON.stringify(x));
  const zeros = () => Array(9).fill(0);
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const fmt = x => Number(x).toFixed(3);
  const actionLabels = ["a₁ 上", "a₂ 右", "a₃ 下", "a₄ 左", "a₅ 停留"];
  function make(name, options = {}) {
    const gamma = Number(options.gamma ?? 0.9), alpha = Number(options.alpha ?? 0.1);
    const rng = C.random(7), frames = [], N = 80;
    const add = data => frames.push(copy({ step: frames.length, ...data }));
    let view = "line", series = [], labels = [], xLabel = "更新次数", caption = "";
    if (name === "trajectory") {
      view = "grid"; let state = 1, total = 0;
      const moves = options.mode === "forbidden" ? [3, 3, 2, 2] : [2, 3, 3, 2];
      add({ state, values: zeros(), note: "从 s₁ 出发；目标 s₉ 是普通状态，到达后继续行动。" });
      [...moves, ...Array(8).fill(5)].forEach((action, k) => {
        const [next, reward] = C.transition(state, action); total += gamma ** k * reward;
        add({ state: next, values: zeros(), note: `s${state} — a${action} → s${next}；r = ${reward}；已收集折扣和 = ${fmt(total)}` }); state = next;
      });
      caption = "圆点按实际转移移动；橙色禁区可以进入并受到奖励惩罚。";
    } else if (name === "evaluation" || name === "iteration" || name === "td") {
      view = "grid"; let values = zeros(), state = 1, action = C.sample(Array(5).fill(0.2), rng) + 1;
      const policy = C.examplePolicy(), q = Array.from({ length: 9 }, () => Array(5).fill(0));
      add({ values, state, note: "初始估计 v₀ = 0。格内数字是当前价值估计。" });
      for (let k = 0; k < N; k++) {
        let note;
        if (name === "evaluation") {
          values = C.backup(values, policy, gamma);
          note = `固定书中表 1.2 的 π；执行第 ${k + 1} 次 v ← rπ + γPπv；v(s₉) = ${fmt(values[8])}`;
        } else if (name === "iteration") {
          const greedy = C.greedyPolicy(C.actionValues(values, gamma));
          const mode = options.mode ?? "1";
          if (mode === "exact") values = C.evaluate(greedy, gamma);
          else for (let j = 0; j < Number(mode); j++) values = C.backup(values, greedy, gamma);
          note = `第 ${k + 1} 次先贪心改进，再${mode === "exact" ? "解线性方程精确评估" : `做 ${mode} 次策略评估`}；v(s₁) = ${fmt(values[0])}`;
        } else {
          const [next, reward] = C.transition(state, action), nextAction = C.sample(Array(5).fill(0.2), rng) + 1;
          const method = options.mode ?? "td";
          let target, prediction;
          if (method === "td") {
            prediction = values[state - 1]; target = reward + gamma * values[next - 1];
            values[state - 1] += alpha * (target - prediction);
          } else {
            prediction = q[state - 1][action - 1];
            target = reward + gamma * (method === "sarsa" ? q[next - 1][nextAction - 1] : Math.max(...q[next - 1]));
            q[state - 1][action - 1] += alpha * (target - prediction);
            values = q.map(row => method === "sarsa" ? row.reduce((a, b) => a + b) / 5 : Math.max(...row));
          }
          note = `s${state}，a${action}，r=${reward}，s′=s${next}；目标 ${fmt(target)} − 原估计 ${fmt(prediction)} = TD 误差 ${fmt(target - prediction)}`;
          state = next; action = nextAction;
        }
        add({ values, state: name === "td" ? state : null, note });
      }
      caption = name === "td" ? "每步只更新访问的状态或状态动作项；Sarsa 显示均匀策略下的 q 均值，Q-learning 显示 max q。" : "价值通过一步备份逐渐传播。目标处停留仍获得 +1，因此其价值趋向 1/(1−γ)。";
    } else if (name === "action-values" || name === "optimality") {
      view = "bars"; labels = actionLabels; series = [{ key: "values", label: name === "optimality" ? "当前 q(s₃,a)" : "qπ(s₁,a)" }];
      let values = name === "action-values" ? C.evaluate(C.examplePolicy(), gamma) : zeros();
      for (let k = 0; k < (name === "action-values" ? 6 : 50); k++) {
        const q = C.actionValues(values, gamma), state = name === "action-values" ? 1 : 3;
        const row = q[state - 1], best = row.indexOf(Math.max(...row));
        add({ values: name === "action-values" ? row.map((v, i) => i < k ? v : 0) : row,
          active: name === "action-values" ? k - 1 : best,
          note: name === "action-values" ? `固定后续策略 π，只把第一步改为不同动作；已展开 ${k}/5 项。` : `第 ${k} 次备份：max q(s₃,a) = ${fmt(Math.max(...row))}，选择 a${best + 1}。` });
        if (name === "optimality") values = q.map(row => Math.max(...row));
      }
      caption = "a₁…a₅ 的顺序与原书一致；选择第一步动作并不意味着以后每一步也使用该动作。";
    } else if (name === "mc") {
      let estimate = 0;
      const truth = C.actionValues(C.evaluate(C.uniformPolicy(), gamma), gamma)[0][1];
      series = [{ key: "estimate", label: "样本均值 q̂" }, { key: "truth", label: "精确 qπ(s₁,a₂)" }];
      add({ estimate, truth, note: "固定从 (s₁,a₂) 出发，之后使用均匀随机策略。" });
      const horizon = Number(options.mode ?? 80);
      for (let k = 1; k <= N; k++) {
        let state = 1, action = 2; const rewards = [];
        for (let t = 0; t < horizon; t++) {
          const [next, reward] = C.transition(state, action); state = next; rewards.push(reward);
          action = C.sample(Array(5).fill(0.2), rng) + 1;
        }
        const result = C.discountedReturn(rewards, gamma); estimate += (result - estimate) / k;
        add({ estimate, truth, note: `第 ${k} 条采样轨迹：g = ${fmt(result)}；均值 = ${fmt(estimate)}；尾项误差界 ≤ ${fmt(gamma ** horizon / (1 - gamma))}` });
      }
      caption = "曲线每前进一步对应一条新轨迹；有限长度 H 的回报带有可计算的截断误差。";
    } else if (name === "epsilon") {
      view = "bars"; labels = actionLabels;
      series = [{ key: "expected", label: "ε-greedy 概率" }, { key: "values", label: "实际采样频率" }];
      const probabilities = C.epsilonGreedy([1, 3, 2, -1, 0], Number(options.epsilon ?? 0.2)), counts = Array(5).fill(0);
      add({ values: counts, expected: probabilities, note: "贪心动作为 a₂；探索时也可能再次抽到它。" });
      for (let k = 1; k <= N; k++) {
        counts[C.sample(probabilities, rng)]++;
        add({ values: counts.map(x => x / k), expected: probabilities, note: `采样 ${k} 次；a₂ 的理论概率 = ${fmt(probabilities[1])}，不是简单的 1−ε。` });
      }
      caption = "条形长度为概率或频率；非贪心动作保留正概率，但有限样本不保证全部被访问。";
    } else if (name === "stochastic") {
      let values = [0, 0, 0];
      series = [{ key: "constant", label: "常数 α" }, { key: "harmonic", label: "1/k" }, { key: "square", label: "1/k²" }, { key: "truth", label: "真实均值 1.2" }];
      add({ constant: 0, harmonic: 0, square: 0, truth: 1.2, note: "同一条样本流，对照三种步长。" });
      for (let k = 1; k <= N; k++) {
        const x = [-1, 1, 3][C.sample([0.2, 0.5, 0.3], rng)];
        values = values.map((w, i) => w - [alpha, 1 / k, 1 / k ** 2][i] * (w - x));
        add({ constant: values[0], harmonic: values[1], square: values[2], truth: 1.2,
          note: `k=${k}，xₖ=${x}；w ← w−αₖ(w−xₖ)。1/k² 的累计步长有限，可能过早停止纠偏。` });
      }
      caption = "有限长度随机曲线是现象演示，不是随机逼近收敛定理的证明。";
    } else if (name === "contraction") {
      let x = 3; const coefficient = Number(options.coefficient ?? 0.5);
      series = [{ key: "estimate", label: "xₖ" }, { key: "truth", label: "固定点 0" }];
      add({ estimate: x, truth: 0, note: "初值 x₀=3，f(x)=cx。" });
      for (let k = 1; k <= 30; k++) { x *= coefficient; add({ estimate: x, truth: 0, note: `x${k} = ${fmt(x)}；每步误差乘以 c=${coefficient}。` }); }
      caption = "这是原书例 3.3 的一维收缩映射，不是机器人运动轨迹。";
    } else if (name === "n-step") {
      view = "bars"; labels = ["已采样奖励", "自举尾项", "目标合计"]; series = [{ key: "values", label: "折扣价值" }];
      const rewards = [0, 0, 0, 1, 1, 1, 1, 1], futures = [gamma ** 2 / (1 - gamma), gamma / (1 - gamma), ...Array(6).fill(1 / (1 - gamma))];
      for (let n = 1; n <= 8; n++) {
        const observed = C.discountedReturn(rewards.slice(0, n), gamma), tail = gamma ** n * futures[n - 1];
        add({ values: [observed, tail, observed + tail], note: `n=${n}：采样奖励 ${fmt(observed)} + γⁿv(sₜ₊ₙ) ${fmt(tail)} = ${fmt(observed + tail)}` });
      }
      caption = "本例轨迹和策略确定且尾项精确，因此各 n 的目标相同；随机情形一般只在条件期望下相等。";
    } else if (name === "approximation") {
      view = "bars"; labels = Array.from({ length: 9 }, (_, i) => `s${i + 1}`);
      series = [{ key: "truth", label: "精确 vπ" }, { key: "values", label: "近似 v̂(s,w)" }];
      const basis = options.mode ?? "linear", truth = C.evaluate(C.uniformPolicy(), gamma);
      let weights = C.features(1, basis).map(() => 0), state = 1;
      add({ values: zeros(), truth, note: `特征维度 ${weights.length}；固定均匀策略，初始 w=0。` });
      for (let k = 1; k <= N; k++) {
        for (let batch = 0; batch < 25; batch++) {
          const action = C.sample(Array(5).fill(0.2), rng) + 1, [next, reward] = C.transition(state, action);
          const phi = C.features(state, basis), future = C.features(next, basis);
          const delta = reward + gamma * dot(weights, future) - dot(weights, phi);
          weights = weights.map((w, i) => w + alpha * delta * phi[i]); state = next;
        }
        const values = labels.map((_, i) => dot(weights, C.features(i + 1, basis)));
        const rmse = Math.sqrt(values.reduce((sum, v, i) => sum + (v - truth[i]) ** 2, 0) / 9);
        add({ values, truth, note: `已做 ${25 * k} 次 TD 半梯度更新；诊断 RMSE=${fmt(rmse)}；w=[${weights.map(fmt).join(", ")}]` });
      }
      caption = "one-hot 恢复表格表示；少量共享特征带来表示误差。动画运行 TD，并非用真实 vπ 做监督训练。";
    } else if (name === "dqn-target") {
      view = "bars"; labels = ["a₁", "a₂"]; series = [{ key: "values", label: "主表 w" }, { key: "target", label: "冻结目标表 wT" }];
      let main = [0, 0], target = [0, 0]; const period = Number(options.mode ?? 5);
      add({ values: main, target, note: "用两个数值表隔离展示冻结与同步机制。" });
      for (let k = 1; k <= N; k++) {
        const action = Math.floor(rng() * 6) % 2, reward = action;
        const y = reward + gamma * Math.max(...target); main[action] += alpha * (y - main[action]);
        const synced = k % period === 0; if (synced) target = [...main];
        add({ values: main, target, note: `更新 ${k}：y=${fmt(y)}；${synced ? "本次同步 wT ← w" : "目标表保持冻结"}。` });
      }
      caption = "这是目标冻结和回放抽样的数学小实验，没有神经网络，不是完整 DQN 训练。";
    } else if (name === "policy-gradient" || name === "actor-critic") {
      let theta = 0, weight = 0;
      series = name === "policy-gradient" ? [{ key: "probability", label: "π(a₂|s,θ) / 平均奖励" }] : [{ key: "weight", label: "critic 估计 v̂" }, { key: "truth", label: "当前策略的精确 vπ" }];
      add({ probability: 0.5, weight: 0, truth: 0.5 / (1 - gamma), note: "单状态、双动作的持续 MDP：a₁ 奖励 0，a₂ 奖励 1。" });
      for (let k = 1; k <= 160; k++) {
        let p = C.sigmoid(theta); const action = Number(rng() < p);
        if (name === "policy-gradient") {
          const gradient = options.mode === "exact" ? p * (1 - p) : action * (action - p); theta += alpha * gradient;
        } else {
          const delta = action + gamma * weight - weight;
          theta += 0.03 * delta * (action - p); weight += alpha * delta;
        }
        p = C.sigmoid(theta);
        add({ probability: p, weight, truth: p / (1 - gamma),
          note: `t=${k}，θ=${fmt(theta)}，π(a₂|s,θ)=${fmt(p)}，平均奖励=${fmt(p)}${name === "actor-critic" ? `，critic=${fmt(weight)}` : ""}。` });
      }
      caption = name === "actor-critic" ? "actor 改策略，critic 跟踪随策略变化的价值；使用原书算法 10.2 的 TD 误差。" : "优化原书的平均奖励指标 r̄π；这里可精确验证其梯度 p(1−p)。";
    } else if (name === "importance") {
      series = [{ key: "naive", label: "直接均值" }, { key: "corrected", label: "重要性加权均值" }, { key: "truth", label: "目标均值 0" }];
      const beta = Number(options.beta ?? 0.8); let naive = 0, corrected = 0;
      add({ naive, corrected, truth: 0, note: "目标分布 p₀(+1)=0.5；行为分布 p₁(+1)=β。" });
      for (let k = 1; k <= N; k++) {
        const positive = rng() < beta, x = positive ? 1 : -1, ratio = 0.5 / (positive ? beta : 1 - beta);
        naive += (x - naive) / k; corrected += (ratio * x - corrected) / k;
        add({ naive, corrected, truth: 0, note: `x=${x}；p₀(x)/p₁(x)=${fmt(ratio)}；加权均值=${fmt(corrected)}。` });
      }
      caption = "分布支持必须覆盖；权重修正期望，不保证有限样本方差较小。";
    } else if (name === "trpo" || name === "ppo") {
      xLabel = name === "trpo" ? "新策略 π(a₂|s,θ)" : "概率比率 ω";
      series = name === "trpo" ? [{ key: "value", label: "KL(旧策略 || 新策略)" }, { key: "limit", label: "预算 κ=0.02" }] : [{ key: "raw", label: "未裁剪 ωδ̂" }, { key: "value", label: "PPO-Clip 目标" }];
      for (let k = 1; k <= 60; k++) {
        const x = name === "trpo" ? 0.05 + 0.9 * (k - 1) / 59 : 0.05 + 1.9 * (k - 1) / 59;
        const advantage = Number(options.mode ?? 1);
        const value = name === "trpo" ? C.bernoulliKL(0.4, x) : C.ppoObjective(x, advantage, Number(options.epsilon ?? 0.2));
        add({ x, value, raw: x * advantage, limit: 0.02,
          note: name === "trpo" ? `新概率=${fmt(x)}，KL=${fmt(value)}；${value <= 0.02 ? "在约束内" : "超出约束"}。` : `ω=${fmt(x)}，δ̂=${advantage}，代理目标=${fmt(value)}。` });
      }
      caption = "书外扩展：展示一个目标函数的数值形状，不代表已经训练了 TRPO 或 PPO。";
    } else if (name === "grpo") {
      view = "bars"; labels = ["回答 1", "回答 2", "回答 3", "回答 4"];
      series = [{ key: "values", label: "奖励" }, { key: "advantages", label: "组相对优势" }];
      const rewards = options.mode === "equal" ? [1, 1, 1, 1] : [0, 0, 1, 1], advantages = C.groupAdvantages(rewards);
      for (let k = 0; k <= 5; k++) add({ values: rewards.map((r, i) => i < k ? r : 0), advantages: k === 5 ? advantages : [0, 0, 0, 0],
        note: k < 5 ? `收集同题回答 ${Math.min(k, 4)}/4；收齐后再做组内标准化。` : `优势=[${advantages.map(fmt).join(", ")}]；相同奖励组没有相对区分信号。` });
      caption = "书外扩展：使用总体标准差；标准差为零时将组相对信号设为零。";
    } else if (name === "gspo") {
      view = "bars"; labels = ["token 1 比率", "token 2 比率", "序列比率"];
      series = [{ key: "values", label: "新 / 旧策略比率" }];
      const ratios = [1.8, Number(options.ratio ?? 0.5)];
      for (let k = 0; k <= 2; k++) add({ values: [k > 0 ? ratios[0] : 0, k > 1 ? ratios[1] : 0, k > 0 ? C.sequenceRatio(ratios.slice(0, k)) : 0],
        note: k === 2 ? `exp(mean(log ωₜ)) = ${fmt(C.sequenceRatio(ratios))}；这是几何平均，不是算术平均。` : "逐个加入 token 的 log 比率，再计算长度归一化序列比率。" });
      caption = "书外扩展：只比较比率定义，不模拟语言模型训练，也不等同于原始轨迹重要性权重。";
    } else throw new Error(`Unknown simulation: ${name}`);
    return { name, view, series, labels, xLabel, caption, frames };
  }
  return { make };
});
