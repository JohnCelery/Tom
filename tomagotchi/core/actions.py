"""Actions that the player can perform with their pet."""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable, Dict, List, Mapping, Optional

from .state import PetState, NEED_NAMES


@dataclass
class ActionResult:
    """Result of a player action."""

    description: str
    stat_deltas: Mapping[str, float]
    time_passed: int
    animation: str
    mood_hint: Optional[str] = None
    log_entries: Optional[List[str]] = None


@dataclass
class Action:
    """Definition of an action available to the player."""

    key: str
    title: str
    summary: str
    duration: int
    handler: Callable[[PetState], ActionResult]


def _meal(state: PetState) -> ActionResult:
    menu = [
        ("starfruit salad", {"nourishment": 22, "happiness": 8}),
        ("steamed bao", {"nourishment": 16, "social": 4}),
        ("herbal broth", {"nourishment": 10, "health": 8}),
    ]
    meal, deltas = random.choice(menu)
    description = f"Shared a warm {meal} with {state.name}."
    return ActionResult(
        description=description,
        stat_deltas=deltas,
        time_passed=12,
        animation="hearts",
        mood_hint="content",
    )


def _snack(state: PetState) -> ActionResult:
    treats = [
        ("berry mochi", {"nourishment": 12, "happiness": 6}),
        ("sparkle tea", {"happiness": 10, "energy": 4}),
        ("veggie crunch", {"health": 6, "nourishment": 8}),
    ]
    snack, deltas = random.choice(treats)
    return ActionResult(
        description=f"Nibbling on {snack} brought a smile to {state.name}.",
        stat_deltas=deltas,
        time_passed=6,
        animation="sparkles",
        mood_hint="ecstatic",
    )


def _clean(state: PetState) -> ActionResult:
    return ActionResult(
        description="You refreshed the habitat with fragrant mist and brushed fluff.",
        stat_deltas={"cleanliness": 24, "happiness": 6},
        time_passed=10,
        animation="bubbles",
        mood_hint="content",
    )


def _play(state: PetState) -> ActionResult:
    games = [
        ("mirror dance", {"happiness": 18, "social": 10, "energy": -8}),
        ("memory bloom", {"happiness": 14, "health": 6, "energy": -6}),
        ("starlight chase", {"happiness": 20, "energy": -10, "social": 6}),
    ]
    game, deltas = random.choice(games)
    description = f"You played a round of {game}."
    return ActionResult(
        description=description,
        stat_deltas=deltas,
        time_passed=15,
        animation="dance",
        mood_hint="ecstatic",
    )


def _rest(state: PetState) -> ActionResult:
    return ActionResult(
        description="A gentle lullaby settles the room as you both nap.",
        stat_deltas={"energy": 12, "health": 4},
        time_passed=20,
        animation="sleep",
        mood_hint="content",
    )


def _talk(state: PetState) -> ActionResult:
    topics = [
        "the adventures yet to come",
        "favorite cozy corners",
        "dreams about floating lanterns",
        "memories of the forest spirits",
    ]
    topic = random.choice(topics)
    narrative = f"You chat about {topic}. {state.name}'s eyes glimmer."
    return ActionResult(
        description=narrative,
        stat_deltas={"social": 18, "happiness": 8},
        time_passed=8,
        animation="chat",
        mood_hint="content",
    )


def _medicine(state: PetState) -> ActionResult:
    return ActionResult(
        description="A soothing herbal remedy restores balance.",
        stat_deltas={"health": 20, "nourishment": -4},
        time_passed=12,
        animation="glow",
        mood_hint="concerned",
    )


def _discipline(state: PetState) -> ActionResult:
    return ActionResult(
        description="You set gentle boundaries with calm reassurance.",
        stat_deltas={"social": -4, "happiness": -6, "health": 2},
        time_passed=5,
        animation="pulse",
        mood_hint="concerned",
    )


def _wait(state: PetState) -> ActionResult:
    return ActionResult(
        description="You observe quietly, letting time flow.",
        stat_deltas={need: -2 for need in NEED_NAMES},
        time_passed=10,
        animation="idle",
        mood_hint=None,
    )


ACTIONS: Dict[str, Action] = {
    "meal": Action(
        key="meal",
        title="Shared Meal",
        summary="Serve a hearty meal with vibrant flavors.",
        duration=12,
        handler=_meal,
    ),
    "snack": Action(
        key="snack",
        title="Treat Time",
        summary="Offer a playful snack or drink.",
        duration=6,
        handler=_snack,
    ),
    "clean": Action(
        key="clean",
        title="Refresh Habitat",
        summary="Clean the environment and fluff the pet's fur.",
        duration=10,
        handler=_clean,
    ),
    "play": Action(
        key="play",
        title="Play Session",
        summary="Engage in an energetic mini-game.",
        duration=15,
        handler=_play,
    ),
    "rest": Action(
        key="rest",
        title="Rest & Recuperate",
        summary="Take a restorative nap together.",
        duration=20,
        handler=_rest,
    ),
    "talk": Action(
        key="talk",
        title="Heartfelt Chat",
        summary="Hold a meaningful conversation.",
        duration=8,
        handler=_talk,
    ),
    "medicine": Action(
        key="medicine",
        title="Herbal Remedy",
        summary="Administer a gentle tonic for better health.",
        duration=12,
        handler=_medicine,
    ),
    "discipline": Action(
        key="discipline",
        title="Set Boundaries",
        summary="Offer calm guidance to correct mischief.",
        duration=5,
        handler=_discipline,
    ),
    "wait": Action(
        key="wait",
        title="Observe",
        summary="Take no direct action and watch the habitat.",
        duration=10,
        handler=_wait,
    ),
}


def perform(action_key: str, state: PetState) -> ActionResult:
    """Execute an action by key."""

    if action_key not in ACTIONS:
        raise KeyError(f"Unknown action '{action_key}'.")
    result = ACTIONS[action_key].handler(state)
    state.apply_deltas(result.stat_deltas, result.description)
    return result


__all__ = ["Action", "ActionResult", "ACTIONS", "perform"]
