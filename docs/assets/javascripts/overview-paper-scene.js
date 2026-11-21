(() => {
  "use strict";

  const distance = 24;
  const obstacleRadius = 2.2;
  const fingertipRadius = 0.8;
  const scale = 17.5;
  const xScreen = x => 84 + scale * x;
  const yScreen = y => 135 - scale * y;
  const upper = x => 5 * Math.sin(Math.PI * x / distance);

  function points(height, last) {
    return Array.from({ length: last + 1 }, (_, x) =>
      `${xScreen(x)},${yScreen(height(x)).toFixed(2)}`).join(" ");
  }

  function render(step, mode) {
    const height = mode === 0 ? upper : () => 0;
    let reached = 0;
    let touching = false;
    for (let x = 1; x <= step; x++) {
      reached = x;
      if (Math.hypot(x - distance / 2, height(x)) <= obstacleRadius + fingertipRadius) {
        touching = true;
        break;
      }
    }
    const y = height(reached);
    const status = touching ? "与立柱接触，停止前进" :
      reached === distance ? "绕过立柱，到达终点" : "夹爪正在接近目标";
    const svg = `
      <rect x="12" y="8" width="576" height="244" rx="12" fill="var(--ov-panel)" stroke="var(--ov-line)"/>
      <g fill="none" stroke="var(--ov-muted)" stroke-width="2" stroke-dasharray="5 5">
        <polyline points="${points(upper, distance)}"/>
        <polyline points="${points(x => -upper(x), distance)}"/>
      </g>
      <circle cx="${xScreen(distance / 2)}" cy="135" r="${scale * obstacleRadius}" fill="var(--ov-bg)" stroke="var(--ov-warm)" stroke-width="3"/>
      <g font-size="18" text-anchor="middle" fill="var(--ov-ink)">
        <text x="${xScreen(distance / 2)}" y="141">立柱</text>
        <text x="${xScreen(0)}" y="177">起点</text>
        <text x="${xScreen(distance)}" y="177">终点</text>
      </g>
      <circle cx="${xScreen(distance)}" cy="135" r="10" fill="none" stroke="var(--ov-accent)" stroke-width="3"/>
      <polyline points="${points(height, reached)}" fill="none" stroke="var(--ov-accent)" stroke-width="4"/>
      <circle cx="${xScreen(reached)}" cy="${yScreen(y)}" r="${scale * fingertipRadius}" fill="var(--ov-accent)" stroke="var(--ov-ink)" stroke-width="2"/>
      <text x="300" y="33" text-anchor="middle" font-size="17" fill="var(--ov-muted)">俯视 · 虚线为两条示范轨迹</text>
      <text x="300" y="243" text-anchor="middle" font-size="17" fill="var(--ov-muted)">实心圆为夹爪，实线为实际走过的路</text>`;
    return { svg, caption: `夹爪横向前进 ${reached} cm，纵向偏移 ${y.toFixed(1)} cm。${status}。` };
  }

  globalThis.overviewScenes ??= {};
  globalThis.overviewScenes.trajectories = {
    label: "两条可行路线的平均",
    options: ["沿上方示范", "逐点平均两条示范"],
    steps: distance,
    render
  };
})();
