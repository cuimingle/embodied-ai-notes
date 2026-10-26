/* Original numerical kernels, shared by browser experiments and Node checks. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.RLTeaching = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const actions = [[-1, 0], [0, 1], [1, 0], [0, -1], [0, 0]];
  function random(seed = 7) {
    let state = (seed >>> 0) || 1;
    return () => {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      state >>>= 0;
      return state / 4294967296;
    };
  }
  function sample(probabilities, rng) {
    const draw = rng(); let sum = 0;
    for (let i = 0; i < probabilities.length; i++) {
      sum += probabilities[i]; if (draw < sum) return i;
    }
    return probabilities.length - 1;
  }
  function transition(state, action) {
    if (!Number.isInteger(state) || !Number.isInteger(action) || state < 1 || state > 9 || action < 1 || action > 5) throw new Error("Invalid state or action");
    const row = Math.floor((state - 1) / 3), col = (state - 1) % 3;
    const nr = row + actions[action - 1][0], nc = col + actions[action - 1][1];
    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) return [state, -1];
    const next = 3 * nr + nc + 1;
    return [next, next === 9 ? 1 : next === 6 || next === 7 ? -1 : 0];
  }
  const uniformPolicy = () => Array.from({ length: 9 }, () => Array(5).fill(0.2));
  function examplePolicy() {
    const policy = Array.from({ length: 9 }, () => Array(5).fill(0));
    policy[0][1] = policy[0][2] = 0.5;
    [3, 4, 2, 3, 3, 2, 2, 5].forEach((a, i) => { policy[i + 1][a - 1] = 1; });
    return policy;
  }
  function solve(matrix, vector) {
    const a = matrix.map((row, i) => [...row, vector[i]]), n = vector.length;
    for (let j = 0; j < n; j++) {
      let pivot = j;
      for (let i = j + 1; i < n; i++) if (Math.abs(a[i][j]) > Math.abs(a[pivot][j])) pivot = i;
      if (Math.abs(a[pivot][j]) < 1e-12) throw new Error("Singular matrix");
      [a[j], a[pivot]] = [a[pivot], a[j]];
      const scale = a[j][j]; a[j] = a[j].map(x => x / scale);
      for (let i = 0; i < n; i++) {
        if (i === j) continue;
        const factor = a[i][j]; a[i] = a[i].map((x, k) => x - factor * a[j][k]);
      }
    }
    return a.map(row => row[n]);
  }
  function model(policy) {
    const p = Array.from({ length: 9 }, () => Array(9).fill(0)), r = Array(9).fill(0);
    policy.forEach((row, s) => row.forEach((probability, a) => {
      const [next, reward] = transition(s + 1, a + 1);
      p[s][next - 1] += probability; r[s] += probability * reward;
    }));
    return { p, r };
  }
  function evaluate(policy = examplePolicy(), gamma = 0.9) {
    const { p, r } = model(policy);
    return solve(p.map((row, i) => row.map((x, j) => Number(i === j) - gamma * x)), r);
  }
  function actionValues(values, gamma = 0.9) {
    return Array.from({ length: 9 }, (_, s) => actions.map((_, a) => {
      const [next, reward] = transition(s + 1, a + 1);
      return reward + gamma * values[next - 1];
    }));
  }
  function greedyPolicy(q) {
    return q.map(row => {
      const best = Math.max(...row), index = row.findIndex(x => Math.abs(x - best) < 1e-10);
      return row.map((_, i) => Number(i === index));
    });
  }
  function backup(values, policy, gamma = 0.9) {
    const q = actionValues(values, gamma);
    return policy.map((row, s) => row.reduce((sum, probability, a) => sum + probability * q[s][a], 0));
  }
  function features(state, basis = "linear") {
    const x = ((state - 1) % 3) - 1, y = Math.floor((state - 1) / 3) - 1;
    if (basis === "one-hot") return Array.from({ length: 9 }, (_, i) => Number(i === state - 1));
    if (basis === "quadratic") return [1, x, y, x * x, y * y, x * y];
    return [1, x, y];
  }
  function epsilonGreedy(q, epsilon = 0.2) {
    const best = q.indexOf(Math.max(...q));
    return q.map((_, i) => epsilon / q.length + (i === best ? 1 - epsilon : 0));
  }
  const sigmoid = theta => 1 / (1 + Math.exp(-Math.max(-700, Math.min(700, theta))));
  function bernoulliKL(p, q) { return p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q)); }
  function ppoObjective(ratio, advantage, epsilon = 0.2) {
    return Math.min(ratio * advantage, Math.max(1 - epsilon, Math.min(1 + epsilon, ratio)) * advantage);
  }
  function groupAdvantages(rewards) {
    const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    const std = Math.sqrt(rewards.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rewards.length);
    return rewards.map(r => std > 1e-12 ? (r - mean) / std : 0);
  }
  function sequenceRatio(ratios) { return Math.exp(ratios.reduce((sum, x) => sum + Math.log(x), 0) / ratios.length); }
  function discountedReturn(rewards, gamma = 0.9, tail = 0) {
    return rewards.reduceRight((sum, r) => r + gamma * sum, tail);
  }
  return { random, sample, transition, uniformPolicy, examplePolicy, solve, model, evaluate,
    actionValues, greedyPolicy, backup, features, epsilonGreedy, sigmoid, bernoulliKL,
    ppoObjective, groupAdvantages, sequenceRatio, discountedReturn };
});
