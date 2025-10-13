"""Time management helpers for Tomagotchi."""
from __future__ import annotations

import random
from dataclasses import dataclass, field
from typing import List

from .state import PetState


DAY_LENGTH_MINUTES = 24 * 60


@dataclass
class TimeSnapshot:
    """Container for time information used by the renderer."""

    total_minutes: int = 0
    events: List[str] = field(default_factory=list)

    @property
    def minute_of_day(self) -> int:
        return self.total_minutes % DAY_LENGTH_MINUTES

    @property
    def hour(self) -> int:
        return self.minute_of_day // 60

    @property
    def minute(self) -> int:
        return self.minute_of_day % 60

    @property
    def period(self) -> str:
        if 6 <= self.hour < 12:
            return "Morning"
        if 12 <= self.hour < 18:
            return "Afternoon"
        if 18 <= self.hour < 22:
            return "Evening"
        return "Night"


@dataclass
class TimeManager:
    """Advances in-game time and produces ambient events."""

    random_seed: int = 42
    snapshot: TimeSnapshot = field(default_factory=TimeSnapshot)

    def __post_init__(self) -> None:
        random.seed(self.random_seed)

    def advance(self, minutes: int, state: PetState) -> List[str]:
        """Advance time and update the pet accordingly."""

        events: List[str] = []
        minutes = max(1, minutes)
        for _ in range(minutes):
            self.snapshot.total_minutes += 1
            state.advance_time(1)
            events.extend(self._ambient_triggers(state))
        if events:
            events = events[-5:]
        self.snapshot.events = events
        return events

    def _ambient_triggers(self, state: PetState) -> List[str]:
        """Generate ambient events based on time of day and stats."""

        triggers: List[str] = []
        minute_of_day = self.snapshot.minute_of_day

        if minute_of_day % 180 == 0:
            triggers.append("A breeze rustles the habitat's curtains.")

        if state.stats["energy"] < 30 and random.random() < 0.05:
            triggers.append("Nova lets out a tiny yawn, begging for rest.")

        if state.stats["social"] < 35 and random.random() < 0.04:
            triggers.append("Lonely eyes search for your attention.")

        if state.mood == "ecstatic" and random.random() < 0.03:
            triggers.append("Joyful sparks twirl across the room!")

        return triggers


__all__ = ["TimeManager", "TimeSnapshot", "DAY_LENGTH_MINUTES"]
