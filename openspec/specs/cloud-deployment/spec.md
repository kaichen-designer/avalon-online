## Requirements

### Requirement: WebSocket connection uses protocol matching the page origin

The client SHALL construct the WebSocket URL using `wss://` when the page is served over HTTPS and `ws://` when served over HTTP. The URL host SHALL be derived from `location.host` to automatically match whatever domain or IP address the player used to access the page.

#### Scenario: Connecting over HTTPS (cloud deployment)

- **WHEN** a player opens the game page via an HTTPS URL (e.g., `https://avalon.up.railway.app/game.html`)
- **THEN** the client SHALL open a WebSocket connection to `wss://avalon.up.railway.app`

#### Scenario: Connecting over HTTP (local development)

- **WHEN** a player opens the game page via an HTTP URL (e.g., `http://localhost:3000/game.html`)
- **THEN** the client SHALL open a WebSocket connection to `ws://localhost:3000`

##### Example: protocol selection

| Page URL | Expected WebSocket URL |
|----------|------------------------|
| `https://avalon.up.railway.app/game.html` | `wss://avalon.up.railway.app` |
| `http://localhost:3000/game.html` | `ws://localhost:3000` |
| `http://192.168.1.5:3000/game.html` | `ws://192.168.1.5:3000` |


<!-- @trace
source: railway-deployment
updated: 2026-05-16
code:
  - client/js/client.js
  - server/index.js
  - server/gameManager.js
  - server/gameEngine.js
  - client/js/ui.js
  - client/css/style.css
-->

---
### Requirement: Server declares deployment configuration for Railway

The repository SHALL contain a `railway.json` file at the project root that declares the start command and restart policy. This file SHALL be committed to version control so Railway can deploy the application without manual configuration.

#### Scenario: Railway reads deployment config

- **WHEN** Railway builds and deploys the repository
- **THEN** the platform SHALL use `node server/index.js` as the start command
- **THEN** the platform SHALL restart the process automatically on failure


<!-- @trace
source: railway-deployment
updated: 2026-05-16
code:
  - client/js/client.js
  - server/index.js
  - server/gameManager.js
  - server/gameEngine.js
  - client/js/ui.js
  - client/css/style.css
-->

---
### Requirement: Repository excludes build artifacts from version control

The repository SHALL contain a `.gitignore` file at the project root that excludes `node_modules/` and any OS-generated files. This ensures the repository can be pushed to GitHub for Railway to clone and install dependencies cleanly.

#### Scenario: Clean push to GitHub

- **WHEN** the developer runs `git push` after committing all game files
- **THEN** `node_modules/` SHALL NOT be included in the pushed commit

<!-- @trace
source: railway-deployment
updated: 2026-05-16
code:
  - client/js/client.js
  - server/index.js
  - server/gameManager.js
  - server/gameEngine.js
  - client/js/ui.js
  - client/css/style.css
-->