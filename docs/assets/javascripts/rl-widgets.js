/* Accessible playback controls and SVG views for the textbook experiments. */
(function () {
  "use strict";
  const titles = {
    trajectory: "状态、动作与持续回报", evaluation: "逐轮求解 Bellman 方程",
    "action-values": "固定后续策略，比较第一步动作", optimality: "从动作加权到动作最大化",
    contraction: "收缩映射逼近固定点", iteration: "策略改进与评估的交替",
    mc: "用轨迹样本估计动作价值", epsilon: "ε-greedy 的概率与采样",
    stochastic: "同一条样本流，不同的步长", td: "一次真实的 TD 更新",
    "n-step": "采样奖励与自举尾项", approximation: "从 one-hot 到共享特征",
    "dqn-target": "目标冻结与定期同步", "policy-gradient": "通过 θ 改变动作概率",
    "actor-critic": "actor 改策略，critic 跟踪价值", importance: "从行为分布校正目标均值",
    trpo: "KL 约束允许多大变化", ppo: "正负优势下的裁剪目标",
    grpo: "收齐一组回答，再计算相对优势", gspo: "从 token 比率到序列比率"
  };
  const modes = {
    trajectory: [["safe", "绕开禁区"], ["forbidden", "经过禁区"]],
    iteration: [["1", "每次评估 1 轮（VI）"], ["3", "每次评估 3 轮（截断 PI）"], ["exact", "精确评估（PI）"]],
    mc: [["80", "轨迹长度 H=80"], ["20", "轨迹长度 H=20"]],
    td: [["td", "TD(0) 策略评估"], ["sarsa", "Sarsa 策略评估"], ["q-learning", "Q-learning 控制"]],
    approximation: [["linear", "线性特征 [1,x,y]"], ["quadratic", "二次特征（6 维）"], ["one-hot", "one-hot（9 维）"]],
    "dqn-target": [["5", "每 5 次同步"], ["1", "每次同步"], ["20", "每 20 次同步"]],
    "policy-gradient": [["sample", "单次采样梯度"], ["exact", "精确梯度对照"]],
    ppo: [["1", "正优势 δ̂=+1"], ["-1", "负优势 δ̂=−1"]],
    grpo: [["different", "奖励 [0,0,1,1]"], ["equal", "奖励 [1,1,1,1]"]]
  };
  const noGamma = new Set(["stochastic", "epsilon", "contraction", "importance", "trpo", "ppo", "grpo", "gspo"]);
  const rateKinds = new Set(["stochastic", "td", "approximation", "dqn-target", "policy-gradient", "actor-critic"]);
  const numeric = x => Number.isFinite(x) ? (Math.abs(x) < 0.0005 ? "0" : x.toFixed(3)) : "—";
  const ns = "http://www.w3.org/2000/svg";
  function svgElement(tag, attrs, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function init(root) {
    const name = root.dataset.rlDemo;
    if (!titles[name] || root.dataset.ready) return;
    root.dataset.ready = "true";
    root.innerHTML = '<h3 class="demo-title"></h3><div class="demo-parameters"></div><div class="demo-controls"><button type="button" data-action="play">播放</button><button type="button" data-action="step">单步</button><button type="button" data-action="reset">重置</button><output class="demo-step"></output></div><div class="demo-visual"></div><ul class="demo-legend"></ul><p class="demo-note" role="status"></p><label class="demo-progress-label">播放进度 <input class="demo-progress" type="range" min="0" value="0" aria-label="播放进度"></label><p class="demo-caption"></p>';
    root.querySelector(".demo-title").textContent = titles[name];
    const parameters = {}, parameterBox = root.querySelector(".demo-parameters");
    let simulation, index = 0, timer = null;
    function range(key, label, min, max, step, value) {
      const wrapper = document.createElement("label"), output = document.createElement("output"), input = document.createElement("input");
      wrapper.append(document.createTextNode(label + " "), output, input);
      input.type = "range"; input.min = min; input.max = max; input.step = step; input.value = value;
      input.setAttribute("aria-label", label); output.textContent = value; parameters[key] = value;
      input.addEventListener("input", () => { output.textContent = input.value; parameters[key] = Number(input.value); restart(); });
      parameterBox.append(wrapper);
    }
    if (!noGamma.has(name)) range("gamma", "折扣率 γ", 0.1, 0.95, 0.05, 0.9);
    if (rateKinds.has(name)) range("alpha", name === "actor-critic" ? "critic 步长 αw" : "步长 α", 0.01, 0.2, 0.01, name === "approximation" ? 0.03 : name === "stochastic" ? 0.2 : name === "dqn-target" ? 0.2 : 0.1);
    if (name === "epsilon" || name === "ppo") range("epsilon", name === "epsilon" ? "探索概率 ε" : "裁剪系数 εclip", name === "epsilon" ? 0 : 0.05, name === "epsilon" ? 1 : 0.5, 0.05, 0.2);
    if (name === "contraction") range("coefficient", "收缩系数 c", 0.1, 0.95, 0.05, 0.5);
    if (name === "importance") range("beta", "行为分布 p₁(+1)", 0.1, 0.9, 0.1, 0.8);
    if (name === "gspo") range("ratio", "token 2 的比率", 0.2, 1.8, 0.1, 0.5);
    if (modes[name]) {
      const label = document.createElement("label"), select = document.createElement("select");
      label.append(document.createTextNode("对照设置 "), select); select.setAttribute("aria-label", "对照设置");
      modes[name].forEach(([value, text]) => { const option = document.createElement("option"); option.value = value; option.textContent = text; select.append(option); });
      parameters.mode = select.value;
      select.addEventListener("change", () => { parameters.mode = select.value; restart(); }); parameterBox.append(label);
    }
    const play = root.querySelector('[data-action="play"]'), step = root.querySelector('[data-action="step"]');
    const progress = root.querySelector(".demo-progress"), note = root.querySelector(".demo-note");
    function stop() { clearInterval(timer); timer = null; play.textContent = "播放"; play.setAttribute("aria-pressed", "false"); note.setAttribute("aria-live", "polite"); }
    function advance() { if (index < simulation.frames.length - 1) { index++; draw(); } else stop(); }
    play.addEventListener("click", () => {
      if (timer) return stop();
      if (index === simulation.frames.length - 1) index = 0;
      play.textContent = "暂停"; play.setAttribute("aria-pressed", "true"); note.setAttribute("aria-live", "off");
      advance(); timer = setInterval(advance, 450);
    });
    step.addEventListener("click", () => { stop(); advance(); });
    root.querySelector('[data-action="reset"]').addEventListener("click", () => { stop(); index = 0; draw(); });
    progress.addEventListener("input", () => { stop(); index = Number(progress.value); draw(); });
    const visual = root.querySelector(".demo-visual");
    function restart() {
      stop(); index = 0;
      simulation = window.RLSimulations.make(name, parameters);
      progress.max = simulation.frames.length - 1;
      root.querySelector(".demo-caption").textContent = simulation.caption;
      const legend = root.querySelector(".demo-legend"); legend.replaceChildren();
      simulation.series.forEach((item, i) => { const li = document.createElement("li"); li.style.setProperty("--series-color", `var(--rl-series-${i + 1})`); li.textContent = item.label; legend.append(li); });
      draw();
    }
    function draw() {
      const frame = simulation.frames[index];
      note.textContent = frame.note;
      root.querySelector(".demo-step").textContent = `${index} / ${simulation.frames.length - 1}`;
      progress.value = index; step.disabled = index === simulation.frames.length - 1;
      let svg = visual.querySelector("svg");
      if (!svg || simulation.view !== svg.dataset.view) {
        svg = svgElement("svg", { viewBox: "0 0 640 300", role: "img", "aria-label": titles[name] });
        svg.dataset.view = simulation.view; visual.replaceChildren(svg);
      }
      if (simulation.view === "grid") drawGrid(svg, frame);
      else if (simulation.view === "bars") drawBars(svg, frame);
      else drawLine(svg);
    }
    function drawGrid(svg, frame) {
      if (!svg.querySelector(".grid-cell")) {
        svg.replaceChildren();
        for (let i = 0; i < 9; i++) {
          const x = 135 + (i % 3) * 90, y = 12 + Math.floor(i / 3) * 90;
          svg.append(svgElement("rect", { x, y, width: 84, height: 84, rx: 5, class: `grid-cell${i === 5 || i === 6 ? " forbidden" : i === 8 ? " target" : ""}` }));
          svg.append(svgElement("text", { x: x + 10, y: y + 21, class: "grid-state" }, `s${i + 1}${i === 5 || i === 6 ? " 禁区" : i === 8 ? " 目标" : ""}`));
          svg.append(svgElement("text", { x: x + 42, y: y + 57, "text-anchor": "middle", class: "grid-value", "data-state": i }));
        }
        svg.append(svgElement("circle", { cx: 0, cy: 0, r: 9, class: "grid-agent" }));
      }
      svg.querySelectorAll(".grid-value").forEach((element, i) => { element.textContent = name === "trajectory" ? "" : numeric(frame.values[i]); });
      const agent = svg.querySelector(".grid-agent"); agent.style.display = frame.state ? "" : "none";
      if (frame.state) agent.style.transform = `translate(${204 + ((frame.state - 1) % 3) * 90}px, ${78 + Math.floor((frame.state - 1) / 3) * 90}px)`;
    }
    function axes(svg, low, high) {
      svg.append(svgElement("line", { x1: 55, x2: 615, y1: 250, y2: 250, class: "plot-axis" }));
      for (let tick = 0; tick <= 4; tick++) {
        const y = 250 - tick * 52, value = low + (high - low) * tick / 4;
        svg.append(svgElement("line", { x1: 55, x2: 615, y1: y, y2: y, class: "plot-grid" }));
        svg.append(svgElement("text", { x: 47, y: y + 4, "text-anchor": "end", class: "plot-tick" }, Math.abs(value) < 0.005 ? "0" : value.toFixed(2)));
      }
    }
    function bounds(values) {
      const low = Math.min(0, ...values), high = Math.max(...values, low + 0.1), padding = (high - low) * 0.1;
      return [low - (low < 0 ? padding : 0), high + padding];
    }
    function drawBars(svg, frame) {
      svg.replaceChildren();
      const all = simulation.frames.flatMap(f => simulation.series.flatMap(s => f[s.key] || []));
      const [low, high] = bounds(all), y = value => 250 - 208 * (value - low) / (high - low);
      axes(svg, low, high);
      const band = 560 / simulation.labels.length, width = Math.min(34, band / (simulation.series.length + 1));
      simulation.labels.forEach((label, j) => {
        const center = 55 + band * (j + 0.5);
        svg.append(svgElement("text", { x: center, y: 273, "text-anchor": "middle", class: "plot-tick" }, label));
        simulation.series.forEach((series, i) => {
          const value = frame[series.key]?.[j] ?? 0, top = Math.min(y(value), y(0));
          svg.append(svgElement("rect", { x: center + (i - simulation.series.length / 2) * width, y: top, width: width - 3,
            height: Math.max(0.5, Math.abs(y(value) - y(0))), fill: `var(--rl-series-${i + 1})`, opacity: frame.active === j ? 1 : 0.75 }));
        });
      });
    }
    function drawLine(svg) {
      svg.replaceChildren();
      const all = simulation.frames.flatMap(f => simulation.series.map(s => f[s.key]).filter(Number.isFinite));
      const [low, high] = bounds(all), y = value => 250 - 208 * (value - low) / (high - low);
      const firstX = simulation.frames[0].x ?? simulation.frames[0].step;
      const lastX = simulation.frames.at(-1).x ?? simulation.frames.at(-1).step;
      const x = value => 55 + 560 * (value - firstX) / (lastX - firstX || 1);
      axes(svg, low, high);
      for (let tick = 0; tick <= 4; tick++) {
        const value = firstX + (lastX - firstX) * tick / 4;
        svg.append(svgElement("text", { x: 55 + tick * 140, y: 271, "text-anchor": "middle", class: "plot-tick" }, simulation.frames[0].x === undefined ? Math.round(value) : value.toFixed(2)));
      }
      svg.append(svgElement("text", { x: 335, y: 295, "text-anchor": "middle", class: "plot-tick" }, simulation.xLabel));
      simulation.series.forEach((series, i) => {
        const visible = simulation.frames.slice(0, index + 1).filter(f => Number.isFinite(f[series.key]));
        const path = visible.map((f, j) => `${j ? "L" : "M"}${x(f.x ?? f.step)},${y(f[series.key])}`).join(" ");
        svg.append(svgElement("path", { d: path, fill: "none", stroke: `var(--rl-series-${i + 1})`, "stroke-width": 2, "stroke-dasharray": i > 1 ? "5 3" : "none" }));
        const f = visible.at(-1);
        if (f) svg.append(svgElement("circle", { cx: x(f.x ?? f.step), cy: y(f[series.key]), r: 3, fill: `var(--rl-series-${i + 1})` }));
      });
    }
    restart();
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  }
  function mount() { document.querySelectorAll("[data-rl-demo]").forEach(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
