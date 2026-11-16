"""Drop a rigid box on a plane and measure MuJoCo's contact response without a GUI.

Run from the repository root:
    python -m examples.simulation.contact --sweep --output outputs/contact.json
"""

from __future__ import annotations

import argparse
from dataclasses import asdict, dataclass, replace
import math
from pathlib import Path

from .common import positive_finite, positive_integer, provenance, write_report


@dataclass(frozen=True)
class ContactConfig:
    dt: float = 0.002
    steps: int = 1000
    mass: float = 1.0
    half_size: float = 0.05
    initial_z: float = 0.5
    gravity: float = 9.81
    solver: str = "Newton"
    iterations: int = 50
    tolerance: float = 1e-10
    time_constant: float = 0.02
    damping_ratio: float = 1.0

    def validate(self) -> None:
        for name in ("dt", "mass", "half_size", "initial_z", "gravity",
                     "time_constant", "damping_ratio"):
            positive_finite(name, getattr(self, name))
        positive_integer("steps", self.steps)
        positive_integer("iterations", self.iterations, maximum=10_000)
        if self.initial_z <= self.half_size:
            raise ValueError("initial_z must place the box strictly above the plane")
        if not math.isfinite(self.tolerance) or self.tolerance < 0:
            raise ValueError("tolerance must be finite and nonnegative")
        if self.solver not in ("PGS", "CG", "Newton"):
            raise ValueError("solver must be PGS, CG, or Newton")
        # MuJoCo's default refsafety silently enforces this lower bound.
        # Reject such a setting so the requested sweep describes the used model.
        if self.time_constant < 2 * self.dt:
            raise ValueError("time_constant must be >= 2 * dt (MuJoCo refsafety)")


def model_xml(config: ContactConfig) -> str:
    """Return the exact model text recorded in each report."""
    config.validate()
    return f'''<mujoco model="contact_box">
  <compiler angle="radian"/>
  <option timestep="{config.dt}" gravity="0 0 -{config.gravity}"
          integrator="Euler" solver="{config.solver}"
          iterations="{config.iterations}" tolerance="{config.tolerance}"/>
  <default>
    <geom condim="3" friction="0.8 0.005 0.0001"
          solref="{config.time_constant} {config.damping_ratio}"
          solimp="0.9 0.95 0.001 0.5 2"/>
  </default>
  <worldbody>
    <geom name="floor" type="plane" size="2 2 0.1"/>
    <body name="box" pos="0 0 {config.initial_z}">
      <freejoint/>
      <geom name="box_geom" type="box"
            size="{config.half_size} {config.half_size} {config.half_size}"
            mass="{config.mass}"/>
    </body>
  </worldbody>
</mujoco>
'''


def _dependencies():
    try:
        import mujoco
        import numpy
    except ImportError as exc:
        raise RuntimeError(
            "Install simulation dependencies first: "
            "python -m pip install -r requirements-simulation.txt"
        ) from exc
    return mujoco, numpy


def run_contact(config: ContactConfig | None = None) -> dict:
    """Take state, geometry, and force samples at the same physical instant.

    mj_step1 evaluates geometry at t. We save the state at t, then mj_step2
    solves the constraints at t and integrates to t+dt. Its contact forces and
    geometry still refer to t, so they complete the saved row consistently.
    A final mj_forward computes one terminal sample without advancing time.
    This split-step implementation deliberately uses the Euler integrator.
    """
    config = ContactConfig() if config is None else config
    config.validate()
    mujoco, np = _dependencies()
    xml = model_xml(config)
    model = mujoco.MjModel.from_xml_string(xml)
    data = mujoco.MjData(model)
    box_id = mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_GEOM, "box_geom")
    force = np.zeros(6)
    trajectory = []

    def state_row() -> dict:
        # The z extent of an oriented box is the absolute rotation row dotted
        # with its half sizes, not simply the unrotated half height.
        rotation = data.geom_xmat[box_id].reshape(3, 3)
        extent_z = sum(abs(float(rotation[2, axis])) * config.half_size
                       for axis in range(3))
        center_z = float(data.geom_xpos[box_id, 2])
        return {
            "time": float(data.time), "center_z": center_z,
            "z_velocity": float(data.qvel[2]),
            "penetration": max(0.0, extent_z - center_z),
            "contact_count": int(data.ncon),
        }

    def finish_row(row: dict) -> None:
        support_z = 0.0
        for index in range(data.ncon):
            contact = data.contact[index]
            if box_id not in (contact.geom1, contact.geom2):
                continue
            mujoco.mj_contactForce(model, data, index, force)
            # The contact frame maps world vectors to contact coordinates;
            # the returned force acts on geom2, and the reaction on geom1.
            world_force = contact.frame.reshape(3, 3).T @ force[:3]
            sign = 1.0 if contact.geom2 == box_id else -1.0
            support_z += sign * float(world_force[2])
        row["support_force_z"] = support_z
        row["solver_iterations_max"] = int(max(data.solver_niter, default=0))
        if not all(math.isfinite(value) for value in row.values()):
            raise ValueError("non-finite MuJoCo sample; reduce dt or inspect the model")
        trajectory.append(row)

    for _ in range(config.steps):
        mujoco.mj_step1(model, data)
        row = state_row()
        mujoco.mj_step2(model, data)
        finish_row(row)
    mujoco.mj_forward(model, data)
    finish_row(state_row())

    warnings = {name: int(data.warning[getattr(mujoco.mjtWarning, name)].number)
                for name in ("mjWARN_INERTIA", "mjWARN_CONTACTFULL", "mjWARN_CNSTRFULL",
                             "mjWARN_BADQPOS", "mjWARN_BADQVEL", "mjWARN_BADQACC",
                             "mjWARN_BADCTRL")}
    if any(warnings[name] for name in ("mjWARN_BADQPOS", "mjWARN_BADQVEL", "mjWARN_BADQACC")):
        raise ValueError("MuJoCo reported numerical instability; inspect dt and contact settings")

    tail = trajectory[(3 * config.steps) // 4:]
    mean = lambda key: sum(row[key] for row in tail) / len(tail)
    metrics = {
        "max_penetration": max(row["penetration"] for row in trajectory),
        "tail_mean_penetration": mean("penetration"),
        "tail_z_velocity_rms": math.sqrt(sum(row["z_velocity"] ** 2 for row in tail) / len(tail)),
        "tail_mean_support_force_z": mean("support_force_z"),
        "static_weight": config.mass * config.gravity,
        "tail_mean_solver_iterations_max": mean("solver_iterations_max"),
        "final_center_z": trajectory[-1]["center_z"],
        "final_z_velocity": trajectory[-1]["z_velocity"],
    }
    return {
        "experiment": "box_contact", "schema_version": 1,
        "config": asdict(config),
        "environment": {**provenance(), "mujoco": mujoco.__version__, "numpy": np.__version__},
        "seed": None, "randomization": "none; fixed position and zero velocity",
        "model_xml": xml,
        "units": {"time": "s", "center_z": "m", "penetration": "m",
                  "z_velocity": "m/s", "support_force_z": "N"},
        "measurement_window": {
            "start_time": tail[0]["time"], "end_time": tail[-1]["time"],
            "samples": len(tail),
            "description": "last quarter of simulated duration; this window alone does not imply settling",
        },
        "sampling": "state, geometry and solved force all refer to the recorded time; final sample uses mj_forward",
        "warnings": warnings, "metrics": metrics, "trajectory": trajectory,
    }


def run_sweep(config: ContactConfig | None = None) -> dict:
    """Change one variable relative to the supplied baseline in every case."""
    config = ContactConfig() if config is None else config
    config.validate()
    cases = [
        ("baseline", None, config),
        ("iteration_cap_1", "iterations", replace(config, iterations=1)),
        ("iteration_cap_5", "iterations", replace(config, iterations=5)),
        ("tolerance_1e-3", "tolerance", replace(config, tolerance=1e-3)),
        ("softer_contact", "time_constant", replace(config, time_constant=config.time_constant * 5)),
        ("stiffer_contact", "time_constant", replace(config, time_constant=max(2 * config.dt, config.time_constant / 2))),
    ]
    return {
        "experiment": "box_contact_sweep", "schema_version": 1,
        "baseline_config": asdict(config),
        "comparison": "each case changes at most one requested parameter relative to baseline; no performance ordering is assumed",
        "cases": [{"name": name, "changed_parameter": changed, **run_contact(case)}
                  for name, changed, case in cases],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dt", type=float, default=0.002)
    parser.add_argument("--steps", type=int, default=1000)
    parser.add_argument("--mass", type=float, default=1.0)
    parser.add_argument("--half-size", type=float, default=0.05)
    parser.add_argument("--initial-z", type=float, default=0.5)
    parser.add_argument("--gravity", type=float, default=9.81)
    parser.add_argument("--solver", choices=("PGS", "CG", "Newton"), default="Newton")
    parser.add_argument("--iterations", type=int, default=50)
    parser.add_argument("--tolerance", type=float, default=1e-10)
    parser.add_argument("--time-constant", type=float, default=0.02)
    parser.add_argument("--damping-ratio", type=float, default=1.0)
    parser.add_argument("--sweep", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    output, sweep = args.output, args.sweep
    del args.output, args.sweep
    try:
        config = ContactConfig(**vars(args))
        write_report(run_sweep(config) if sweep else run_contact(config), output)
    except (ValueError, RuntimeError, OverflowError) as exc:
        parser.error(str(exc))


if __name__ == "__main__":
    main()
