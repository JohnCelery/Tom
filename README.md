# Tomagotchi

Tomagotchi is a zero-dependency virtual companion that runs entirely in the
browser. The app is built with plain HTML, CSS, and JavaScript so it can be
hosted directly from GitHub Pages or any other static file host—no build tools
or server processes required.

## Live Hosting

1. Commit the repository to GitHub (or fork it).
2. Enable GitHub Pages for the repository and set the source to the `main`
   branch ("Deploy from a branch" → `/(root)`).
3. Visit the published URL and start caring for your pet.

You can also open `index.html` locally in any modern browser; progress is stored
using `localStorage` and stays on your device.

## Features

- **Expressive lifecycle** – Guide your companion from egg to adult with stages
  that evolve as you care for them.
- **Need management** – Balance nourishment, energy, cleanliness, happiness,
  health, and social needs as time passes.
- **Ambient personality** – Track mood shifts, traits, and a rolling history of
  shared moments.
- **Action rich** – Prepare meals, play, rest, chat, and more with stat effects
  tuned for strategic care.
- **Autosave** – Progress is written to `localStorage` automatically and on
  page exit.

## Project Structure

```
.
├── index.html   # Application markup and entry point
├── script.js    # Game loop, persistence, and interaction logic
└── styles.css   # Layout and visual design
```

No external dependencies, tooling, or binary assets are required. Every asset is
text-based so the project remains lightweight and Git-friendly.

## Development Notes

- Modify `script.js` to tweak actions, stat decay, or lifecycle thresholds.
- Styles live in `styles.css`; the design embraces modern CSS features without
  any frameworks.
- The application intentionally runs without bundlers or package managers to
  keep deployment as simple as pushing static files.

## License

Released under the MIT License. Adapt as desired for your own companions.
