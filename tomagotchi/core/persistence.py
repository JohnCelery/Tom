"""Persistence helpers for saving and loading game state."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

from .state import PetState

SAVE_PATH = Path("data/savegame.json")


def load_game(path: Path = SAVE_PATH) -> Optional[PetState]:
    """Load a saved game if present."""

    return PetState.load(path)


def save_game(state: PetState, path: Path = SAVE_PATH) -> None:
    """Persist the game state to disk."""

    state.save(path)


def autosave(state: PetState, path: Path = SAVE_PATH) -> None:
    """Write an autosave without spamming history messages."""

    state.save(path)


__all__ = ["load_game", "save_game", "autosave", "SAVE_PATH"]
