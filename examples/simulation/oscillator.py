"""Compare two Euler methods with the exact solution of an undamped oscillator.

Run from the repository root:
    python -m examples.simulation.oscillator --output outputs/oscillator.json
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

from .common import positive_finite, positive_integer, provenance, write_report


def validate_config(mass: float, stiffness: float, x0: float, v0: float,
                    dt: float, steps: int) -> None:
    for name, value in (("mass", mass), ("stiffness", stiffness), ("dt", dt)):
        positive_finite(name, value)
    for name, value in (("x0", x0), ("v0", v0)):
        if not math.isfinite(value):
            raise ValueError(f"{name} must be finite")
    positive_integer("steps", steps)
    if not math.isfinite(stiffness / mass) or stiffness / mass == 0:
        raise ValueError("stiffness / mass must be finite and positive")
    if not math.isfinite(dt * steps):
        raise ValueError("duration must be finite")


def exact_state(time: float, *, mass: float = 1.0, stiffness: float = 1.0,
                x0: float = 1.0, v0: float = 0.0) -> tuple[float, float]:
    """Return the analytic displacement and velocity of m*x'' + k*x = 0."""
    omega = math.sqrt(stiffness / mass)
    phase = omega * time
    return (x0 * math.cos(phase) + v0 * math.sin(phase) / omega,
            -x0 * omega * math.sin(phase) + v0 * math.cos(phase))


def simulate(*, method: str = "semi_implicit", mass: float = 1.0,
             stiffness: float = 1.0, x0: float = 1.0, v0: float = 0.0,
             dt: float = 0.05, steps: int = 400) -> list[dict]:
    """Include the initial state and every completed integration step."""
    validate_config(mass, stiffness, x0, v0, dt, steps)
    if method not in ("euler", "semi_implicit"):
        raise ValueError("method must be euler or semi_implicit")
    trajectory = []
    x, v = x0, v0
    for step in range(steps + 1):
        time = step * dt
        exact_x, exact_v = exact_state(time, mass=mass, stiffness=stiffness, x0=x0, v0=v0)
        # Multiplication permits a deliberate non-finite check instead of an
        # overflow raised by exponentiation before a helpful message is built.
        energy = 0.5 * mass * v * v + 0.5 * stiffness * x * x
        row = {"time": time, "x": x, "v": v, "exact_x": exact_x,
               "exact_v": exact_v, "energy": energy}
        if not all(math.isfinite(value) for value in row.values()):
            raise ValueError(f"non-finite numerical state at step {step}; reduce dt or duration")
        trajectory.append(row)
        if step < steps:
            acceleration = -(stiffness / mass) * x
            if method == "euler":
                x, v = x + dt * v, v + dt * acceleration
            else:
                v += dt * acceleration
                x += dt * v
    return trajectory


def run_comparison(*, mass: float = 1.0, stiffness: float = 1.0,
                   x0: float = 1.0, v0: float = 0.0, dt: float = 0.05,
                   steps: int = 400) -> dict:
    config = dict(mass=mass, stiffness=stiffness, x0=x0, v0=v0, dt=dt, steps=steps)
    trajectories = {method: simulate(method=method, **config)
                    for method in ("euler", "semi_implicit")}
    exact_energy = 0.5 * mass * v0 * v0 + 0.5 * stiffness * x0 * x0
    metrics = {}
    for method, rows in trajectories.items():
        final = rows[-1]
        metrics[method] = {
            "max_position_error": max(abs(row["x"] - row["exact_x"]) for row in rows),
            "final_position_error": abs(final["x"] - final["exact_x"]),
            "final_phase_space_error": math.hypot(
                final["x"] - final["exact_x"],
                (final["v"] - final["exact_v"]) / math.sqrt(stiffness / mass)),
            "max_absolute_energy_error": max(abs(row["energy"] - exact_energy) for row in rows),
            "final_energy": final["energy"],
        }
    return {
        "experiment": "undamped_oscillator", "schema_version": 1,
        "config": config, "environment": provenance(),
        "seed": None, "randomization": "none; deterministic initial state",
        "units": {"time": "s", "x": "m", "v": "m/s", "energy": "J"},
        "exact_energy": exact_energy,
        "semi_implicit_stability_parameter": dt * math.sqrt(stiffness / mass),
        "metrics": metrics, "trajectories": trajectories,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--stiffness", type=float, default=1.0)
    parser.add_argument("--x0", type=float, default=1.0)
    parser.add_argument("--v0", type=float, default=0.0)
    parser.add_argument("--dt", type=float, default=0.05)
    parser.add_argument("--steps", type=int, default=400)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output = args.output
    del args.output
    try:
        write_report(run_comparison(**vars(args)), output)
    except (ValueError, OverflowError) as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
