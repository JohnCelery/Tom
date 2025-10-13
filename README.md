# Tomagotchi

A zero-dependency, terminal-native virtual companion inspired by classic digital pets but crafted with lush Unicode art, layered ambience, and meaningful interactions. Everything is implemented with the Python standard library so the game runs anywhere Python 3.10+ is available.

## Features
- **Expressive lifecycle** – Guide your companion from egg to adult with evolving personalities and cosmetic flourishes.
- **Deep care systems** – Balance nourishment, energy, cleanliness, happiness, health, and social needs while responding to dynamic events.
- **High-fidelity terminal art** – Layered Unicode sprites, animated overlays, and atmospheric text keep the habitat feeling alive without external dependencies.
- **Rich interaction suite** – Share meals, play mini-games, chat, tidy the habitat, and more with contextual feedback for each action.
- **Persistent world** – Autosave ensures your pet remembers every milestone and journal entry.

## Getting Started
1. Ensure Python 3.10 or newer is installed.
2. Clone the repository and navigate to it in your terminal.
3. Launch the game:
   ```bash
   python -m tomagotchi.game
   ```
4. Follow the on-screen prompts to name your companion and begin caring for them.

The game stores progress in `data/savegame.json`. Delete this file to start a fresh adventure.

## Controls & Loop
During play you can type the key of any action to perform it:
- `meal` – Serve a vibrant shared meal.
- `snack` – Offer a quick treat.
- `play` – Start a playful mini-session.
- `clean` – Refresh the habitat.
- `rest` – Slow down and recuperate.
- `talk` – Share heartfelt conversation.
- `medicine` – Administer a soothing remedy.
- `discipline` – Set gentle boundaries.
- `wait` – Observe quietly as time passes.

Special commands:
- `help` – Show the action reference sheet.
- `save` – Manually write progress to disk.
- `quit` – Exit gracefully (progress is saved automatically).

## Architecture Overview
```
tomagotchi/
├── game.py              # Entry point and main loop
├── core/
│   ├── actions.py       # Action registry and stat effects
│   ├── events.py        # Event manager reacting to state
│   ├── persistence.py   # Save/load helpers
│   ├── scheduler.py     # Time progression utilities
│   └── state.py         # Pet state, mood, and lifecycle logic
├── ui/
│   ├── inputs.py        # Command prompt helpers
│   ├── renderer.py      # Terminal renderer and animations
│   └── widgets.py       # Reusable UI components
├── graphics/
│   └── sprites.py       # Unicode sprite sheets
└── tests/
    └── test_state.py    # Core state unit tests
```

## Development
- The project intentionally avoids third-party dependencies. Keep future contributions standard-library friendly unless requirements change.
- Follow the guidelines documented in `AGENTS.md` for code style, testing, and asset creation.
- Run the unit test suite with:
  ```bash
  python -m unittest discover -s tests -p 'test_*.py'
  ```

## Roadmap Ideas
- Additional mini-games with reaction or rhythm mechanics.
- Expanded sprite library with seasonal themes and idle motion variants.
- Journal timeline export and achievement showcase.
- Accessibility toggles for reduced animations and monochrome mode.

## License
Released under the MIT License. See `LICENSE` if provided, or adapt as needed for your project.
