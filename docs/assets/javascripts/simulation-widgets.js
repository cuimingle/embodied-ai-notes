/* Numerical oscillator comparison and accessible, local-only playback. */
(function (global) {
  "use strict";

  function simulate(options = {}) {
    const config = Object.assign({ mass: 1, stiffness: 1, x0: 1, v0: 0, dt: 0.05, steps: 400 }, options);
    const { mass, stiffness, x0, v0, dt, steps } = config;
    if (![mass, stiffness, dt].every(value => Number.isFinite(value) && value > 0) ||
        ![x0, v0].every(Number.isFinite) || !Number.isInteger(steps) || steps < 1 || steps > 20000) {
      throw new RangeError("Use finite parameters, positive mass/stiffness/dt, and 1–20000 integer steps.");
    }
    const omega = Math.sqrt(stiffness / mass);
    const trajectories = {};
    for (const method of ["euler", "semi_implicit"]) {
      let x = x0, v = v0;
      const frames = [];
      for (let index = 0; index <= steps; index++) {
        const time = index * dt;
        const exactX = x0 * Math.cos(omega * time) + v0 * Math.sin(omega * time) / omega;
        const exactV = -x0 * omega * Math.sin(omega * time) + v0 * Math.cos(omega * time);
        const energy = (mass * v * v + stiffness * x * x) / 2;
        if (![x, v, energy, exactX, exactV].every(Number.isFinite)) {
          throw new RangeError("The numerical trajectory overflowed; reduce the time step or duration.");
        }
        frames.push({ time, x, v, exact_x: exactX, exact_v: exactV, energy });
        if (index === steps) break;
        const acceleration = -stiffness * x / mass;
        if (method === "euler") {
          x += dt * v;
          v += dt * acceleration;
        } else {
          v += dt * acceleration;
          x += dt * v;
        }
      }
      trajectories[method] = frames;
    }
    return { config, trajectories };
  }

  const api = { simulate };
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;
  global.SimulationWidgets = api;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const series = [
    { key: "exact", label: "解析解", className: "sim-exact" },
    { key: "euler", label: "显式 Euler", className: "sim-euler" },
    { key: "semi_implicit", label: "半隐式 Euler", className: "sim-semi" }
  ];
  const number = value => Math.abs(value) < 0.00005 ? "0.0000" : value.toFixed(4);
  let widgetCount = 0;

  function svgNode(tag, attributes, text) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function mount(root) {
    if (root.dataset.ready || root.dataset.simulationWidget !== "oscillator") return;
    root.dataset.ready = "true";
    const id = `simulation-oscillator-${++widgetCount}`;
    root.innerHTML = `
      <div class="sim-heading"><span class="sim-eyebrow">NUMERICAL LAB / 01</span>
        <h3 id="${id}-title">同一个振子，不同的时间步</h3>
        <p>质量 1 kg · 刚度 1 N/m · 初始位移 1 m · 初速度 0 m/s</p></div>
      <div class="sim-parameters">
        <label>物理步长 Δt <select data-parameter="dt" aria-label="物理步长">
          <option value="0.02">0.02 s</option><option value="0.05" selected>0.05 s</option>
          <option value="0.1">0.10 s</option><option value="0.2">0.20 s</option></select></label>
        <label>查看 <select data-parameter="view" aria-label="查看物理量">
          <option value="position">位移 x / m</option><option value="energy">机械能 E / J</option></select></label>
        <span class="sim-duration">每组均模拟 20 s</span>
      </div>
      <div class="sim-chart"></div>
      <ul class="sim-legend" aria-label="曲线图例"></ul>
      <div class="sim-readings"></div>
      <div class="sim-controls">
        <button type="button" data-action="play" aria-pressed="false">播放</button>
        <button type="button" data-action="step">单步</button>
        <button type="button" data-action="reset">重置</button>
        <output class="sim-counter" aria-label="当前时间和步数"></output>
      </div>
      <label class="sim-progress-label">计算进度
        <input type="range" class="sim-progress" min="0" value="0" step="1" aria-label="计算进度">
      </label>
      <p class="sim-status" role="status" aria-live="polite"></p>
      <p class="sim-footnote">曲线由当前参数实际计算。改变步长会重新计算；重置保留参数。半隐式 Euler 的能量也有误差，稳定性取决于步长。</p>`;
    root.setAttribute("aria-labelledby", `${id}-title`);
    root.setAttribute("role", "region");

    const chart = root.querySelector(".sim-chart");
    const legend = root.querySelector(".sim-legend");
    const readings = root.querySelector(".sim-readings");
    const play = root.querySelector('[data-action="play"]');
    const step = root.querySelector('[data-action="step"]');
    const progress = root.querySelector(".sim-progress");
    const dtInput = root.querySelector('[data-parameter="dt"]');
    const viewInput = root.querySelector('[data-parameter="view"]');
    const status = root.querySelector(".sim-status");
    const reducedMotion = global.matchMedia ? global.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
    const cardValues = {};
    let result, index = 0, timer = null, paths = [], markers = [], xScale, yScale, svg;

    for (const item of series) {
      const label = document.createElement("li");
      label.className = item.className;
      label.textContent = item.label;
      legend.append(label);
      const card = document.createElement("div");
      card.className = `sim-reading ${item.className}`;
      card.innerHTML = '<strong></strong><dl><div><dt>位移 / m</dt><dd data-value="position"></dd></div><div><dt>能量 / J</dt><dd data-value="energy"></dd></div><div><dt>位移绝对误差 / m</dt><dd data-value="error"></dd></div></dl>';
      card.querySelector("strong").textContent = item.label;
      cardValues[item.key] = Object.fromEntries([...card.querySelectorAll("[data-value]")].map(node => [node.dataset.value, node]));
      readings.append(card);
    }

    function stop() {
      if (timer !== null) global.clearInterval(timer);
      timer = null;
      play.textContent = "播放";
      play.setAttribute("aria-pressed", "false");
      status.setAttribute("aria-live", "polite");
    }

    function frameValue(key, frameIndex) {
      const frame = result.trajectories[key === "exact" ? "euler" : key][frameIndex];
      if (viewInput.value === "energy") return key === "exact" ? 0.5 : frame.energy;
      return key === "exact" ? frame.exact_x : frame.x;
    }

    function buildChart() {
      svg = svgNode("svg", { viewBox: "0 0 600 300", role: "img" });
      const viewName = viewInput.value === "energy" ? "机械能 E / J" : "位移 x / m";
      svg.append(svgNode("title", {}, `${viewName}随时间变化；曲线数值见下方读数。`));
      const values = result.trajectories.euler.flatMap((frame, frameIndex) => series.map(item => frameValue(item.key, frameIndex)));
      let low = Math.min(0, ...values), high = Math.max(0, ...values);
      const margin = Math.max(0.05, (high - low) * 0.08);
      low = viewInput.value === "energy" ? 0 : low - margin;
      high += margin;
      xScale = time => 56 + time / 20 * 520;
      yScale = value => 250 - (value - low) / (high - low) * 210;
      svg.append(svgNode("text", { x: 56, y: 22, class: "sim-axis-label" }, viewName));
      for (let tick = 0; tick <= 4; tick++) {
        const value = low + tick / 4 * (high - low), y = yScale(value);
        svg.append(svgNode("line", { x1: 56, x2: 576, y1: y, y2: y, class: "sim-grid-line" }));
        svg.append(svgNode("text", { x: 49, y: y + 5, "text-anchor": "end", class: "sim-tick" }, value.toFixed(1)));
        svg.append(svgNode("text", { x: xScale(tick * 5), y: 273, "text-anchor": "middle", class: "sim-tick" }, tick * 5));
      }
      svg.append(svgNode("text", { x: 316, y: 295, "text-anchor": "middle", class: "sim-axis-label" }, "仿真时间 t / s"));
      paths = []; markers = [];
      for (const item of series) {
        const path = svgNode("path", { class: `sim-line ${item.className}`, fill: "none" });
        const marker = svgNode("circle", { r: 3.5, class: `sim-marker ${item.className}` });
        svg.append(path, marker); paths.push(path); markers.push(marker);
      }
      chart.replaceChildren(svg);
    }

    function draw(announce = false) {
      const current = result.trajectories.euler[index];
      series.forEach((item, seriesIndex) => {
        const samples = result.trajectories[item.key === "exact" ? "euler" : item.key];
        const frame = samples[index];
        const points = samples.slice(0, index + 1).map((sample, frameIndex) => `${frameIndex ? "L" : "M"}${xScale(sample.time).toFixed(2)},${yScale(frameValue(item.key, frameIndex)).toFixed(2)}`);
        paths[seriesIndex].setAttribute("d", points.join(" "));
        markers[seriesIndex].setAttribute("cx", xScale(current.time));
        markers[seriesIndex].setAttribute("cy", yScale(frameValue(item.key, index)));
        const position = item.key === "exact" ? frame.exact_x : frame.x;
        cardValues[item.key].position.textContent = number(position);
        cardValues[item.key].energy.textContent = number(item.key === "exact" ? 0.5 : frame.energy);
        cardValues[item.key].error.textContent = number(Math.abs(position - frame.exact_x));
      });
      progress.value = index;
      progress.setAttribute("aria-valuetext", `${current.time.toFixed(2)} 秒，第 ${index} 步，共 ${result.config.steps} 步`);
      root.querySelector(".sim-counter").textContent = `t = ${current.time.toFixed(2)} s · ${index} / ${result.config.steps} 步`;
      step.disabled = index === result.config.steps;
      if (announce) {
        status.textContent = reducedMotion.matches
          ? `已启用减少动态效果；可用单步和进度条查看。当前 ${current.time.toFixed(2)} s。`
          : `当前 ${current.time.toFixed(2)} s。拖动进度可查看已有计算；播放速度仅影响展示。`;
      }
    }

    function recompute() {
      stop(); index = 0;
      const dt = Number(dtInput.value);
      result = simulate({ dt, steps: Math.round(20 / dt) });
      progress.max = result.config.steps;
      buildChart(); draw(true);
    }

    play.addEventListener("click", () => {
      if (timer !== null) { stop(); draw(true); return; }
      if (reducedMotion.matches) return;
      if (index === result.config.steps) index = 0;
      play.textContent = "暂停";
      play.setAttribute("aria-pressed", "true");
      status.setAttribute("aria-live", "off");
      status.textContent = "正在逐帧展示数值计算；可随时暂停、单步或拖动进度。";
      timer = global.setInterval(() => {
        index = Math.min(index + 1, result.config.steps);
        draw();
        if (index === result.config.steps) { stop(); draw(true); }
      }, 50);
    });
    step.addEventListener("click", () => { stop(); index = Math.min(index + 1, result.config.steps); draw(true); });
    root.querySelector('[data-action="reset"]').addEventListener("click", () => { stop(); index = 0; draw(true); });
    progress.addEventListener("input", () => { stop(); index = Number(progress.value); draw(true); });
    dtInput.addEventListener("change", recompute);
    viewInput.addEventListener("change", () => { stop(); buildChart(); draw(true); });
    function syncMotionPreference() {
      stop(); play.disabled = reducedMotion.matches;
      if (result) draw(true);
    }
    if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", syncMotionPreference);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
    recompute(); syncMotionPreference();
  }

  function mountAll() { document.querySelectorAll("[data-simulation-widget]").forEach(mount); }
  api.mountAll = mountAll;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountAll);
  else mountAll();
})(typeof globalThis === "object" ? globalThis : this);
