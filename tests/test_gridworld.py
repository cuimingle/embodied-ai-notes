"""Check environment boundaries and algorithmic results against an independent oracle."""

import unittest
from collections import deque

from examples.gridworld import (
    ACTIONS, GridWorld, evaluate, policy_iteration, q_learning, td_target, value_iteration,
)


def shortest_distance(env, start):
    """Breadth-first search is an independent shortest-path oracle."""
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        state, distance = queue.popleft()
        if state == env.goal:
            return distance
        for dr, dc in ACTIONS:
            candidate = (state[0] + dr, state[1] + dc)
            if candidate in env.states and candidate not in visited:
                visited.add(candidate)
                queue.append((candidate, distance + 1))
    raise AssertionError("goal is unreachable")


class GridWorldTests(unittest.TestCase):
    def test_walls_and_boundaries(self):
        env = GridWorld()
        self.assertEqual(env.transition((0, 0), 0), ((0, 0), -1.0, False))
        self.assertEqual(env.transition((1, 0), 1), ((1, 0), -1.0, False))
        self.assertEqual(env.steps, 0)

    def test_termination_and_absorbing_value(self):
        env = GridWorld()
        env.reset((3, 2))
        self.assertEqual(env.step(1), ((3, 3), 1.0, True, False))
        self.assertEqual(env.transition(env.goal, 0), (env.goal, 0.0, True))
        with self.assertRaises(RuntimeError):
            env.step(1)

    def test_truncation_keeps_bootstrap(self):
        env = GridWorld(max_steps=1)
        _, reward, terminated, truncated = env.step(1)
        self.assertFalse(terminated)
        self.assertTrue(truncated)
        self.assertEqual(td_target(reward, 10.0, terminated, 0.9), 8.0)
        self.assertEqual(td_target(1.0, 10.0, True, 0.9), 1.0)
        with self.assertRaises(RuntimeError):
            env.step(1)

    def test_planners_match_shortest_path_values(self):
        env = GridWorld()
        gamma = 0.95
        for planner in (value_iteration, policy_iteration):
            with self.subTest(planner=planner.__name__):
                values, policy, _ = planner(env, gamma)
                for state in policy:
                    distance = shortest_distance(env, state)
                    expected = -sum(gamma ** k for k in range(distance - 1)) + gamma ** (distance - 1)
                    self.assertAlmostEqual(values[state], expected, places=7)
                result = evaluate(env, policy)
                self.assertEqual(result["successes"], result["episodes"])
                self.assertEqual(result["default_start"]["steps"], 6)

    def test_q_learning_reaches_goal_across_seeds(self):
        for seed in (0, 1, 2):
            with self.subTest(seed=seed):
                env = GridWorld()
                _, policy, history = q_learning(env, seed=seed)
                result = evaluate(env, policy)
                self.assertEqual(result["successes"], result["episodes"])
                self.assertEqual(result["default_start"]["steps"], shortest_distance(env, env.start))
                self.assertEqual(len(history), 2000)

    def test_reproducible_training(self):
        self.assertEqual(q_learning(GridWorld(), episodes=50, seed=7), q_learning(GridWorld(), episodes=50, seed=7))

    def test_invalid_configuration(self):
        with self.assertRaises(ValueError):
            value_iteration(GridWorld(), gamma=1.0)
        with self.assertRaises(ValueError):
            q_learning(GridWorld(), episodes=0)
        with self.assertRaises(ValueError):
            GridWorld(max_steps=0)


if __name__ == "__main__":
    unittest.main()
