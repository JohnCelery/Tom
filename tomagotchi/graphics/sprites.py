"""Unicode sprite sheets for the pet across life stages and moods."""
from __future__ import annotations

from typing import Dict, Tuple

SpriteKey = Tuple[str, str]


SPRITES: Dict[SpriteKey, str] = {
    ("egg", "content"): r"""
          ╭────────╮
          │  ◠◡◠  │
          │  ╲╳╱  │
          │  ◡◠◡  │
      ╭───╰────────╯───╮
      │   shimmering   │
      │    egg shell   │
      ╰────────────────╯
    """,
    ("hatchling", "content"): r"""
        ╭──────────────────╮
        │      ／❀＼       │
        │  (＾・ﻌ・＾)    │
        │   ⎛  ╳  ⎞       │
        │    ╰──╯        │
        │   fluttery      │
        │   frills sway   │
        ╰──────────────────╯
    """,
    ("hatchling", "ecstatic"): r"""
        ╭──────────────────╮
        │    ✧  ／❀＼ ✧   │
        │  (＾ᗨ＾✿)      │
        │   ⎛  ╳  ⎞       │
        │    ╰╮╭╯        │
        │  twirling tails │
        │  sparkle wildly │
        ╰──────────────────╯
    """,
    ("child", "content"): r"""
      ╭────────────────────╮
      │   ˚✧   ╱^⌓^╲   ✧˚ │
      │      (  •ᴗ•  )     │
      │      ╰──┬──╯      │
      │    flutter wings   │
      │   glow with hues   │
      ╰────────────────────╯
    """,
    ("child", "concerned"): r"""
      ╭────────────────────╮
      │     ╱•︵•╲        │
      │    (  •︵•  )      │
      │     ╰──┬──╯       │
      │   droopy feathers  │
      │  await reassurance │
      ╰────────────────────╯
    """,
    ("teen", "content"): r"""
      ╭──────────────────────╮
      │   ✦  ╭───╮  ✦        │
      │      (•⌣• )✧        │
      │  ⎛╭───┴───╮⎞        │
      │  ╰╯  ╳╳  ╰╯        │
      │ flowing ribbons arc │
      │  across the screen  │
      ╰──────────────────────╯
    """,
    ("teen", "ecstatic"): r"""
      ╭──────────────────────╮
      │  ✧✧╭───────╮✧✧     │
      │   (☆≧∀≦☆)       │
      │ ⎛╭──╮   ╭──╮⎞      │
      │ ╰╯ ╳╳   ╳╳ ╰╯      │
      │ aurora trails swirl │
      │  with vivid energy │
      ╰──────────────────────╯
    """,
    ("adult", "content"): r"""
      ╭────────────────────────╮
      │    ╭──────╮ ╭──────╮   │
      │   ( ˘◡˘  ) (  ˘◡˘ )  │
      │    ╰──┬──╯ ╰──┬──╯   │
      │   ethereal wings fan │
      │  across shimmering air│
      ╰────────────────────────╯
    """,
    ("adult", "ecstatic"): r"""
      ╭────────────────────────╮
      │  ✧╭──────╮✧╭──────╮✧ │
      │   ( ☆◠‿◠) (◠‿☆ )  │
      │    ╰──┬──╯ ╰──┬──╯   │
      │ crystalline petals fly│
      │  in radiant spirals  │
      ╰────────────────────────╯
    """,
    ("adult", "concerned"): r"""
      ╭────────────────────────╮
      │    ╭──────╮ ╭──────╮   │
      │   ( ˘︵˘  ) (  ˘︵˘ )  │
      │    ╰──┬──╯ ╰──┬──╯   │
      │  calm lumens dim softly│
      │ seeking tender words  │
      ╰────────────────────────╯
    """,
}


def get_sprite(stage: str, mood: str) -> str:
    """Return the sprite matching the given stage and mood with fallbacks."""

    key = (stage, mood)
    if key in SPRITES:
        return SPRITES[key]
    fallback = (stage, "content")
    if fallback in SPRITES:
        return SPRITES[fallback]
    return SPRITES[("egg", "content")]


__all__ = ["SPRITES", "get_sprite"]
