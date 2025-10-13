"""Reusable UI widgets for the terminal interface."""
from __future__ import annotations

from textwrap import wrap
from typing import Iterable


BAR_WIDTH = 22


def status_bar(label: str, value: float) -> str:
    """Return a unicode progress bar for the given stat."""

    value = max(0.0, min(100.0, value))
    filled = int(round((value / 100.0) * BAR_WIDTH))
    bar = "█" * filled + "░" * (BAR_WIDTH - filled)
    return f"{label:<12} {bar} {int(value):3d}%"


def wrap_text_block(text: str, width: int = 60) -> str:
    lines = wrap(text, width=width)
    return "\n".join(lines)


def bullet_list(items: Iterable[str], prefix: str = "• ") -> str:
    return "\n".join(f"{prefix}{item}" for item in items)


__all__ = ["status_bar", "wrap_text_block", "bullet_list"]
