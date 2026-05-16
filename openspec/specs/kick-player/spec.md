# kick-player Specification

## Purpose

TBD - created by archiving change 'kick-and-deal-mode'. Update Purpose after archive.

## Requirements

### Requirement: Host can kick players from lobby

The system SHALL allow the host to remove any other player from the room while the room is in the LOBBY phase. The removed player SHALL receive a KICKED notification and be redirected to the home page.

#### Scenario: Host kicks a player

- **WHEN** the host sends `KICK_PLAYER` with a valid `targetId` in LOBBY phase
- **THEN** the target player is removed from the room, receives a `KICKED` message, and all remaining players receive an updated `LOBBY_STATE`

#### Scenario: Non-host attempts to kick

- **WHEN** a non-host player sends `KICK_PLAYER`
- **THEN** the server responds with `ERROR { code: 'NOT_HOST' }` and the room state is unchanged

#### Scenario: Kick attempted during active game

- **WHEN** the host sends `KICK_PLAYER` while `room.phase` is not `LOBBY`
- **THEN** the server responds with `ERROR { code: 'NOT_IN_LOBBY' }` and the room state is unchanged

#### Scenario: Kicked player UI response

- **WHEN** the client receives a `KICKED` message
- **THEN** the client clears `sessionStorage` (playerId, roomCode, isHost), displays an alert "你已被房主踢出", and navigates to `index.html`

<!-- @trace
source: kick-and-deal-mode
updated: 2026-05-16
code:
  - server/index.js
  - client/css/style.css
  - client/js/ui.js
  - client/js/client.js
  - server/gameManager.js
  - server/gameEngine.js
-->