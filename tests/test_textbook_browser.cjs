/* Test the actual local browser kernels with Node's built-in runner. */
const test = require("node:test");
const assert = require("node:assert/strict");
const cp = require("node:child_process");
const C = require("../docs/assets/javascripts/rl-core.js");
const S = require("../docs/assets/javascripts/rl-simulations.js");
const demos = ["trajectory", "evaluation", "action-values", "optimality", "contraction",
  "iteration", "mc", "epsilon", "stochastic", "td", "n-step", "approximation",
  "dqn-target", "policy-gradient", "actor-critic", "importance", "trpo", "ppo", "grpo", "gspo"];
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

function checkFinite(value) {
  if (typeof value === "number") assert.ok(Number.isFinite(value));
  else if (value && typeof value === "object") Object.values(value).forEach(checkFinite);
}

test("book grid remains continuing, allows forbidden cells, and penalizes boundaries", () => {
  assert.deepEqual(C.transition(5, 2), [6, -1]);
  assert.deepEqual(C.transition(6, 3), [9, 1]);
  assert.deepEqual(C.transition(9, 5), [9, 1]);
  assert.deepEqual(C.transition(9, 2), [9, -1]);
  assert.throws(() => C.transition(0, 2));
  assert.deepEqual(C.features(3, "quadratic"), [1, 1, -1, 1, 1, -1]);
  C.evaluate().forEach((value, i) => near(value, [7.29, 8.1, 7.29, 8.1, 9, 10, 9, 10, 10][i]));
});

test("Python and browser kernels share every transition, policy value, and random draw", () => {
  const script = [
    "import json", "from examples.textbook import core", "rng=core.Random(7)",
    "print(json.dumps({'transitions': [core.BookGrid().transition(s,a) for s in range(1,10) for a in range(1,6)], 'values': core.evaluate(), 'draws': [rng.uniform() for _ in range(100)]}))",
  ].join("\n");
  const reference = JSON.parse(cp.execFileSync(process.env.PYTHON || "python3", ["-c", script], { cwd: require("node:path").join(__dirname, ".."), encoding: "utf8" }));
  const transitions = Array.from({ length: 9 }, (_, s) => Array.from({ length: 5 }, (_, a) => C.transition(s + 1, a + 1))).flat();
  assert.deepEqual(transitions, reference.transitions);
  C.evaluate().forEach((value, i) => near(value, reference.values[i]));
  const rng = C.random(7);
  reference.draws.forEach(value => assert.equal(rng(), value));
});

test("all twenty simulations and their parameter variants have finite reproducible frames", () => {
  const variants = [{}, { gamma: 0.1, alpha: 0.01 }, { gamma: 0.95, alpha: 0.2 }];
  const modes = { trajectory: ["forbidden"], iteration: ["3", "exact"], mc: ["20"],
    td: ["sarsa", "q-learning"], approximation: ["quadratic", "one-hot"],
    "dqn-target": ["1", "20"], "policy-gradient": ["exact"], ppo: ["-1"], grpo: ["equal"] };
  for (const name of demos) {
    for (const options of [...variants, ...(modes[name] || []).map(mode => ({ mode }))]) {
      const result = S.make(name, options);
      assert.ok(result.frames.length > 1, name);
      assert.equal(typeof result.caption, "string");
      result.frames.forEach(frame => {
        assert.equal(typeof frame.note, "string");
        checkFinite(frame);
      });
      assert.deepEqual(result, S.make(name, options));
    }
  }
});

test("Bellman playback converges and discount changes the actual result", () => {
  const result = S.make("evaluation");
  const exact = C.evaluate();
  result.frames.at(-1).values.forEach((value, i) => near(value, exact[i], 0.003));
  assert.notDeepEqual(result.frames.at(-1).values, S.make("evaluation", { gamma: 0.5 }).frames.at(-1).values);
});

test("PPO, GRPO, and GSPO use their mathematical objectives", () => {
  near(C.ppoObjective(1.5, 1), 1.2);
  near(C.ppoObjective(0.5, -1), -0.8);
  near(C.ppoObjective(1.5, -1), -1.5);
  assert.deepEqual(C.groupAdvantages([1, 1, 1, 1]), [0, 0, 0, 0]);
  assert.deepEqual(C.groupAdvantages([0, 0, 1, 1]), [-1, -1, 1, 1]);
  near(C.sequenceRatio([1.8, 0.5]), Math.sqrt(0.9));
});
