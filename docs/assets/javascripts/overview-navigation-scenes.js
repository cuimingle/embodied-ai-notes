/* Deterministic teaching models for support, grid navigation, and feedback. */
(() => {
  const ink = "var(--ov-ink)";
  const muted = "var(--ov-muted)";
  const accent = "var(--ov-accent)";
  const warm = "var(--ov-warm)";
  const background = "var(--ov-bg)";
  const line = "var(--ov-line)";

  function label(x, y, value, color = ink, size = 19, anchor = "start") {
    return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${value}</text>`;
  }

  function supportFrame(step, mode) {
    const shift = (mode === 0 ? 4 : 10) * Math.min(step / 5, 1);
    // Both feet span +/-9 cm fore-aft. The left foot spans [-14,-6] cm laterally.
    const center = -shift;
    const margin = Math.min(center + 14, -6 - center, 9);
    const lift = step >= 6 && margin > 0;
    const stage = step < 6 ? "准备移重" : lift ? "单脚支撑" : "双脚保持着地";
    const rightFootY = lift ? 76 - 7 * (step - 5) : 76;
    const projectedX = 174 + 7 * center;
    const region = lift
      ? `<rect x="76" y="76" width="56" height="108" fill="${accent}" opacity=".2"/>`
      : `<rect x="76" y="76" width="196" height="108" fill="${accent}" opacity=".15"/>`;
    const svg = [
      label(174, 33, "双足俯视图", ink, 21, "middle"),
      region,
      `<rect x="76" y="76" width="${lift ? 56 : 196}" height="108" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="5 4"/>`,
      `<rect x="76" y="76" width="56" height="108" fill="none" stroke="${accent}" stroke-width="4"/>`,
      `<rect x="216" y="${rightFootY}" width="56" height="108" fill="none" stroke="${lift ? muted : ink}" stroke-width="3" ${lift ? 'stroke-dasharray="6 5"' : ""}/>`,
      `<line x1="174" y1="52" x2="174" y2="203" stroke="${line}" stroke-width="2" stroke-dasharray="4 5"/>`,
      `<circle cx="${projectedX}" cy="130" r="10" fill="${warm}" stroke="${ink}" stroke-width="2"/>`,
      label(104, 220, "左脚", ink, 19, "middle"),
      label(244, 220, "右脚", ink, 19, "middle"),
      label(327, 70, stage, ink, 22),
      label(327, 111, "圆点为质心投影", muted, 19),
      label(327, 145, "浅色区域为支撑区", muted, 19),
      label(327, 191, `向左移重 ${shift.toFixed(1)} cm`),
      label(327, 223, `左脚余量 ${margin.toFixed(1)} cm`, margin > 0 ? accent : warm),
    ].join("");
    let result = "准备把重量移到左脚。";
    if (step > 0 && step < 6) result = "两脚着地，检查质心投影到左脚边缘的距离。";
    if (step >= 6) result = lift
      ? "投影落在左脚内，准静态模型允许抬起右脚。"
      : "投影仍在左脚外，模型保持双脚着地。";
    return { svg, caption: `左脚支撑余量 ${margin.toFixed(1)} cm。${result}` };
  }

  const columns = 8;
  const rows = 5;
  const start = 2 * columns;
  const goal = start + 7;
  const newObstacle = start + 3;
  const walls = new Set([9, 10, 11, 29, 37]);
  const directions = [[1, 0], [0, -1], [0, 1], [-1, 0]];

  function shortestPath(from, blocked) {
    const queue = [from];
    const parent = new Map([[from, null]]);
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      if (current === goal) {
        const path = [];
        for (let cell = goal; cell !== null; cell = parent.get(cell)) path.push(cell);
        return path.reverse();
      }
      for (const [dx, dy] of directions) {
        const x = current % columns + dx;
        const y = Math.floor(current / columns) + dy;
        if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
        const next = y * columns + x;
        if (blocked.has(next) || parent.has(next)) continue;
        parent.set(next, current);
        queue.push(next);
      }
    }
    return [from];
  }

  function gridPoint(cell) {
    return [39 + cell % columns * 39, 50 + Math.floor(cell / columns) * 39];
  }

  function routeLine(cells, color, dashed) {
    const points = cells.map(cell => gridPoint(cell).join(",")).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" ${dashed ? 'stroke-dasharray="6 6"' : ""}/>`;
  }

  function navigationFrame(step, mode) {
    const blocked = new Set(walls);
    let route = shortestPath(start, blocked);
    const travelled = [start];
    for (let tick = 1; tick <= step; tick++) {
      if (tick === 3) {
        blocked.add(newObstacle);
        if (mode === 1) route = shortestPath(route[0], blocked);
      } else if (route.length > 1 && !blocked.has(route[1])) {
        route = route.slice(1);
        travelled.push(route[0]);
      }
    }
    const state = route[0];
    const shapes = [];
    for (let cell = 0; cell < rows * columns; cell++) {
      const [x, y] = gridPoint(cell);
      const fill = walls.has(cell) ? muted : background;
      shapes.push(`<rect x="${x - 19.5}" y="${y - 19.5}" width="39" height="39" fill="${fill}" stroke="${line}" stroke-width="1.3"/>`);
    }
    shapes.push(routeLine(travelled, accent, false), routeLine(route, accent, true));
    if (step >= 3) {
      const [x, y] = gridPoint(newObstacle);
      shapes.push(`<rect x="${x - 16}" y="${y - 16}" width="32" height="32" rx="3" fill="${warm}"/>`,
        `<path d="M${x-8},${y-8}l16,16m0,-16l-16,16" fill="none" stroke="${ink}" stroke-width="3"/>`);
    }
    const [gx, gy] = gridPoint(goal);
    shapes.push(`<polygon points="${gx},${gy-16} ${gx+16},${gy} ${gx},${gy+16} ${gx-16},${gy}" fill="none" stroke="${ink}" stroke-width="3"/>`);
    const [rx, ry] = gridPoint(state);
    shapes.push(`<circle cx="${rx}" cy="${ry}" r="8" fill="${accent}" stroke="${ink}" stroke-width="2"/>`);
    const status = step < 3 ? "按初始路线行进" : state === goal ? "到达目标" : mode === 0 ? "原路线被堵" : "已规划绕行路线";
    shapes.push(label(360, 57, status, ink, 21),
      label(360, 102, "圆点 · 机器人"),
      label(360, 134, "菱形 · 目标"),
      label(360, 166, "虚线 · 计划路线"),
      label(360, 198, "方格 × · 新障碍", warm),
      label(360, 235, `已走 ${travelled.length - 1} 格`, muted));
    const message = step < 3 ? "初始最短路线长 7 格。" : mode === 0
      ? "旧路线下一格被占用，机器人停在障碍前。"
      : "四邻域广度优先搜索找到绕路，本次总路程为 9 格。";
    return { svg: shapes.join(""), caption: `${status}。已走 ${travelled.length - 1} 格。${message}` };
  }

  function targetPosition(tick) {
    if (tick <= 4) return 0;
    if (tick <= 16) return (tick - 4) * 0.5;
    if (tick <= 20) return 6;
    return Math.max(0, 6 - (tick - 20) * 0.5);
  }

  function timingFrame(step, mode) {
    const cameraPeriod = mode === 0 ? 5 : 10;
    const samples = [];
    let observed = 0;
    let command = 0;
    let actual = 0;
    for (let tick = 0; tick <= step; tick++) {
      // The old command drives the interval ending now; new samples apply next interval.
      if (tick > 0) actual += 0.45 * (command - actual);
      const target = targetPosition(tick);
      if (tick % cameraPeriod === 0) observed = target;
      if (tick % 2 === 0) command = observed;
      samples.push({ tick, target, observed, command, actual });
    }
    const last = samples[step];
    const x = tick => 48 + tick * 7.2;
    const y = value => 193 - value * 21;
    function series(key, color, dashed, held) {
      let path = `M${x(0)} ${y(samples[0][key])}`;
      for (const sample of samples.slice(1)) {
        path += held ? ` H${x(sample.tick)} V${y(sample[key])}` : ` L${x(sample.tick)} ${y(sample[key])}`;
      }
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3" ${dashed ? 'stroke-dasharray="7 4"' : ""}/><circle cx="${x(step)}" cy="${y(last[key])}" r="3" fill="${color}"/>`;
    }
    const parts = [label(28, 30, "位置（cm）", muted),
      `<path d="M48,55V193H336" fill="none" stroke="${muted}" stroke-width="2"/>`];
    for (const value of [0, 3, 6]) {
      parts.push(label(36, y(value) + 6, value, muted, 17, "end"),
        `<line x1="48" x2="336" y1="${y(value)}" y2="${y(value)}" stroke="${line}" stroke-width="1"/>`);
    }
    for (const tick of [0, 20, 40]) parts.push(label(x(tick), 221, `${tick / 20} s`, muted, 17, "middle"));
    parts.push(series("target", warm, true, false), series("command", ink, false, true), series("actual", accent, false, false));
    const cameraStatus = step % cameraPeriod === 0 ? "读到新帧" : "沿用旧帧";
    const policyStatus = step % 2 === 0 ? "更新指令" : "保持指令";
    parts.push(label(363, 39, `相机 ${mode === 0 ? 4 : 2} Hz · ${cameraStatus}`),
      label(363, 71, `策略 10 Hz · ${policyStatus}`),
      label(363, 102, "执行反馈 20 Hz", muted),
      label(363, 145, `标记实位 ${last.target.toFixed(2)} cm`, warm),
      label(363, 175, `目标指令 ${command.toFixed(2)} cm`),
      label(363, 205, `滑台实位 ${actual.toFixed(2)} cm`, accent));
    return {
      svg: parts.join(""),
      caption: `${(step / 20).toFixed(2)} s。相机${cameraStatus}，最近一次读数为 ${observed.toFixed(2)} cm。滑台距标记 ${Math.abs(last.target - actual).toFixed(2)} cm。`,
    };
  }

  globalThis.overviewScenes ??= {};
  Object.assign(globalThis.overviewScenes, {
    locomotion: { label: "移重与支撑", options: ["向左移 4 cm", "向左移 10 cm"], steps: 8, render: supportFrame },
    navigation: { label: "遇障绕行", options: ["保留原路线", "遇阻重规划"], steps: 10, render: navigationFrame },
    timing: { label: "控制频率", options: ["相机 4 Hz", "相机 2 Hz"], steps: 40, render: timingFrame },
  });
})();
