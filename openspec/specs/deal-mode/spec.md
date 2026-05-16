# deal-mode Specification

## Purpose

TBD - created by archiving change 'kick-and-deal-mode'. Update Purpose after archive.

## Requirements

### Requirement: Host can enable dealing mode before starting the game

The system SHALL provide a dealing mode toggle in the lobby (visible only to the host). When dealing mode is enabled and the game starts, role assignment SHALL complete normally but the game phase SHALL remain at ROLE_REVEAL and SHALL NOT advance to TEAM_PROPOSAL.

#### Scenario: Host enables dealing mode

- **WHEN** the host checks the dealing mode checkbox and sends `START_GAME` with `dealingMode: true`
- **THEN** the server assigns roles, sets `room.dealingMode = true`, and broadcasts `GAME_STATE` with `phase: 'ROLE_REVEAL'` and `dealingMode: true`

#### Scenario: Game does not advance past role reveal in dealing mode

- **WHEN** `room.dealingMode` is `true` after role assignment
- **THEN** the game phase remains `ROLE_REVEAL` indefinitely; no `TEAM_PROPOSAL` phase is entered

#### Scenario: Normal game unaffected when dealing mode is off

- **WHEN** the host sends `START_GAME` without `dealingMode` or with `dealingMode: false`
- **THEN** behavior is identical to the existing game flow (roles are assigned and the game advances to `TEAM_PROPOSAL` after all players acknowledge)


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

---
### Requirement: Players see a flippable card in dealing mode

The system SHALL display a face-down card to each player when `phase` is `ROLE_REVEAL` and `dealingMode` is `true`. Tapping the card SHALL reveal the player's role and faction visibility information. Tapping again SHALL hide the card. The system SHALL NOT display an "acknowledge role" button in dealing mode.

#### Scenario: Card starts face-down

- **WHEN** a player's client receives `GAME_STATE` with `phase: 'ROLE_REVEAL'` and `dealingMode: true`
- **THEN** the UI displays a face-down card graphic with no role information visible

#### Scenario: Tap to reveal role

- **WHEN** the player taps the face-down card
- **THEN** the card flips to show the player's role name and faction information (knownEvil or suspects, same as the existing role reveal screen)

#### Scenario: Tap again to hide

- **WHEN** the player taps the face-up card
- **THEN** the card returns to the face-down state

#### Scenario: No acknowledge button in dealing mode

- **WHEN** `dealingMode` is `true`
- **THEN** the "我已知曉我的角色" (acknowledge) button is NOT rendered; the ROLE_REVEAL screen persists without any action button

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