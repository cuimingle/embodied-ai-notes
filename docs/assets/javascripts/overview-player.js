(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function mount(root) {
    const scene = globalThis.overviewScenes?.[root.dataset.overviewScene];
    if (!scene || root.dataset.overviewReady === "true") return;

    root.innerHTML = `
      <div class="ov-heading">
        <strong class="ov-title"></strong>
        <label class="ov-mode">情形 <select></select></label>
      </div>
      <svg class="ov-frame" viewBox="0 0 600 260" aria-hidden="true" focusable="false"></svg>
      <div class="ov-status" role="status" aria-live="polite" aria-atomic="true">
        <span class="ov-progress"></span>
        <span class="ov-caption"></span>
      </div>
      <div class="ov-controls">
        <button type="button" data-action="play">播放</button>
        <button type="button" data-action="step">单步</button>
        <button type="button" data-action="reset">重置</button>
        <span class="ov-motion-note">已启用减少动态效果，可单步查看。</span>
      </div>`;

    root.setAttribute("role", "group");
    root.setAttribute("aria-label", scene.label);
    root.querySelector(".ov-title").textContent = scene.label;
    const mode = root.querySelector("select");
    scene.options.forEach((label, index) => mode.add(new Option(label, String(index))));
    const frame = root.querySelector(".ov-frame");
    const status = root.querySelector(".ov-status");
    const caption = root.querySelector(".ov-caption");
    const progress = root.querySelector(".ov-progress");
    const play = root.querySelector('[data-action="play"]');
    const next = root.querySelector('[data-action="step"]');
    let step = 0;
    let timer = null;

    function draw() {
      const state = scene.render(step, mode.selectedIndex);
      frame.innerHTML = state.svg;
      progress.textContent = `第 ${step} / ${scene.steps} 步`;
      caption.textContent = state.caption;
      next.disabled = step === scene.steps;
      play.textContent = timer !== null ? "暂停" : step === scene.steps ? "重新播放" : "播放";
    }

    function pause() {
      clearInterval(timer);
      timer = null;
      status.setAttribute("aria-live", "polite");
    }

    function reset() {
      pause();
      step = 0;
      draw();
    }

    play.addEventListener("click", () => {
      if (timer !== null || reducedMotion.matches) {
        pause();
        draw();
        return;
      }
      if (step === scene.steps) step = 0;
      status.setAttribute("aria-live", "off");
      timer = setInterval(() => {
        if (!root.isConnected || document.hidden || reducedMotion.matches) {
          pause();
        } else {
          step++;
          if (step === scene.steps) pause();
        }
        draw();
      }, Math.max(150, Math.min(1800, 16000 / scene.steps)));
      draw();
    });
    next.addEventListener("click", () => {
      pause();
      if (step < scene.steps) step++;
      draw();
    });
    root.querySelector('[data-action="reset"]').addEventListener("click", reset);
    mode.addEventListener("change", reset);
    draw();
    root.dataset.overviewReady = "true";
  }

  function mountAll() {
    document.querySelectorAll(".overview-demo[data-overview-scene]").forEach(mount);
  }

  globalThis.overviewPlayer = { mountAll };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll, { once: true });
  } else {
    mountAll();
  }
})();
