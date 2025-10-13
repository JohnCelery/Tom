"""Terminal rendering for the Tomagotchi game."""
from __future__ import annotations

import shutil
import sys
import time
from typing import Iterable, Optional

from ..core.actions import ActionResult
from ..core.state import NEED_NAMES, PetState
from ..core.scheduler import TimeSnapshot
from ..graphics.sprites import get_sprite
from .widgets import bullet_list, status_bar, wrap_text_block

CLEAR = "\033[2J\033[H"


class Renderer:
    """Responsible for drawing the habitat and UI panels."""

    def __init__(self) -> None:
        self.width = shutil.get_terminal_size((100, 40)).columns

    def clear(self) -> None:
        sys.stdout.write(CLEAR)
        sys.stdout.flush()

    def render(
        self,
        state: PetState,
        time_info: TimeSnapshot,
        action_result: Optional[ActionResult],
        events: Iterable[str],
    ) -> None:
        self.clear()
        self._render_header(state, time_info)
        self._render_body(state, action_result)
        self._render_events(action_result, events)
        self._render_history(state)

    def _render_header(self, state: PetState, time_info: TimeSnapshot) -> None:
        title = f"Tomagotchi Habitat — {time_info.period}"
        clock = f"Day {time_info.total_minutes // 1440 + 1:02d} " \
            f"{time_info.hour:02d}:{time_info.minute:02d}"
        info = f"Stage: {state.stage.value.title()} | Mood: {state.mood.title()}"
        print(title)
        print(clock)
        print(info)
        print("═" * min(self.width, 80))

    def _render_body(
        self, state: PetState, action_result: Optional[ActionResult]
    ) -> None:
        sprite = get_sprite(state.stage.value, state.mood)
        sprite_lines = [line.rstrip() for line in sprite.splitlines() if line.strip()]

        status_lines = [status_bar(name.title(), state.stats[name]) for name in NEED_NAMES]
        max_lines = max(len(sprite_lines), len(status_lines))
        sprite_lines.extend([""] * (max_lines - len(sprite_lines)))
        status_lines.extend([""] * (max_lines - len(status_lines)))

        for left, right in zip(sprite_lines, status_lines):
            print(f"{left:<42}    {right}")

        if action_result:
            self._render_animation(action_result.animation)

    def _render_events(
        self,
        action_result: Optional[ActionResult],
        events: Iterable[str],
    ) -> None:
        print("\nRecent interaction:")
        if action_result:
            print(wrap_text_block(action_result.description))
        else:
            print("Your companion awaits your guidance.")

        event_list = list(events)
        if action_result and action_result.mood_hint:
            event_list.insert(0, f"Mood shift: {action_result.mood_hint.title()} vibes linger.")
        if event_list:
            print("\nAtmosphere:")
            print(bullet_list(event_list))

    def _render_history(self, state: PetState) -> None:
        print("\nJournal excerpts:")
        if not state.history:
            print("  The journal is ready for new stories.")
            return
        for entry in state.history[-3:]:
            print(f"  {entry}")

    def _render_animation(self, token: str) -> None:
        frames = {
            "hearts": ["  ♥   ♥", " ♥ ♥ ♥", "  ♥   ♥"],
            "sparkles": [" ✨    ✨", "   ✨   ", " ✨    ✨"],
            "bubbles": [" ○   ○", "   ○  ", " ○   ○"],
            "dance": [r" \(•ᴗ•)/", r"  <•ᴗ< ", r" >ᴗ•> "],
            "sleep": ["  z  ", " z z ", "z z z"],
            "chat": [" 『✧』", "  ✧  ", "『✧』"],
            "glow": ["  ⋆  ", " ⋆⋆⋆", "  ⋆  "],
            "pulse": ["  ░█░  ", "  ███  ", "  ░█░  "],
            "idle": ["  ～  ", " ～   ", "   ～ "],
        }
        cycle = frames.get(token)
        if not cycle:
            return
        print("\n")
        for frame in cycle:
            sys.stdout.write(f"\r{frame}")
            sys.stdout.flush()
            time.sleep(0.08)
        sys.stdout.write("\r     \r")
        sys.stdout.flush()


__all__ = ["Renderer"]
