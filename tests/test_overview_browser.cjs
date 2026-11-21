const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const docs = path.join(__dirname, "..", "docs");
require("../docs/assets/javascripts/overview-hand-scenes.js");
require("../docs/assets/javascripts/overview-navigation-scenes.js");
require("../docs/assets/javascripts/overview-paper-scene.js");
const scenes = globalThis.overviewScenes;

// Read the numerical result exposed to the reader, independent of SVG coordinates.
function measurements(text, metric) {
  const pattern = new RegExp(metric + "\\s*(-?\\d+(?:\\.\\d+)?)", "g");
  const values = Array.from(text.matchAll(pattern), match => Number(match[1]));
  assert.ok(values.length, `Missing metric: ${metric}`);
  return values;
}

function reading(scene, step, mode, metric) {
  return measurements(scenes[scene].render(step, mode).svg, metric)[0];
}

test("each article mounts its teaching models and every frame supports repeatable seeking", () => {
  const expected = {
    concept: ["feedback"],
    tasks: ["grasp", "manipulation", "locomotion", "navigation"],
    stack: ["timing"],
    papers: ["trajectories"],
  };
  for (const [article, models] of Object.entries(expected)) {
    const markdown = fs.readFileSync(path.join(docs, "quick-overview", article + ".md"), "utf8");
    const embedded = Array.from(markdown.matchAll(/data-overview-scene=["']([^"']+)["']/g), match => match[1]);
    for (const id of models) assert.ok(embedded.includes(id), `${article} must include ${id}`);
    for (const id of embedded) {
      const scene = scenes[id];
      assert.ok(scene, `Unregistered scene: ${id}`);
      assert.ok(Number.isInteger(scene.steps) && scene.steps > 0, id);
      assert.equal(scene.options.length, 2, id);
      assert.notEqual(scene.options[0], scene.options[1], id);
      for (const mode of [0, 1]) {
        const frames = Array.from({ length: scene.steps + 1 }, (_, step) => scene.render(step, mode));
        assert.ok(frames[0].svg !== frames.at(-1).svg, `Static scene: ${id}`);
        for (let step = scene.steps; step >= 0; step--) {
          const frame = frames[step];
          const again = scene.render(step, mode);
          const name = `${id}, mode ${mode}, step ${step}`;
          assert.ok(typeof frame.caption === "string" && frame.caption.trim().length > 0, name);
          assert.ok(/<(?:path|rect|circle|line|polygon|polyline)\b/.test(frame.svg), name);
          assert.ok(!/\b(?:NaN|Infinity|undefined)\b/.test(frame.svg + frame.caption), name);
          assert.ok(again.svg === frame.svg && again.caption === frame.caption, name);
        }
      }
    }
  }
});

test("visual feedback corrects a three-centimeter disturbance in either direction", () => {
  for (const [mode, cupCenter] of [[0, 15], [1, 9]]) {
    const moved = scenes.feedback.render(7, mode);
    const corrected = scenes.feedback.render(14, mode);
    assert.deepEqual(measurements(moved.caption, "杯中心"), [cupCenter]);
    assert.deepEqual(measurements(moved.svg, "横向误差"), [3, 3]);
    assert.deepEqual(measurements(corrected.svg, "横向误差"), [3, 0]);
  }
});

test("the same lift holds or drops the block according to the contact force", () => {
  const end = scenes.grasp.steps;
  for (const [mode, normalForce] of [[0, 4], [1, 3.2]]) {
    assert.equal(reading("grasp", 0, mode, "离地"), 9);
    assert.equal(reading("grasp", end, mode, "摩擦上限"), 2 * 0.3 * normalForce);
    assert.equal(reading("grasp", end, mode, "物块重量"), 1.96);
  }
  assert.equal(reading("grasp", end, 0, "离地"), 15);
  assert.equal(reading("grasp", end, 1, "离地"), 0);
});

test("full containment of the pushed block depends on the lateral offset", () => {
  const end = scenes.manipulation.steps;
  const maxOffset = (8 - 4) / 2;
  for (const [mode, angle] of [[0, 0], [1, 18]]) {
    const offset = reading("manipulation", end, mode, "侧偏");
    assert.equal(reading("manipulation", end, mode, "推移"), 15);
    assert.ok(Math.abs(offset - 15 * Math.sin(angle * Math.PI / 180)) <= 0.05);
    const result = scenes.manipulation.render(end, mode);
    assert.equal(result.svg.includes(">已完整进入<"), offset <= maxOffset);
  }
});

test("only a positive single-foot support margin permits the foot lift", () => {
  const end = scenes.locomotion.steps;
  for (const [mode, margin] of [[0, -2], [1, 4]]) {
    assert.equal(reading("locomotion", 0, mode, "左脚余量"), -6);
    assert.equal(reading("locomotion", end, mode, "左脚余量"), margin);
    assert.equal(scenes.locomotion.render(end, mode).svg.includes(">单脚支撑<"), margin > 0);
  }
});

test("the obstacle stops the original route and replanning adds exactly two grid moves", () => {
  const end = scenes.navigation.steps;
  for (const mode of [0, 1]) {
    assert.equal(reading("navigation", 2, mode, "已走"), 2);
    assert.equal(reading("navigation", 3, mode, "已走"), 2);
  }
  for (let step = 4; step <= end; step++) {
    assert.equal(reading("navigation", step, 0, "已走"), 2);
    assert.equal(reading("navigation", step, 1, "已走"), step - 1);
  }
  assert.equal(reading("navigation", end, 1, "已走"), 7 + 2);
  assert.ok(scenes.navigation.render(end, 1).svg.includes("到达目标"));
});

test("camera samples, policy commands, and actuator motion update on separate ticks", () => {
  const fast = scenes.timing.render(5, 0);
  const slow = scenes.timing.render(5, 1);
  assert.deepEqual(measurements(fast.caption, "读数为"), [0.5]);
  assert.deepEqual(measurements(slow.caption, "读数为"), [0]);
  assert.equal(reading("timing", 5, 0, "目标指令"), 0);
  assert.equal(reading("timing", 6, 0, "目标指令"), 0.5);
  assert.equal(reading("timing", 6, 0, "滑台实位"), 0);
  assert.equal(reading("timing", 7, 0, "滑台实位"), 0.23);
  assert.equal(reading("timing", 7, 1, "滑台实位"), 0);
});

test("a demonstrated path clears the post while averaging two demonstrations stops on contact", () => {
  const scene = scenes.trajectories;
  const halfway = scene.render(12, 0).caption;
  assert.deepEqual(measurements(halfway, "横向前进"), [12]);
  assert.deepEqual(measurements(halfway, "纵向偏移"), [5]);
  const end = scene.render(scene.steps, 0).caption;
  assert.deepEqual(measurements(end, "横向前进"), [24]);
  assert.deepEqual(measurements(end, "纵向偏移"), [0]);
  for (let step = 0; step <= scene.steps; step++) {
    const averaged = scene.render(step, 1).caption;
    assert.deepEqual(measurements(averaged, "横向前进"), [Math.min(step, 9)]);
    assert.deepEqual(measurements(averaged, "纵向偏移"), [0]);
  }
});
