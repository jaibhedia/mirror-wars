# Mirror Wars — Modular Game Prototype

Mirror Wars is a small, modular JavaScript prototype of a social-deception party game. The project demonstrates a clean separation of concerns using ES modules, simple state management, and a responsive UI built with plain HTML/CSS.

This repository is intended as a minimal, maintainable starting point for building a browser-based multiplayer or local-play game.

## Highlights

- Modular architecture with single-responsibility modules
- Plain ES module entry point (no bundler required)
- Theming with CSS variables and light/dark support
- Lightweight, framework-agnostic UI for rapid experimentation

## Quick Start

1. **Install (no build step required)**
   - Clone the repository:
     ```bash
     git clone https://www.github.cpm/jaibhedia/mirrorwars
     ```
   - Open locally with a static server:
     ```bash
     npm run dev
     # or
     python3 -m http.server 8000
     ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

## Project structure

- `index.html` — App shell and screens
- `style.css` — Design tokens, layout and component styles (light/dark)
- `js/app.js` — Application entry point (ES module)
- `js/modules/` — Core game modules
  - `config.js` — Constants and enums
  - `gameState.js` — Centralized state & persistence
  - `gameLogic.js` — Rules and role assignment
  - `timer.js` — Reusable timer utilities
  - `eventHandlers.js` — UI bindings & events
  - `roomManager.js` — Room lifecycle and player management
  - `uiUpdater.js` — DOM-driven state updates
  - `patternHandler.js` — Pattern creation/validation
- `js/utils/` — Utility helpers
  - `dom.js` — DOM caching/manipulation helpers
  - `helpers.js` — Pure utilities (validation, formatting)

## Module responsibilities (concise)

- **`config.js`**: All static configuration and enums.
- **`gameState.js`**: Single source of truth; exposes get/update/save operations.
- **`gameLogic.js`**: Role assignment, win/lose detection, and core mechanics.
- **`timer.js`**: Countdown timers with callback hooks for UI and logic.
- **`eventHandlers.js`**: Attach listeners, normalize user input, trigger state changes.
- **`roomManager.js`**: Create/join rooms, maintain player lists.
- **`uiUpdater.js`**: Map state to DOM; small helper functions to render screens.
- **`patternHandler.js`**: Pattern sequence capture and verification.
- **`dom.js` / `helpers.js`**: Lightweight helpers used across modules.

## Running and development

- Serve static files (see Quick Start).
- Files are ES modules — open `index.html` via a server; direct `file://` access will fail due to module imports.
- No build step necessary for prototyping. Add bundler/tooling as needed for production.

## Testing & linting

- Minimal scripts exist in `package.json` as placeholders:
  - `npm run dev` — start a static server
  - `npm run lint` / `npm run test` — placeholders to integrate tooling later
- Add unit tests around modules (`gameLogic`, `patternHandler`, `helpers`) when expanding this prototype.

## Design & styles

- `style.css` contains a design token system using CSS variables. It supports:
  - Light / dark color schemes via `prefers-color-scheme` and `data-color-scheme` attributes
  - Reusable components (`btn`, `card`, `modal`, `grid`)
  - Responsive layout with utility classes

## Contributing

- Keep modules focused and side-effect free where practical.
- Add unit tests for logic-heavy modules and keep UI updates centralized in `uiUpdater.js`.
- When introducing new features, add documentation to README and update module responsibilities.

## Roadmap / ideas

- Add real-time multiplayer via WebSockets
- Persist game history & match replays
- Add accessibility improvements and keyboard-first controls
- Add CI with linting and unit tests
- Replace ad-hoc state persistence with a formal store for complex flows

## License

This project is provided under the MIT License. See LICENSE for details.

## Contact

For questions or collaboration, open an issue or submit a PR in the repository.



## Key Improvements

1. **ES6 Modules** - Clean import/export syntax
2. **Singleton Pattern** - Shared state management
3. **Dependency Injection** - Loose coupling between modules
4. **Error Boundaries** - Graceful error handling
5. **Performance** - DOM element caching and efficient updates
6. **Developer Experience** - Clear structure and documentation

## Migration from Monolithic Code

The modular structure maintains all existing functionality while providing:
- Better code organization
- Easier testing and debugging
- More maintainable codebase
- Clearer separation of concerns
- Improved scalability for future features

## Testing Strategy

Each module can be tested independently:
- Unit tests for utility functions
- Integration tests for module interactions
- E2E tests for complete game flows

## Future Enhancements

With this modular architecture, you can easily add:
- New game modes
- Different UI themes
- Multiplayer networking
- AI players
- Analytics tracking
- Performance monitoring
