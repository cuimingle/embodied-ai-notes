"""Check numerical examples against analytic motion and static force balance."""

import importlib.util
import json
import math
import unittest

from examples.simulation.oscillator import exact_state, run_comparison, simulate
from examples.simulation.contact import ContactConfig, model_xml, run_contact, run_sweep


class OscillatorTests(unittest.TestCase):
    def test_analytic_quarter_period_with_nonunit_parameters(self):
        # m=2, k=8 gives omega=2; a quarter period exchanges scaled x and v.
        x, v = exact_state(math.pi / 4, mass=2, stiffness=8, x0=3, v0=4)
        self.assertAlmostEqual(x, 2)
        self.assertAlmostEqual(v, -6)

    def test_explicit_euler_energy_matches_amplification_factor(self):
        mass, stiffness, dt, steps = 2.0, 8.0, 0.01, 500
        rows = simulate(method="euler", mass=mass, stiffness=stiffness,
                        x0=0.7, v0=-0.3, dt=dt, steps=steps)
        expected = rows[0]["energy"] * (1 + (stiffness / mass) * dt * dt) ** steps
        self.assertAlmostEqual(rows[-1]["energy"], expected, places=11)

    def test_semi_implicit_energy_bounded_but_not_exact(self):
        rows = simulate(method="semi_implicit", dt=0.05, steps=4000)
        energy = [row["energy"] for row in rows]
        self.assertLess(max(energy), 0.514)
        self.assertGreater(min(energy), 0.487)
        self.assertGreater(max(energy) - min(energy), 0.01)

    def test_first_order_convergence_at_fixed_duration(self):
        coarse = run_comparison(dt=0.05, steps=20)
        fine = run_comparison(dt=0.025, steps=40)
        for method in ("euler", "semi_implicit"):
            with self.subTest(method=method):
                ratio = (coarse["metrics"][method]["final_phase_space_error"] /
                         fine["metrics"][method]["final_phase_space_error"])
                self.assertGreater(ratio, 1.9)
                self.assertLess(ratio, 2.1)

    def test_rest_state_and_strict_json(self):
        report = run_comparison(x0=0, v0=0, steps=10)
        self.assertEqual(report["exact_energy"], 0)
        self.assertTrue(all(row["energy"] == 0 for row in report["trajectories"]["euler"]))
        json.dumps(report, allow_nan=False)

    def test_rejects_invalid_or_nonfinite_numerics(self):
        for kwargs in ({"dt": 0}, {"dt": float("nan")}, {"mass": -1},
                       {"stiffness": float("inf")}, {"steps": 0},
                       {"steps": 1.5}, {"x0": float("nan")},
                       {"method": "unknown"}):
            with self.subTest(kwargs=kwargs), self.assertRaises(ValueError):
                simulate(**kwargs)
        with self.assertRaises(ValueError):
            simulate(method="euler", dt=1e100, steps=10)


class ContactConfigurationTests(unittest.TestCase):
    def test_rejects_silently_clamped_contact_time_constant(self):
        with self.assertRaisesRegex(ValueError, "refsafety"):
            model_xml(ContactConfig(dt=0.01, time_constant=0.005))

    def test_invalid_physical_configuration(self):
        for config in (ContactConfig(mass=0), ContactConfig(initial_z=0.04),
                       ContactConfig(solver="unknown"), ContactConfig(tolerance=-1),
                       ContactConfig(steps=0), ContactConfig(dt=float("nan"))):
            with self.subTest(config=config), self.assertRaises(ValueError):
                config.validate()


@unittest.skipUnless(importlib.util.find_spec("mujoco"), "optional MuJoCo dependency not installed")
class ContactPhysicsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = run_contact()

    def test_free_fall_matches_semi_implicit_discrete_solution(self):
        config = self.report["config"]
        n = 50  # t=0.1 s, before impact.
        row = self.report["trajectory"][n]
        self.assertEqual(row["contact_count"], 0)
        expected_z = config["initial_z"] - config["gravity"] * config["dt"] ** 2 * n * (n + 1) / 2
        self.assertAlmostEqual(row["center_z"], expected_z, places=12)
        self.assertAlmostEqual(row["z_velocity"], -config["gravity"] * config["dt"] * n, places=12)
        self.assertEqual(row["support_force_z"], 0)

    def test_static_support_balances_weight(self):
        metrics = self.report["metrics"]
        self.assertAlmostEqual(metrics["tail_mean_support_force_z"], metrics["static_weight"], places=6)
        self.assertLess(metrics["tail_z_velocity_rms"], 1e-6)
        self.assertGreater(metrics["tail_mean_penetration"], 0)
        self.assertLess(metrics["tail_mean_penetration"], 1e-3)
        self.assertFalse(any(self.report["warnings"].values()))

    def test_split_step_sampling_preserves_standard_step_trajectory(self):
        import mujoco
        model = mujoco.MjModel.from_xml_string(self.report["model_xml"])
        data = mujoco.MjData(model)
        for index in range(self.report["config"]["steps"]):
            mujoco.mj_step(model, data)
            row = self.report["trajectory"][index + 1]
            self.assertAlmostEqual(float(data.qpos[2]), row["center_z"], places=12)
            self.assertAlmostEqual(float(data.qvel[2]), row["z_velocity"], places=12)

    def test_sweep_is_single_factor_and_report_is_finite(self):
        report = run_sweep(ContactConfig(steps=200))
        for case in report["cases"]:
            changed = {key for key, value in case["config"].items()
                       if value != report["baseline_config"][key]}
            self.assertLessEqual(len(changed), 1)
            if changed:
                self.assertEqual(changed, {case["changed_parameter"]})
        json.dumps(report, allow_nan=False)


if __name__ == "__main__":
    unittest.main()
