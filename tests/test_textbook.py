"""Numerical checks against the supplied September 2024 textbook."""

import json
import math
from pathlib import Path
import unittest

from examples.textbook import core
from examples.textbook.__main__ import CHAPTERS, DEMOS, run_demo


class TextbookModelTests(unittest.TestCase):
    def assert_vector_close(self, actual, expected, places=9):
        self.assertEqual(len(actual), len(expected))
        for a, b in zip(actual, expected):
            self.assertAlmostEqual(a, b, places=places)

    def test_all_chapter_one_transitions_and_rewards(self):
        next_states = [
            [1, 2, 4, 1, 1], [2, 3, 5, 1, 2], [3, 3, 6, 2, 3],
            [1, 5, 7, 4, 4], [2, 6, 8, 4, 5], [3, 6, 9, 5, 6],
            [4, 8, 7, 7, 7], [5, 9, 8, 7, 8], [6, 9, 9, 8, 9],
        ]
        rewards = [
            [-1, 0, 0, -1, 0], [-1, 0, 0, 0, 0], [-1, -1, -1, 0, 0],
            [0, 0, -1, -1, 0], [0, -1, 0, 0, 0], [0, -1, 1, 0, -1],
            [0, 0, -1, -1, -1], [0, 1, -1, -1, 0], [-1, -1, -1, 0, 1],
        ]
        grid = core.BookGrid()
        for s in range(1, 10):
            for a in range(1, 6):
                with self.subTest(state=s, action=a):
                    self.assertEqual(grid.transition(s, a),
                                     (next_states[s - 1][a - 1], rewards[s - 1][a - 1]))

    def test_table_policy_values_and_bellman_equation(self):
        expected = [7.29, 8.1, 7.29, 8.1, 9, 10, 9, 10, 10]
        values = core.evaluate()
        self.assert_vector_close(values, expected)
        self.assert_vector_close(core.backup(values, core.example_policy()), values)
        transition, _ = core.model(core.example_policy())
        self.assertTrue(all(math.isclose(sum(row), 1) for row in transition))
        self.assertAlmostEqual(core.trajectory()["infinite_return"], expected[0])
        # Advantage has zero conditional mean under the same policy.
        q_values = core.action_values(values)
        for probabilities, row, value in zip(core.example_policy(), q_values, values):
            self.assertAlmostEqual(sum(p * (q - value) for p, q in zip(probabilities, row)), 0)

    def test_contraction_and_three_planning_schemes(self):
        gamma = 0.9
        u, v = [i / 3 for i in range(9)], [2 - i for i in range(9)]
        distance = max(abs(a - b) for a, b in zip(u, v))
        for policy in (core.example_policy(), core.uniform_policy()):
            first, second = core.backup(u, policy, gamma), core.backup(v, policy, gamma)
            self.assertLessEqual(max(abs(a - b) for a, b in zip(first, second)), gamma * distance + 1e-12)
        vi = core.planning(iterations=300)
        pi = core.planning(iterations=30, exact=True)
        truncated = core.planning(iterations=150, evaluation_sweeps=3)
        self.assert_vector_close(vi["values"], pi["values"], places=8)
        self.assert_vector_close(truncated["values"], pi["values"], places=8)
        optimal_backup = [max(row) for row in core.action_values(pi["values"])]
        self.assert_vector_close(optimal_backup, pi["values"])

    def test_sample_means_and_mc_truncation_bound(self):
        result = core.stochastic_approximation(steps=200)
        total = 0
        for row in result["trace"]:
            total += row["sample"]
            self.assertAlmostEqual(row["estimates"][1], total / row["step"])
        mc = core.monte_carlo(samples=40, horizon=20)
        self.assertAlmostEqual(mc["estimate"], sum(row["return"] for row in mc["trace"]) / 40)
        self.assertAlmostEqual(mc["tail_bound"], 0.9 ** 20 / 0.1)
        # Bound the truncation bias using the finite-horizon Bellman calculation.
        values = [0.0] * 9
        for _ in range(19):
            values = core.backup(values, core.uniform_policy())
        truncated_q = core.action_values(values)[0][1]
        self.assertLessEqual(abs(truncated_q - mc["truth"]), mc["tail_bound"])

    def test_td_updates_only_visited_entry(self):
        for method in ("td", "sarsa", "q-learning"):
            result = core.temporal_difference(steps=60, method=method)
            previous = [0.0] * 9
            for row in result["trace"]:
                self.assertAlmostEqual(row["td_error"], row["target"] - row["prediction"])
                if method == "td":
                    for i, value in enumerate(row["values"]):
                        expected = previous[i] + (0.1 * row["td_error"] if i == row["state"] - 1 else 0)
                        self.assertAlmostEqual(value, expected)
                previous = row["values"]

    def test_n_step_target_with_exact_deterministic_tail(self):
        for gamma in (0.1, 0.9, 0.95):
            for row in core.n_step_targets(gamma)["trace"]:
                self.assertAlmostEqual(row["target"], gamma ** 3 / (1 - gamma))

    def test_target_table_is_frozen_between_syncs(self):
        previous = [0.0, 0.0]
        result = core.dqn_target_demo(steps=30, sync_every=5)
        for row in result["trace"]:
            self.assertEqual(row["target"], row["main"] if row["synced"] else previous)
            previous = row["target"]

    def test_polynomial_features_follow_equations_8_15_and_8_16(self):
        self.assertEqual(core.features(1), [1, -1, -1])
        self.assertEqual(core.features(5, "quadratic"), [1, 0, 0, 0, 0, 0])
        self.assertEqual(core.features(3, "quadratic"), [1, 1, -1, 1, 1, -1])
        for state in range(1, 10):
            one_hot = core.features(state, "one-hot")
            self.assertEqual(sum(one_hot), 1)
            self.assertEqual(one_hot[state - 1], 1)

    def test_policy_gradient_and_baseline_identity(self):
        for theta in (-2, 0, 1.5):
            probability = core.sigmoid(theta)
            numerical = (core.sigmoid(theta + 1e-5) - core.sigmoid(theta - 1e-5)) / 2e-5
            exact = probability * (1 - probability)
            self.assertAlmostEqual(exact, numerical, places=9)
            for baseline in (-3, 0, 10):
                sampled_mean = sum(p * (a - baseline) * (a - probability)
                                   for a, p in ((0, 1 - probability), (1, probability)))
                self.assertAlmostEqual(sampled_mean, exact)
        result = core.actor_critic(steps=5000)
        self.assertGreater(core.sigmoid(result["theta"]), 0.95)
        self.assertLess(abs(result["weight"] - result["trace"][-1]["truth"]), 1)

    def test_importance_weights_recover_target_expectation(self):
        beta = 0.8
        weighted = beta * (0.5 / beta) - (1 - beta) * (0.5 / (1 - beta))
        self.assertAlmostEqual(weighted, 0)
        self.assertEqual(core.epsilon_greedy([1, 3, 2, -1, 0], 0), [0, 1, 0, 0, 0])
        self.assert_vector_close(core.epsilon_greedy([1, 3, 2, -1, 0], 1), [0.2] * 5)

    def test_extension_objectives(self):
        self.assertAlmostEqual(core.bernoulli_kl(0.4, 0.4), 0)
        self.assertGreater(core.bernoulli_kl(0.4, 0.8), 0.02)
        self.assertAlmostEqual(core.ppo_objective(1.5, 1), 1.2)
        self.assertAlmostEqual(core.ppo_objective(0.5, -1), -0.8)
        self.assertAlmostEqual(core.ppo_objective(1.5, -1), -1.5)
        self.assertEqual(core.group_advantages([1, 1, 1, 1]), [0] * 4)
        self.assert_vector_close(core.group_advantages([0, 0, 1, 1]), [-1, -1, 1, 1])
        self.assertAlmostEqual(core.sequence_ratio([1.8, 0.5]), math.sqrt(0.9))

    def test_every_demo_produces_finite_json(self):
        for name in DEMOS:
            with self.subTest(demo=name):
                json.dumps(run_demo(name, steps=40), allow_nan=False)

    def test_book_manifest_and_embedded_experiments_agree(self):
        root = Path(__file__).resolve().parents[1]
        manifest = json.loads((root / "docs/book-manifest.json").read_text())
        self.assertEqual([c["number"] for c in manifest["chapters"]], list(range(1, 11)))
        embedded = set()
        for chapter in manifest["chapters"]:
            text = (root / "docs" / chapter["path"]).read_text()
            self.assertIn(CHAPTERS[chapter["number"]], chapter["demos"])
            for demo in chapter["demos"]:
                self.assertIn(f'data-rl-demo="{demo}"', text)
                embedded.add(demo)
            self.assertEqual([p + 13 for p in chapter["printed_pages"]], chapter["pdf_pages"])
        for demo in manifest["extensions"]:
            self.assertIn(f'data-rl-demo="{demo}"', (root / "docs/extensions" / f"{demo}.md").read_text())
            embedded.add(demo)
        self.assertEqual(embedded, set(DEMOS))


if __name__ == "__main__":
    unittest.main()
