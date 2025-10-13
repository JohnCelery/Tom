"""Dynamic events that respond to pet state."""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable, List

from .state import PetState


@dataclass
class Event:
    """Represents a possible in-game event."""

    name: str
    description: str
    condition: Callable[[PetState], bool]
    effect: Callable[[PetState], None]


class EventManager:
    """Evaluates and triggers events over time."""

    def __init__(self) -> None:
        self._events: List[Event] = [
            Event(
                name="mischief",
                description="Nova found a hidden stash of glitter pompoms!",
                condition=lambda state: state.stats["happiness"] > 75
                and state.stats["energy"] > 40,
                effect=lambda state: state.apply_deltas(
                    {"happiness": 4, "cleanliness": -6}, "Playful mischief occurred."
                ),
            ),
            Event(
                name="dull",
                description="The room feels quiet. Maybe a story would help?",
                condition=lambda state: state.stats["social"] < 35,
                effect=lambda state: state.apply_deltas(
                    {"social": -2, "happiness": -3}, "Lonely moment passed."
                ),
            ),
            Event(
                name="wellness",
                description="A serene aura settles as Nova practices slow breathing.",
                condition=lambda state: state.stats["health"] > 80
                and random.random() < 0.1,
                effect=lambda state: state.apply_deltas(
                    {"health": 2, "energy": 2}, "Peaceful meditation boosted vitality."
                ),
            ),
        ]

    def check(self, state: PetState) -> List[str]:
        """Evaluate events and return descriptions of those that triggered."""

        triggered: List[str] = []
        for event in self._events:
            if event.condition(state):
                triggered.append(event.description)
                event.effect(state)
        return triggered


__all__ = ["Event", "EventManager"]
