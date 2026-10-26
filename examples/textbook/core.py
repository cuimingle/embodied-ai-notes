"""Small numerical models for Mathematical Foundations of Reinforcement Learning.

The grid follows Chapter 1, Tables 1.1 and 1.3: nine accessible states,
five actions, penalized forbidden cells, and a nonterminal target state.
All implementations are original teaching code, not the book's source code.
"""

from __future__ import annotations

import math

ACTIONS = ((-1, 0), (0, 1), (1, 0), (0, -1), (0, 0))
ACTION_NAMES = ("up", "right", "down", "left", "stay")


class Random:
    """Xorshift32 shared with the browser implementation for reproducible traces."""

    def __init__(self, seed=7):
        self.state = int(seed) & 0xFFFFFFFF or 1

    def uniform(self):
        x = self.state
        x ^= (x << 13) & 0xFFFFFFFF
        x ^= x >> 17
        x ^= (x << 5) & 0xFFFFFFFF
        self.state = x & 0xFFFFFFFF
        return self.state / 4294967296

    def categorical(self, probabilities):
        draw = self.uniform()
        cumulative = 0.0
        for index, probability in enumerate(probabilities):
            cumulative += probability
            if draw < cumulative:
                return index
        return len(probabilities) - 1


class BookGrid:
    """Use one-based state/action indices, matching Chapter 1."""

    states = tuple(range(1, 10))
    actions = tuple(range(1, 6))
    forbidden = frozenset((6, 7))
    target = 9

    def transition(self, state, action):
        if state not in self.states or action not in self.actions:
            raise ValueError("state must be 1..9 and action must be 1..5")
        row, col = divmod(state - 1, 3)
        dr, dc = ACTIONS[action - 1]
        nr, nc = row + dr, col + dc
        if not (0 <= nr < 3 and 0 <= nc < 3):
            return state, -1.0
        next_state = 3 * nr + nc + 1
        reward = 1.0 if next_state == self.target else -1.0 if next_state in self.forbidden else 0.0
        return next_state, reward


def validate_gamma(gamma):
    if not 0 < gamma < 1:
        raise ValueError("the discounted textbook experiments require 0 < gamma < 1")


def uniform_policy():
    return [[0.2] * 5 for _ in range(9)]


def example_policy():
    """Table 1.2: s1 chooses right/down; the target selects stay."""
    policy = [[0.0] * 5 for _ in range(9)]
    policy[0][1] = policy[0][2] = 0.5
    for state, action in enumerate((3, 4, 2, 3, 3, 2, 2, 5), start=2):
        policy[state - 1][action - 1] = 1.0
    return policy


def solve(matrix, vector):
    """Solve a small nonsingular linear system with partial pivoting."""
    n = len(vector)
    augmented = [list(row) + [vector[i]] for i, row in enumerate(matrix)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda row: abs(augmented[row][col]))
        if abs(augmented[pivot][col]) < 1e-12:
            raise ValueError("singular matrix")
        augmented[col], augmented[pivot] = augmented[pivot], augmented[col]
        scale = augmented[col][col]
        augmented[col] = [x / scale for x in augmented[col]]
        for row in range(n):
            if row == col:
                continue
            scale = augmented[row][col]
            augmented[row] = [x - scale * y for x, y in zip(augmented[row], augmented[col])]
    return [row[-1] for row in augmented]


def model(policy):
    if len(policy) != 9:
        raise ValueError("a grid policy must have nine rows")
    transition = [[0.0] * 9 for _ in range(9)]
    rewards = [0.0] * 9
    grid = BookGrid()
    for state, probabilities in enumerate(policy, start=1):
        if len(probabilities) != 5 or min(probabilities) < 0 or not math.isclose(sum(probabilities), 1):
            raise ValueError("each policy row must be a distribution on five actions")
        for action, probability in enumerate(probabilities, start=1):
            next_state, reward = grid.transition(state, action)
            transition[state - 1][next_state - 1] += probability
            rewards[state - 1] += probability * reward
    return transition, rewards


def evaluate(policy=None, gamma=0.9):
    validate_gamma(gamma)
    transition, rewards = model(example_policy() if policy is None else policy)
    matrix = [[float(i == j) - gamma * transition[i][j] for j in range(9)] for i in range(9)]
    return solve(matrix, rewards)


def action_values(values, gamma=0.9):
    grid = BookGrid()
    return [[reward + gamma * values[next_state - 1]
             for next_state, reward in (grid.transition(s, a) for a in grid.actions)]
            for s in grid.states]


def greedy_policy(q_values):
    result = []
    for row in q_values:
        best = max(row)
        action = next(i for i, x in enumerate(row) if math.isclose(x, best, abs_tol=1e-10, rel_tol=0))
        result.append([float(i == action) for i in range(5)])
    return result


def backup(values, policy, gamma=0.9):
    q_values = action_values(values, gamma)
    return [sum(p * q for p, q in zip(probs, row)) for probs, row in zip(policy, q_values)]


def planning(gamma=0.9, iterations=80, evaluation_sweeps=1, exact=False):
    """Policy improvement followed by one, several, or exact evaluation steps."""
    validate_gamma(gamma)
    if iterations < 1 or evaluation_sweeps < 1:
        raise ValueError("iterations and evaluation_sweeps must be positive")
    values = [0.0] * 9
    trace = []
    for k in range(iterations):
        q_values = action_values(values, gamma)
        policy = greedy_policy(q_values)
        previous = values[:]
        if exact:
            values = evaluate(policy, gamma)
        else:
            for _ in range(evaluation_sweeps):
                values = backup(values, policy, gamma)
        residual = max(abs(x - y) for x, y in zip(values, previous))
        trace.append({"step": k + 1, "values": values[:], "residual": residual})
        if residual < 1e-10:
            break
    policy = greedy_policy(action_values(values, gamma))
    return {"values": values, "policy": policy, "trace": trace}


def discounted_return(rewards, gamma=0.9, tail_value=0.0):
    result = tail_value
    for reward in reversed(rewards):
        result = reward + gamma * result
    return result


def epsilon_greedy(q_values, epsilon=0.2):
    if not 0 <= epsilon <= 1:
        raise ValueError("epsilon must be in [0, 1]")
    best = max(range(len(q_values)), key=q_values.__getitem__)
    return [epsilon / len(q_values) + (1 - epsilon if i == best else 0) for i in range(len(q_values))]


def monte_carlo(seed=7, samples=80, horizon=80, gamma=0.9):
    """Estimate q_pi(s1,a2) under a uniform continuation policy."""
    validate_gamma(gamma)
    rng, grid = Random(seed), BookGrid()
    truth = action_values(evaluate(uniform_policy(), gamma), gamma)[0][1]
    estimate, trace = 0.0, []
    for k in range(1, samples + 1):
        state, action, rewards = 1, 2, []
        for _ in range(horizon):
            state, reward = grid.transition(state, action)
            rewards.append(reward)
            action = rng.categorical([0.2] * 5) + 1
        result = discounted_return(rewards, gamma)
        estimate += (result - estimate) / k
        trace.append({"step": k, "return": result, "estimate": estimate, "truth": truth})
    return {"estimate": estimate, "truth": truth,
            "tail_bound": gamma ** horizon / (1 - gamma), "trace": trace}


def stochastic_approximation(seed=7, steps=80, alpha=0.2):
    rng, estimates, trace = Random(seed), [0.0, 0.0, 0.0], []
    for k in range(1, steps + 1):
        sample = (-1.0, 1.0, 3.0)[rng.categorical([0.2, 0.5, 0.3])]
        rates = (alpha, 1 / k, 1 / k ** 2)
        estimates = [w - rate * (w - sample) for w, rate in zip(estimates, rates)]
        trace.append({"step": k, "sample": sample, "estimates": estimates[:], "truth": 1.2})
    return {"estimates": estimates, "truth": 1.2, "trace": trace}


def temporal_difference(seed=7, steps=80, gamma=0.9, alpha=0.1, method="td"):
    """Continuing-task TD evaluation, Sarsa evaluation, or off-policy Q-learning."""
    validate_gamma(gamma)
    if method not in ("td", "sarsa", "q-learning"):
        raise ValueError("unknown TD method")
    rng, grid = Random(seed), BookGrid()
    values, q_values, trace = [0.0] * 9, [[0.0] * 5 for _ in range(9)], []
    state, action = 1, rng.categorical([0.2] * 5) + 1
    for k in range(steps):
        next_state, reward = grid.transition(state, action)
        next_action = rng.categorical([0.2] * 5) + 1
        if method == "td":
            prediction = values[state - 1]
            target = reward + gamma * values[next_state - 1]
            delta = target - prediction
            values[state - 1] += alpha * delta
        else:
            prediction = q_values[state - 1][action - 1]
            future = q_values[next_state - 1][next_action - 1] if method == "sarsa" else max(q_values[next_state - 1])
            target = reward + gamma * future
            delta = target - prediction
            q_values[state - 1][action - 1] += alpha * delta
            values = [sum(row) / 5 if method == "sarsa" else max(row) for row in q_values]
        trace.append({"step": k + 1, "state": state, "action": action,
                      "next_state": next_state, "reward": reward, "target": target,
                      "prediction": prediction, "td_error": delta, "values": values[:]})
        state, action = next_state, next_action
    return {"values": values, "q_values": q_values, "trace": trace}


def features(state, basis="linear"):
    row, col = divmod(state - 1, 3)
    x, y = col - 1, row - 1
    if basis == "one-hot":
        return [float(i == state - 1) for i in range(9)]
    if basis == "linear":
        return [1.0, x, y]
    if basis == "quadratic":
        return [1.0, x, y, x * x, y * y, x * y]
    raise ValueError("unknown feature basis")


def value_approximation(seed=7, steps=2000, gamma=0.9, alpha=0.03, basis="linear"):
    rng, grid, state = Random(seed), BookGrid(), 1
    weights, trace = [0.0] * len(features(1, basis)), []
    truth = evaluate(uniform_policy(), gamma)
    for k in range(steps):
        action = rng.categorical([0.2] * 5) + 1
        next_state, reward = grid.transition(state, action)
        phi, phi_next = features(state, basis), features(next_state, basis)
        prediction = sum(w * f for w, f in zip(weights, phi))
        future = sum(w * f for w, f in zip(weights, phi_next))
        delta = reward + gamma * future - prediction
        weights = [w + alpha * delta * f for w, f in zip(weights, phi)]
        if (k + 1) % 20 == 0 or k == steps - 1:
            fitted = [sum(w * f for w, f in zip(weights, features(s, basis))) for s in grid.states]
            trace.append({"step": k + 1, "values": fitted, "weights": weights[:],
                          "rmse": math.sqrt(sum((a - b) ** 2 for a, b in zip(fitted, truth)) / 9)})
        state = next_state
    return {"weights": weights, "truth": truth, "trace": trace}


def sigmoid(theta):
    return 1 / (1 + math.exp(-max(-700, min(700, theta))))


def policy_gradient(seed=7, steps=80, alpha=0.1, gamma=0.9, exact=False):
    """Average-reward policy optimization in a one-state continuing MDP."""
    rng, theta, trace = Random(seed), 0.0, []
    for k in range(steps):
        probability = sigmoid(theta)
        action = int(rng.uniform() < probability)
        gradient = probability * (1 - probability) if exact else action * (action - probability)
        theta += alpha * gradient
        probability = sigmoid(theta)
        trace.append({"step": k + 1, "theta": theta, "probability": probability,
                      "reward": action, "gradient": gradient, "average_reward": probability,
                      "state_value": probability / (1 - gamma)})
    return {"theta": theta, "trace": trace}


def actor_critic(seed=7, steps=80, gamma=0.9, alpha_actor=0.03, alpha_critic=0.1):
    """Algorithm 10.2 specialized to one state and a scalar value approximator."""
    rng, theta, weight, trace = Random(seed), 0.0, 0.0, []
    for k in range(steps):
        probability = sigmoid(theta)
        action = int(rng.uniform() < probability)
        delta = action + gamma * weight - weight
        theta += alpha_actor * delta * (action - probability)
        weight += alpha_critic * delta
        probability = sigmoid(theta)
        trace.append({"step": k + 1, "theta": theta, "weight": weight,
                      "probability": probability, "td_error": delta,
                      "truth": probability / (1 - gamma)})
    return {"theta": theta, "weight": weight, "trace": trace}


def bernoulli_kl(old_probability, new_probability):
    p, q = old_probability, new_probability
    if not 0 < p < 1 or not 0 < q < 1:
        raise ValueError("Bernoulli probabilities must be strictly between 0 and 1")
    return p * math.log(p / q) + (1 - p) * math.log((1 - p) / (1 - q))


def ppo_objective(ratio, advantage, epsilon=0.2):
    clipped = max(1 - epsilon, min(1 + epsilon, ratio))
    return min(ratio * advantage, clipped * advantage)


def group_advantages(rewards):
    if not rewards:
        raise ValueError("a reward group cannot be empty")
    mean = sum(rewards) / len(rewards)
    std = math.sqrt(sum((r - mean) ** 2 for r in rewards) / len(rewards))
    return [(r - mean) / std if std > 1e-12 else 0.0 for r in rewards]


def sequence_ratio(token_ratios):
    if not token_ratios or min(token_ratios) <= 0:
        raise ValueError("token ratios must be positive and nonempty")
    return math.exp(sum(math.log(x) for x in token_ratios) / len(token_ratios))


def trajectory(gamma=0.9, steps=12):
    grid, state, total, trace = BookGrid(), 1, 0.0, []
    actions = [2, 3, 3, 2] + [5] * max(0, steps - 4)
    for k, action in enumerate(actions[:steps]):
        next_state, reward = grid.transition(state, action)
        total += gamma ** k * reward
        trace.append({"step": k + 1, "state": state, "action": action,
                      "next_state": next_state, "reward": reward, "discounted_sum": total})
        state = next_state
    return {"trace": trace, "infinite_return": gamma ** 3 / (1 - gamma)}


def policy_evaluation(gamma=0.9, steps=80):
    values, trace, policy = [0.0] * 9, [], example_policy()
    truth = evaluate(policy, gamma)
    for k in range(steps):
        values = backup(values, policy, gamma)
        trace.append({"step": k + 1, "values": values[:],
                      "error": max(abs(x - y) for x, y in zip(values, truth))})
    return {"truth": truth, "trace": trace}


def contraction(steps=30, coefficient=0.5):
    x, trace = 3.0, []
    for k in range(steps):
        x *= coefficient
        trace.append({"step": k + 1, "estimate": x, "truth": 0.0})
    return {"coefficient": coefficient, "trace": trace}


def n_step_targets(gamma=0.9):
    rewards = [0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0]
    following_values = [gamma ** 2 / (1 - gamma), gamma / (1 - gamma)] + [1 / (1 - gamma)] * 6
    trace = []
    for n in range(1, len(rewards) + 1):
        observed = discounted_return(rewards[:n], gamma)
        bootstrap = gamma ** n * following_values[n - 1]
        trace.append({"step": n, "observed": observed, "bootstrap": bootstrap,
                      "target": observed + bootstrap})
    return {"trace": trace}


def dqn_target_demo(seed=7, steps=40, gamma=0.9, alpha=0.2, sync_every=5):
    """A two-entry table isolates target freezing; this is not a DQN trainer."""
    rng, main, target, trace = Random(seed), [0.0, 0.0], [0.0, 0.0], []
    buffer = [(0, 0.0), (1, 1.0)] * 3
    for k in range(steps):
        action, reward = buffer[int(rng.uniform() * len(buffer))]
        value = reward + gamma * max(target)
        main[action] += alpha * (value - main[action])
        synced = (k + 1) % sync_every == 0
        if synced:
            target = main[:]
        trace.append({"step": k + 1, "main": main[:], "target": target[:], "synced": synced})
    return {"trace": trace}


def importance_sampling(seed=7, steps=80, behavior_probability=0.8):
    rng, naive, corrected, trace = Random(seed), 0.0, 0.0, []
    for k in range(1, steps + 1):
        positive = rng.uniform() < behavior_probability
        x = 1.0 if positive else -1.0
        probability = behavior_probability if positive else 1 - behavior_probability
        weight = 0.5 / probability
        naive += (x - naive) / k
        corrected += (weight * x - corrected) / k
        trace.append({"step": k, "sample": x, "weight": weight,
                      "naive": naive, "corrected": corrected, "truth": 0.0})
    return {"trace": trace}
