const test = require("node:test");
const assert = require("node:assert/strict");
const { simulate } = require("../docs/assets/javascripts/simulation-widgets.js");

test("explicit Euler energy follows its analytic geometric growth law", () => {
  const dt = 0.1;
  const { trajectories } = simulate({ dt, steps: 200 });
  for (const [index, frame] of trajectories.euler.entries()) {
    const expected = 0.5 * (1 + dt * dt) ** index;
    assert.ok(Math.abs(frame.energy - expected) < expected * 1e-12);
  }
});

test("semi-implicit Euler preserves the oscillator's modified quadratic invariant", () => {
  const dt = 0.2;
  const { trajectories } = simulate({ dt, steps: 5000 });
  for (const frame of trajectories.semi_implicit) {
    const modifiedEnergy = frame.energy - 0.5 * dt * frame.x * frame.v;
    assert.ok(Math.abs(modifiedEnergy - 0.5) < 1e-12);
    assert.ok(frame.energy >= 0.5 / (1 + dt / 2) - 1e-12);
    assert.ok(frame.energy <= 0.5 / (1 - dt / 2) + 1e-12);
  }
});

test("exact reference satisfies the initial conditions and conserves energy", () => {
  const parameters = { mass: 2, stiffness: 5, x0: -0.4, v0: 0.7, dt: 0.02, steps: 300 };
  const { trajectories } = simulate(parameters);
  assert.equal(trajectories.euler[0].exact_x, parameters.x0);
  assert.equal(trajectories.euler[0].exact_v, parameters.v0);
  const energy = (parameters.mass * parameters.v0 ** 2 + parameters.stiffness * parameters.x0 ** 2) / 2;
  for (const frame of trajectories.euler) {
    const actual = (parameters.mass * frame.exact_v ** 2 + parameters.stiffness * frame.exact_x ** 2) / 2;
    assert.ok(Math.abs(actual - energy) < 1e-12);
  }
});

test("both methods converge towards the analytic solution as the step is refined", () => {
  const coarse = simulate({ dt: 0.02, steps: 100 });
  const fine = simulate({ dt: 0.01, steps: 200 });
  for (const method of ["euler", "semi_implicit"]) {
    const error = result => {
      const frame = result.trajectories[method].at(-1);
      return Math.hypot(frame.x - frame.exact_x, frame.v - frame.exact_v);
    };
    const ratio = error(coarse) / error(fine);
    assert.ok(ratio > 1.9 && ratio < 2.1, `${method}: ${ratio}`);
  }
});

test("invalid parameters and overflowing trajectories are rejected", () => {
  for (const options of [{ mass: 0 }, { stiffness: -1 }, { dt: NaN }, { dt: 0 }, { steps: 0 }, { steps: 2.5 }, { x0: Infinity }, { steps: 20001 }]) {
    assert.throws(() => simulate(options), RangeError);
  }
  assert.throws(() => simulate({ dt: 1e200, steps: 3 }), RangeError);
});
