"""Run one chapter experiment or one small mathematical illustration."""

import argparse
import json
from pathlib import Path

from . import core

CHAPTERS = {
    1: "trajectory", 2: "evaluation", 3: "optimality", 4: "iteration",
    5: "mc", 6: "stochastic", 7: "td", 8: "approximation",
    9: "policy-gradient", 10: "actor-critic",
}
DEMOS = tuple(CHAPTERS.values()) + (
    "action-values", "contraction", "epsilon", "n-step", "dqn-target", "importance",
    "trpo", "ppo", "grpo", "gspo",
)


def run_demo(name, steps=80, seed=7, gamma=0.9):
    core.validate_gamma(gamma)
    if steps < 1:
        raise ValueError("steps must be positive")
    if name == "trajectory":
        return core.trajectory(gamma, steps)
    if name == "evaluation":
        return core.policy_evaluation(gamma, steps)
    if name == "action-values":
        values = core.evaluate(gamma=gamma)
        return {"values": values, "q_values": core.action_values(values, gamma)}
    if name in ("optimality", "iteration"):
        return {"value_iteration": core.planning(gamma, steps),
                "policy_iteration": core.planning(gamma, steps, exact=True),
                "truncated_iteration": core.planning(gamma, steps, evaluation_sweeps=3)}
    if name == "contraction":
        return core.contraction(steps)
    if name == "mc":
        return core.monte_carlo(seed, steps, gamma=gamma)
    if name == "epsilon":
        return {"q_values": [1, 3, 2, -1, 0], "probabilities": core.epsilon_greedy([1, 3, 2, -1, 0])}
    if name == "stochastic":
        return core.stochastic_approximation(seed, steps)
    if name == "td":
        return {method: core.temporal_difference(seed, steps, gamma, method=method)
                for method in ("td", "sarsa", "q-learning")}
    if name == "n-step":
        return core.n_step_targets(gamma)
    if name == "approximation":
        return {basis: core.value_approximation(seed, steps, gamma, basis=basis)
                for basis in ("one-hot", "linear", "quadratic")}
    if name == "dqn-target":
        return core.dqn_target_demo(seed, steps, gamma)
    if name == "policy-gradient":
        return core.policy_gradient(seed, steps, gamma=gamma)
    if name == "actor-critic":
        return core.actor_critic(seed, steps, gamma)
    if name == "importance":
        return core.importance_sampling(seed, steps)
    if name == "trpo":
        return {"old_probability": 0.4, "kl_limit": 0.02,
                "trace": [{"probability": p / 100, "kl": core.bernoulli_kl(0.4, p / 100)}
                          for p in range(5, 96, 5)]}
    if name == "ppo":
        return {str(advantage): [{"ratio": i / 20, "objective": core.ppo_objective(i / 20, advantage)}
                                for i in range(1, 41)] for advantage in (-1, 1)}
    if name == "grpo":
        rewards = [0, 0, 1, 1]
        return {"rewards": rewards, "advantages": core.group_advantages(rewards)}
    if name == "gspo":
        ratios = [1.8, 0.5]
        return {"token_ratios": ratios, "sequence_ratio": core.sequence_ratio(ratios)}
    raise ValueError(f"unknown demo: {name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    choice = parser.add_mutually_exclusive_group(required=True)
    choice.add_argument("--chapter", type=int, choices=CHAPTERS)
    choice.add_argument("--demo", choices=DEMOS)
    parser.add_argument("--steps", type=int, default=80)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--gamma", type=float, default=0.9)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    name = args.demo or CHAPTERS[args.chapter]
    try:
        result = run_demo(name, args.steps, args.seed, args.gamma)
    except ValueError as error:
        parser.error(str(error))
    report = {"demo": name, "book_edition": "2024-09", "seed": args.seed,
              "gamma": args.gamma, "steps": args.steps, "result": result}
    encoded = json.dumps(report, indent=2, allow_nan=False)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded + "\n", encoding="utf-8")
        print(f"Saved {name} to {args.output}")
    else:
        print(encoded)


if __name__ == "__main__":
    main()
