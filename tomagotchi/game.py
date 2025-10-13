"""Entry point for the Tomagotchi experience."""
from __future__ import annotations

import sys
import time
from pathlib import Path
from typing import Optional

from .core import actions
from .core.events import EventManager
from .core.persistence import autosave, load_game, save_game, SAVE_PATH
from .core.scheduler import TimeManager
from .core.state import PetState
from .ui.inputs import format_actions, prompt_for_action
from .ui.renderer import Renderer


def _greet_player() -> None:
    print("Welcome to Tomagotchi — a cozy virtual companion adventure!\n")


def _prompt_name(default: str) -> str:
    name = input(f"What shall we call your companion? (default: {default})\n> ").strip()
    return name or default


def start_new_game(save_path: Path = SAVE_PATH) -> PetState:
    _greet_player()
    name = _prompt_name("Nova")
    state = PetState(name=name)
    state.history.append("The journey together begins.")
    save_game(state, save_path)
    return state


def load_or_create(save_path: Path = SAVE_PATH) -> PetState:
    existing = load_game(save_path)
    if existing:
        print(f"Loaded companion {existing.name}. Welcome back!\n")
        return existing
    return start_new_game(save_path)


def main() -> None:
    state = load_or_create()
    renderer = Renderer()
    time_manager = TimeManager()
    events: list[str] = []
    last_result: Optional[actions.ActionResult] = None
    event_manager = EventManager()

    try:
        while True:
            renderer.render(state, time_manager.snapshot, last_result, events)
            command = prompt_for_action()

            if command == "help":
                print("\n" + format_actions())
                input("\nPress Enter to continue...")
                continue
            if command == "save":
                save_game(state)
                print("Game saved.\n")
                time.sleep(0.6)
                continue
            if command == "quit":
                save_game(state)
                print("Farewell for now. Your companion will dream of you!")
                break

            try:
                last_result = actions.perform(command, state)
            except KeyError:
                last_result = None
                continue

            events = []
            events.extend(time_manager.advance(last_result.time_passed, state))
            events.extend(event_manager.check(state))
            autosave(state)
            time.sleep(0.4)
    except KeyboardInterrupt:
        print("\nThanks for playing! Your progress has been saved.")
        save_game(state)
        sys.exit(0)


if __name__ == "__main__":
    main()
