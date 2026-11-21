/* Deterministic task-level feedback, vertical friction, and planar pushing models. */
(function () {
  "use strict";

  const ink = "var(--ov-ink)";
  const muted = "var(--ov-muted)";
  const accent = "var(--ov-accent)";
  const warm = "var(--ov-warm)";
  const line = "var(--ov-line)";
  const panel = "var(--ov-panel)";
  const background = "var(--ov-bg)";
  const steps = 24;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const progress = (step, start, end) => clamp((step - start) / (end - start), 0, 1);

  function label(x, y, value, color = ink, anchor = "start", bold = false) {
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="18" font-weight="${bold ? 650 : 450}">${value}</text>`;
  }

  function frame(x, width) {
    return `<rect x="${x}" y="8" width="${width}" height="244" rx="14" fill="${panel}" stroke="${line}"/>`;
  }

  function gripper(x, tipY, halfGap, color) {
    return `<g transform="translate(${x} ${tipY})" stroke-linejoin="round">
      <path d="M 0 -54 V -38" stroke="${ink}" stroke-width="7"/>
      <path d="M ${-halfGap-3} -20 V -35 H ${halfGap+3} V -20" fill="none" stroke="${ink}" stroke-width="5"/>
      <path d="M ${-halfGap} -21 V 0 M ${halfGap} -21 V 0" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
    </g>`;
  }

  function feedback(step, mode) {
    const displacement = mode === 1 ? -3 : 3;
    const cupX = 12 + displacement * progress(step, 5, 7);
    const correctedX = 12 + (cupX - 12) * progress(step, 8, 14);
    const lower = progress(step, 0, 5) * 14 + progress(step, 14, 16) * 10;
    const lift = 43 * progress(step, 18, steps);
    const gap = 20 - 6 * progress(step, 16, 18);
    const draw = (origin, title, handX) => {
      const error = Math.abs(cupX - handX);
      const touching = step >= 18 && error <= 0.7;
      const center = origin + 142;
      const toScreen = position => center + (position - 12) * 11.5;
      const cupBottom = 187 - (touching ? lift : 0);
      const hand = toScreen(handX);
      const cup = toScreen(cupX);
      const state = step < 18 ? `横向误差 ${error.toFixed(1)} cm` : touching ? "已抓住 · 随爪抬起" : "未抓住 · 留在桌面";
      return frame(origin, 282) + label(origin + 17, 38, title, ink, "start", true) +
        `<path d="M ${origin+18} 188 H ${origin+264}" stroke="${line}" stroke-width="3"/>
         <path d="M ${center} 59 V 187" stroke="${muted}" stroke-width="1.5" stroke-dasharray="4 6" opacity=".55"/>
         <g transform="translate(${cup} ${cupBottom})">
           <path d="M -13 -30 H 13 L 10 0 H -10 Z" fill="${background}" stroke="${warm}" stroke-width="3"/>
           <path d="M 13 -23 C 25 -27 24 -9 12 -10" fill="none" stroke="${warm}" stroke-width="3"/>
         </g>` + gripper(hand, 148 + lower - lift, gap, accent) +
        label(center, 227, state, step >= 18 && !touching ? warm : ink, "middle");
    };
    const phase = step < 5 ? "夹爪向初始杯位靠近" : step < 8 ? "杯子滑动，原定抓点仍在虚线处" :
      step < 15 ? "再次观测后，右侧夹爪横向对准" : step < 18 ? "夹爪闭合前检查对准情况" : "两条轨迹执行相同的抬升命令";
    return {
      svg: draw(10, "预设抓取轨迹", 12) + draw(308, "按新观测修正", correctedX),
      caption: `${phase}。杯中心 ${cupX.toFixed(1)} cm，左、右抓点误差分别为 ${Math.abs(cupX-12).toFixed(1)} 和 ${Math.abs(cupX-correctedX).toFixed(1)} cm。此例的对准容差为 0.7 cm。`
    };
  }

  function grasp(step, mode) {
    const normalForce = mode === 1 ? 3.2 : 4.0;
    const mass = 0.2;
    const gravity = 9.81;
    const frictionLimit = 2 * 0.30 * normalForce;
    const startHeight = 0.09;
    const dt = 0.05;
    const liftHeight = 0.06;
    const duration = steps * dt;
    const handHeight = time => startHeight + 0.5 * liftHeight * (1 - Math.cos(Math.PI * time / duration));
    const time = step * dt;
    const hand = handHeight(time);
    // The smooth lift bounds the force needed for sticking over the full motion.
    const maxAcceleration = 0.5 * liftHeight * (Math.PI / duration) ** 2;
    const sticks = frictionLimit >= mass * (gravity + maxAcceleration);
    let block = startHeight;
    let velocity = 0;
    let inContact = true;
    if (sticks) {
      block = hand;
    } else {
      // Once the pads no longer overlap the block, the contact force vanishes.
      const substeps = 10;
      const delta = dt / substeps;
      for (let i = 1; i <= step * substeps; i++) {
        const acceleration = (inContact ? frictionLimit / mass : 0) - gravity;
        block = Math.max(0, block + velocity * delta + 0.5 * acceleration * delta ** 2);
        velocity = block === 0 ? 0 : velocity + acceleration * delta;
        if (handHeight(i * delta) - block >= 0.025) inContact = false;
      }
    }
    const floorY = 219;
    const scale = 780;
    const blockBottom = floorY - block * scale;
    const tip = floorY - hand * scale - 7;
    const forceWidth = force => 82 * force;
    const weight = mass * gravity;
    const state = step === 0 ? "移开初始支撑" : sticks ? "物块随夹爪上升" :
      block === 0 ? "物块已落地" : inContact ? "物块沿指面下滑" : "物块脱离夹爪";
    const x = 155;
    return {
      svg: frame(10, 288) + frame(309, 281) + label(28, 38, "竖直抬升", ink, "start", true) +
        `<path d="M 31 ${floorY} H 276" stroke="${line}" stroke-width="3"/>
         <path d="M 61 ${floorY - startHeight * scale} H 259" stroke="${muted}" opacity=".55" stroke-dasharray="4 6"/>
         <rect x="${x-17}" y="${blockBottom-26}" width="34" height="26" rx="4" fill="${background}" stroke="${warm}" stroke-width="3"/>` +
        gripper(x, tip, 19, accent) +
        label(154, 242, state, ink, "middle") + label(326, 40, "摩擦与重量", ink, "start", true) +
        label(326, 81, `摩擦上限 ${frictionLimit.toFixed(2)} N`, accent) +
        `<rect x="326" y="92" width="${forceWidth(frictionLimit)}" height="10" rx="5" fill="${accent}"/>` +
        label(326, 138, `物块重量 ${weight.toFixed(2)} N`, warm) +
        `<rect x="326" y="149" width="${forceWidth(weight)}" height="10" rx="5" fill="${warm}"/>` +
        label(326, 201, `离地 ${(block * 100).toFixed(1)} cm`) + label(326, 231, `时间 ${time.toFixed(2)} s`, muted),
      caption: `${state}。每指法向力 ${normalForce.toFixed(1)} N，两侧摩擦系数均为 0.30，物块质量 0.20 kg。夹爪距初始位置上升 ${((hand-startHeight)*100).toFixed(1)} cm，物块底面离地 ${(block*100).toFixed(1)} cm。`
    };
  }

  function manipulation(step, mode) {
    const angle = (mode === 1 ? 18 : 0) * Math.PI / 180;
    const distance = 15 * progress(step, 5, 21);
    const blockX = distance * Math.cos(angle);
    const blockY = distance * Math.sin(angle);
    const goalX = 15;
    const blockHalf = 2;
    const goalHalf = 4;
    const margin = goalHalf - blockHalf - Math.max(Math.abs(goalX - blockX), Math.abs(blockY));
    const fits = margin >= -1e-9;
    const scale = 12;
    const startX = 115;
    const startY = 149;
    const x = startX + blockX * scale;
    const y = startY - blockY * scale;
    const gap = 29 * (1 - progress(step, 0, 5)) + 22 * progress(step, 21, steps);
    const radius = 11;
    const pushX = x - blockHalf * scale - radius - gap;
    const pushY = y + (blockHalf * scale + radius + gap) * Math.tan(angle);
    const goal = startX + goalX * scale;
    const state = step < 5 ? "推杆接近" : step < 21 ? "沿设定方向推移" : "撤回推杆";
    return {
      svg: frame(10, 379) + frame(400, 190) + label(29, 38, "俯视 · 平面推移", ink, "start", true) +
        `<rect x="${goal-goalHalf*scale}" y="${startY-goalHalf*scale}" width="${2*goalHalf*scale}" height="${2*goalHalf*scale}" rx="3" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="8 5"/>
         <path d="M ${startX} ${startY} H ${goal}" stroke="${muted}" opacity=".65" stroke-dasharray="3 6"/>
         <path d="M ${startX} ${startY} L ${x} ${y}" stroke="${warm}" stroke-width="3"/>
         <rect x="${x-blockHalf*scale}" y="${y-blockHalf*scale}" width="${2*blockHalf*scale}" height="${2*blockHalf*scale}" rx="3" fill="${background}" stroke="${warm}" stroke-width="3"/>
         <circle cx="${x}" cy="${y}" r="3" fill="${warm}"/>
         <path d="M ${pushX-25} ${pushY+25*Math.tan(angle)} L ${pushX} ${pushY}" stroke="${ink}" stroke-width="6" stroke-linecap="round"/>
         <circle cx="${pushX}" cy="${pushY}" r="${radius}" fill="${panel}" stroke="${ink}" stroke-width="3"/>` +
        label(goal, 230, "目标区", accent, "middle") + label(415, 41, "整块入区？", ink, "start", true) +
        label(415, 82, fits ? "已完整进入" : "尚未完整进入", fits ? accent : warm) +
        label(415, 129, `推移 ${distance.toFixed(1)} cm`) +
        label(415, 160, `侧偏 ${blockY.toFixed(1)} cm`) +
        label(415, 214, `方向 ${mode === 1 ? 18 : 0}°`, muted),
      caption: `${state}。方块边长 4 cm，目标区边长 8 cm。方块中心从起点向前 ${blockX.toFixed(1)} cm，向侧面 ${blockY.toFixed(1)} cm。${fits ? "四个角均已入区。" : "仍有部分位于目标区外。"}`
    };
  }

  globalThis.overviewScenes ??= {};
  Object.assign(globalThis.overviewScenes, {
    feedback: { label: "抓偏后修正", options: ["杯子右移", "杯子左移"], steps, render: feedback },
    grasp: { label: "摩擦与抬升", options: ["每指 4.0 N", "每指 3.2 N"], steps, render: grasp },
    manipulation: { label: "推方块入区", options: ["正向推移", "偏转 18°"], steps, render: manipulation }
  });
})();
