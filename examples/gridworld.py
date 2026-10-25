"""Compare planning and tabular learning in a deterministic GridWorld."""

from __future__ import annotations

import argparse
import json
import math
import platform
import random
from pathlib import Path
from typing import TypeAlias

State: TypeAlias = tuple[int, int]
Values: TypeAlias = dict[State, float]
Policy: TypeAlias = dict[State, int]
ACTIONS = ((-1, 0), (0, 1), (1, 0), (0, -1))
ARROWS = ("^", ">", "v", "<")


class GridWorld:
    """A fully observed task with external rollout truncation."""

    rows = 4
    cols = 4
    start: State = (0, 0)
    goal: State = (3, 3)
    walls = frozenset({(1, 1), (2, 1)})

    def __init__(self, max_steps: int = 100):
        if max_steps < 1:
            raise ValueError("max_steps must be positive")
        self.max_steps = max_steps
        self.states = tuple(
            (row, col)
            for row in range(self.rows)
            for col in range(self.cols)
            if (row, col) not in self.walls
        )
        self.reset()

    def reset(self, start: State | None = None) -> State:
        start = self.start if start is None else start
        if start not in self.states or start == self.goal:
            raise ValueError("reset requires a valid nonterminal state")
        self.state = start
        self.steps = 0
        self.ended = False
        return self.state

    def transition(self, state: State, action: int) -> tuple[State, float, bool]:
        """Expose the model to planners without changing rollout state."""
        if state not in self.states or action not in range(len(ACTIONS)):
            raise ValueError("invalid state or action")
        if state == self.goal:
            return state, 0.0, True
        dr, dc = ACTIONS[action]
        candidate = (state[0] + dr, state[1] + dc)
        next_state = candidate if candidate in self.states else state
        terminated = next_state == self.goal
        return next_state, 1.0 if terminated else -1.0, terminated

    def step(self, action: int) -> tuple[State, float, bool, bool]:
        if self.ended:
            raise RuntimeError("reset is required after termination or truncation")
        self.state, reward, terminated = self.transition(self.state, action)
        self.steps += 1
        truncated = self.steps >= self.max_steps and not terminated
        self.ended = terminated or truncated
        return self.state, reward, terminated, truncated


def validate_gamma(gamma: float) -> None:
    if not 0.0 <= gamma < 1.0:
        raise ValueError("gamma must satisfy 0 <= gamma < 1")


def td_target(reward: float, next_value: float, terminated: bool, gamma: float) -> float:
    """Only true termination masks bootstrapping; truncation does not."""
    return reward if terminated else reward + gamma * next_value


def action_values(env: GridWorld, state: State, values: Values, gamma: float) -> list[float]:
    result = []
    for action in range(len(ACTIONS)):
        next_state, reward, terminated = env.transition(state, action)
        result.append(td_target(reward, values[next_state], terminated, gamma))
    return result


def greedy_action(values: list[float]) -> int:
    """Use a fixed tie rule so equivalent policies remain stable."""
    best = max(values)
    return next(i for i, value in enumerate(values) if math.isclose(value, best, abs_tol=1e-10, rel_tol=0))


def value_iteration(
    env: GridWorld, gamma: float = 0.95, tolerance: float = 1e-10
) -> tuple[Values, Policy, int]:
    validate_gamma(gamma)
    if tolerance <= 0:
        raise ValueError("tolerance must be positive")
    values = dict.fromkeys(env.states, 0.0)
    for iteration in range(1, 100_001):
        updated = {
            state: 0.0 if state == env.goal else max(action_values(env, state, values, gamma))
            for state in env.states
        }
        residual = max(abs(updated[s] - values[s]) for s in env.states)
        values = updated
        if residual < tolerance:
            policy = {
                s: greedy_action(action_values(env, s, values, gamma))
                for s in env.states if s != env.goal
            }
            return values, policy, iteration
    raise RuntimeError("value iteration did not converge")


def policy_iteration(
    env: GridWorld, gamma: float = 0.95, tolerance: float = 1e-10
) -> tuple[Values, Policy, int]:
    validate_gamma(gamma)
    if tolerance <= 0:
        raise ValueError("tolerance must be positive")
    policy = {s: 0 for s in env.states if s != env.goal}
    values = dict.fromkeys(env.states, 0.0)
    for iteration in range(1, 1001):
        for _ in range(100_000):
            updated = {env.goal: 0.0}
            for state, action in policy.items():
                next_state, reward, terminated = env.transition(state, action)
                updated[state] = td_target(reward, values[next_state], terminated, gamma)
            residual = max(abs(updated[s] - values[s]) for s in env.states)
            values = updated
            if residual < tolerance:
                break
        else:
            raise RuntimeError("policy evaluation did not converge")
        improved = {
            s: greedy_action(action_values(env, s, values, gamma)) for s in policy
        }
        if improved == policy:
            return values, policy, iteration
        policy = improved
    raise RuntimeError("policy iteration did not converge")


def q_learning(
    env: GridWorld, seed: int = 0, episodes: int = 2000,
    gamma: float = 0.95, alpha: float = 0.2, epsilon: float = 0.2,
) -> tuple[dict[State, list[float]], Policy, list[dict]]:
    validate_gamma(gamma)
    if episodes < 1 or not 0 < alpha <= 1 or not 0 <= epsilon <= 1:
        raise ValueError("invalid episodes, alpha, or epsilon")
    rng = random.Random(seed)
    q = {state: [0.0] * len(ACTIONS) for state in env.states}
    history = []
    for episode in range(episodes):
        state = env.reset()
        total_reward = 0.0
        while True:
            if rng.random() < epsilon:
                action = rng.randrange(len(ACTIONS))
            else:
                best = max(q[state])
                choices = [i for i, v in enumerate(q[state]) if v == best]
                action = rng.choice(choices)
            next_state, reward, terminated, truncated = env.step(action)
            target = td_target(reward, max(q[next_state]), terminated, gamma)
            q[state][action] += alpha * (target - q[state][action])
            total_reward += reward
            state = next_state
            if terminated or truncated:
                history.append({
                    "episode": episode + 1, "steps": env.steps,
                    "return": total_reward, "success": terminated,
                    "truncated": truncated,
                })
                break
    policy = {s: greedy_action(q[s]) for s in env.states if s != env.goal}
    return q, policy, history


def rollout(env: GridWorld, policy: Policy, start: State) -> dict:
    state = env.reset(start)
    path = [state]
    total_reward = 0.0
    while True:
        state, reward, terminated, truncated = env.step(policy[state])
        path.append(state)
        total_reward += reward
        if terminated or truncated:
            return {
                "path": path, "steps": env.steps, "return": total_reward,
                "success": terminated, "truncated": truncated,
            }


def evaluate(env: GridWorld, policy: Policy) -> dict:
    """Evaluate once from each nonterminal state, with exploration disabled."""
    outcomes = [rollout(env, policy, s) for s in env.states if s != env.goal]
    return {
        "protocol": "one deterministic rollout per nonterminal state; no exploration",
        "successes": sum(item["success"] for item in outcomes),
        "episodes": len(outcomes),
        "mean_steps": sum(item["steps"] for item in outcomes) / len(outcomes),
        "default_start": rollout(env, policy, env.start),
    }


def render_policy(env: GridWorld, policy: Policy) -> list[str]:
    return [
        " ".join(
            "#" if (r, c) in env.walls else "G" if (r, c) == env.goal
            else ARROWS[policy[(r, c)]]
            for c in range(env.cols)
        )
        for r in range(env.rows)
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--algorithm", choices=("value-iteration", "policy-iteration", "q-learning"), default="value-iteration")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--episodes", type=int, default=2000)
    parser.add_argument("--gamma", type=float, default=0.95)
    parser.add_argument("--alpha", type=float, default=0.2)
    parser.add_argument("--epsilon", type=float, default=0.2)
    parser.add_argument("--max-steps", type=int, default=100)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        env = GridWorld(args.max_steps)
        if args.algorithm == "q-learning":
            q, policy, history = q_learning(env, args.seed, args.episodes, args.gamma, args.alpha, args.epsilon)
            training = {"history": history, "q_values": {str(s): row for s, row in q.items()}}
        else:
            planner = value_iteration if args.algorithm == "value-iteration" else policy_iteration
            values, policy, iterations = planner(env, args.gamma)
            training = {"iterations": iterations, "values": {str(s): v for s, v in values.items()}}
    except ValueError as error:
        parser.error(str(error))
    result = {
        "algorithm": args.algorithm, "python": platform.python_version(),
        "config": {key: value for key, value in vars(args).items() if key != "output"},
        "environment": {
            "rows": env.rows, "cols": env.cols, "start": env.start,
            "goal": env.goal, "walls": sorted(env.walls),
            "step_reward": -1.0, "goal_reward": 1.0,
            "time_limit_is_truncation": True,
        },
        "evaluation": evaluate(env, policy),
        "policy": render_policy(env, policy),
        "training": training,
    }
    print(json.dumps({k: v for k, v in result.items() if k != "training"}, indent=2))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        print(f"Saved full run to {args.output}")


if __name__ == "__main__":
    main()
