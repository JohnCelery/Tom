"""Unit tests for core state logic."""
from __future__ import annotations

import math
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tomagotchi.core.state import LifeStage, NEED_NAMES, PetState


class PetStateTests(unittest.TestCase):
    def test_initial_stats(self) -> None:
        state = PetState()
        for need in NEED_NAMES:
            self.assertEqual(state.stats[need], 85.0)
        self.assertEqual(state.stage, LifeStage.EGG)

    def test_apply_deltas_clamps(self) -> None:
        state = PetState()
        state.apply_deltas({"nourishment": 40, "health": -200}, "test")
        self.assertEqual(state.stats["nourishment"], 100.0)
        self.assertEqual(state.stats["health"], 0.0)

    def test_advance_stage_when_ready(self) -> None:
        state = PetState()
        state.stats.update({need: 90 for need in NEED_NAMES})
        state.age_minutes = int(math.ceil(120))
        state.advance_time(0)
        self.assertEqual(state.stage, LifeStage.HATCHLING)

    def test_serialization_roundtrip(self) -> None:
        state = PetState(name="Lumi")
        state.apply_deltas({"social": -10}, "test")
        payload = state.to_json()
        restored = PetState.from_json(payload)
        self.assertEqual(restored.name, "Lumi")
        self.assertAlmostEqual(restored.stats["social"], state.stats["social"])


if __name__ == "__main__":
    unittest.main()
