"""Input helpers for the Tomagotchi game."""
from __future__ import annotations

from ..core.actions import ACTIONS

PROMPT = "\nChoose an action (type key, 'help', 'save', or 'quit'): "


def format_actions() -> str:
    lines = ["Available actions:"]
    for key, action in ACTIONS.items():
        lines.append(f"  {key:<10} {action.title} — {action.summary}")
    return "\n".join(lines)


def prompt_for_action() -> str:
    while True:
        choice = input(PROMPT).strip().lower()
        if choice in {"help", "save", "quit"}:
            return choice
        if choice in ACTIONS:
            return choice
        print("Unknown command. Type 'help' to see your options.")


__all__ = ["prompt_for_action", "format_actions"]
