# Repository Guidelines

## Coding Style
- Follow PEP 8 with a soft 88-character line limit.
- Use type hints and dataclasses where appropriate.
- Avoid external dependencies; use only the Python standard library.

## Testing
- Prefer the built-in `unittest` framework.
- When you add logic-heavy modules, include focused unit tests.

## Documentation
- Keep module and function docstrings concise but informative.
- Update the README when user-facing behavior changes.

## Pull Requests
- Summarize major gameplay or UX changes.
- List tests executed.

## Assets
- Store terminal art and UI assets in `tomagotchi/graphics/`.
- Use Unicode-friendly designs sized to fit within 24 rows by 40 columns.
