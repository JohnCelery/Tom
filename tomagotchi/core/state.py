"""Game state management for the Tomagotchi pet."""
from __future__ import annotations

import json
import math
import time
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Dict, List, MutableMapping, Optional


NEED_NAMES: List[str] = [
    "nourishment",
    "energy",
    "cleanliness",
    "happiness",
    "health",
    "social",
]


class LifeStage(str, Enum):
    """Lifecycle stages for the pet."""

    EGG = "egg"
    HATCHLING = "hatchling"
    CHILD = "child"
    TEEN = "teen"
    ADULT = "adult"


# Minutes required in each stage before evolution becomes possible.
STAGE_THRESHOLDS = {
    LifeStage.EGG: 10,
    LifeStage.HATCHLING: 120,
    LifeStage.CHILD: 360,
    LifeStage.TEEN: 720,
    LifeStage.ADULT: math.inf,
}

# Default decay rates per in-game minute for each stat.
DEFAULT_DECAY: Dict[str, float] = {
    "nourishment": 0.09,
    "energy": 0.07,
    "cleanliness": 0.05,
    "happiness": 0.04,
    "health": 0.03,
    "social": 0.05,
}

MOOD_THRESHOLDS = {
    "ecstatic": 85,
    "content": 65,
    "concerned": 45,
    "upset": 25,
}


@dataclass
class PetState:
    """Represents the persistent state of the player's pet."""

    name: str = "Nova"
    stage: LifeStage = LifeStage.EGG
    age_minutes: int = 0
    stats: MutableMapping[str, float] = field(
        default_factory=lambda: {need: 85.0 for need in NEED_NAMES}
    )
    traits: List[str] = field(default_factory=lambda: ["gentle", "curious"])
    mood: str = "content"
    history: List[str] = field(default_factory=list)
    last_saved: float = field(default_factory=time.time)

    def decay_needs(self, minutes: int) -> None:
        """Apply need decay for the given amount of in-game minutes."""

        for need, rate in DEFAULT_DECAY.items():
            self.stats[need] = max(0.0, self.stats[need] - rate * minutes)
        self._update_mood()

    def apply_deltas(self, deltas: MutableMapping[str, float], source: str) -> None:
        """Apply stat changes from an action or event."""

        for need in NEED_NAMES:
            delta = deltas.get(need, 0.0)
            self.stats[need] = max(0.0, min(100.0, self.stats[need] + delta))
        self.history.append(f"{time.strftime('%H:%M')} - {source}")
        self._update_mood()

    def rest(self, minutes: int) -> None:
        """Recover energy and health while resting."""

        self.stats["energy"] = min(100.0, self.stats["energy"] + minutes * 0.15)
        self.stats["health"] = min(100.0, self.stats["health"] + minutes * 0.05)
        self._update_mood()

    def advance_time(self, minutes: int) -> None:
        """Increase age and decay needs as time passes."""

        self.age_minutes += minutes
        self.decay_needs(minutes)
        self._advance_stage_if_ready()

    def _advance_stage_if_ready(self) -> None:
        """Advance to the next life stage when requirements are met."""

        threshold = STAGE_THRESHOLDS[self.stage]
        if self.age_minutes < threshold:
            return

        high_stats = sum(1 for value in self.stats.values() if value >= 70)
        if high_stats >= 4:
            next_stage = {
                LifeStage.EGG: LifeStage.HATCHLING,
                LifeStage.HATCHLING: LifeStage.CHILD,
                LifeStage.CHILD: LifeStage.TEEN,
                LifeStage.TEEN: LifeStage.ADULT,
            }.get(self.stage)
            if next_stage and next_stage != self.stage:
                self.stage = next_stage
                self.history.append(
                    f"{time.strftime('%H:%M')} - Grew into a {self.stage.value}!"
                )

    def _update_mood(self) -> None:
        average = sum(self.stats.values()) / len(self.stats)
        for mood, threshold in MOOD_THRESHOLDS.items():
            if average >= threshold:
                self.mood = mood
                break
        else:
            self.mood = "distressed"

    def snapshot(self) -> Dict[str, float]:
        """Return a shallow copy of stat values."""

        return {name: float(value) for name, value in self.stats.items()}

    def to_json(self) -> str:
        """Serialize state to JSON."""

        payload = asdict(self)
        payload["stage"] = self.stage.value
        return json.dumps(payload, indent=2)

    @classmethod
    def from_json(cls, data: str) -> "PetState":
        payload = json.loads(data)
        payload["stage"] = LifeStage(payload["stage"])
        return cls(**payload)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self.to_json(), encoding="utf-8")
        self.last_saved = time.time()

    @classmethod
    def load(cls, path: Path) -> Optional["PetState"]:
        if not path.exists():
            return None
        data = path.read_text(encoding="utf-8")
        return cls.from_json(data)


__all__ = ["PetState", "LifeStage", "NEED_NAMES", "DEFAULT_DECAY"]
