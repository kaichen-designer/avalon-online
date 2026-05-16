## ADDED Requirements

### Requirement: Game phases
The game SHALL progress through a defined sequence of phases. Each phase MUST have a clear entry condition and a set of valid transitions. The server MUST broadcast the current phase to all players whenever a phase transition occurs.

#### Scenario: Phase sequence follows game flow
- **WHEN** the game progresses normally
- **THEN** phases occur in the order: LOBBY → ROLE_REVEAL → TEAM_PROPOSAL → VOTE → MISSION → (repeat TEAM_PROPOSAL for next round OR ASSASSINATION) → GAME_OVER

##### Example: Phase transition map
| Current Phase | Trigger | Next Phase |
|---|---|---|
| LOBBY | Host starts game | ROLE_REVEAL |
| ROLE_REVEAL | All players acknowledge | TEAM_PROPOSAL |
| TEAM_PROPOSAL | Leader submits team | VOTE |
| VOTE | All players voted, approved | MISSION |
| VOTE | All players voted, rejected | TEAM_PROPOSAL (leader rotates) |
| VOTE | 5th consecutive rejection | GAME_OVER |
| MISSION | All cards submitted, neither team at 3 wins | TEAM_PROPOSAL (next round) |
| MISSION | Good team reaches 3 wins | ASSASSINATION |
| MISSION | Evil team reaches 3 wins | GAME_OVER |
| ASSASSINATION | Assassin submits target | GAME_OVER |


<!-- @trace
source: avalon-online-game
updated: 2026-05-16
code:
  - client/js/ui.js
  - server/gameManager.js
  - client/css/style.css
  - server/gameEngine.js
  - client/js/client.js
  - server/index.js
-->

### Requirement: GAME_STATE broadcast on every phase transition
The server SHALL broadcast a GAME_STATE message to all players on every phase transition. The GAME_STATE message MUST contain the current phase, current round number, current leader ID, mission score (good wins and evil wins), and the consecutive rejection count. Secret information (role assignments, submitted cards) MUST NOT be included.

#### Scenario: GAME_STATE broadcast content
- **WHEN** any phase transition occurs
- **THEN** all players receive `{ type: "GAME_STATE", phase: "<phase>", round: N, leader: "<playerId>", goodWins: N, evilWins: N, voteTrack: N, players: [{ id, name, isConnected }] }`


<!-- @trace
source: avalon-online-game
updated: 2026-05-16
code:
  - client/js/ui.js
  - server/gameManager.js
  - client/css/style.css
  - server/gameEngine.js
  - client/js/client.js
  - server/index.js
-->

### Requirement: Round tracking
The game SHALL track the current round number (1-5). Each round consists of one successful mission execution. The round number SHALL increment after each mission completes (regardless of success or failure). The game MUST NOT allow more than 5 rounds.

#### Scenario: Round increments after mission
- **WHEN** a mission result is calculated
- **THEN** the round counter increments by 1 before transitioning to TEAM_PROPOSAL

#### Scenario: Round five is the final round
- **WHEN** round 5 completes and neither team has won 3 missions
- **THEN** this state is impossible (with 5 rounds and needing 3 wins, a winner is always determined by round 5)


<!-- @trace
source: avalon-online-game
updated: 2026-05-16
code:
  - client/js/ui.js
  - server/gameManager.js
  - client/css/style.css
  - server/gameEngine.js
  - client/js/client.js
  - server/index.js
-->

### Requirement: Win condition summary
The game SHALL end immediately when any of the following conditions are met, with the appropriate winner declared:
- Good team wins 3 missions → transition to ASSASSINATION (not immediate win)
- Evil team wins 3 missions → evil wins immediately
- 5 consecutive vote rejections → evil wins immediately
- Assassin correctly identifies Merlin → evil wins
- Assassin incorrectly identifies Merlin → good wins

#### Scenario: Evil wins via mission majority
- **WHEN** evil team's mission win count reaches 3
- **THEN** server broadcasts GAME_OVER with `winner: "evil"` immediately without entering ASSASSINATION

#### Scenario: Good wins only after failed assassination
- **WHEN** good team wins 3 missions
- **THEN** game does NOT broadcast GAME_OVER yet; game enters ASSASSINATION phase first

## Requirements


<!-- @trace
source: avalon-online-game
updated: 2026-05-16
code:
  - client/js/ui.js
  - server/gameManager.js
  - client/css/style.css
  - server/gameEngine.js
  - client/js/client.js
  - server/index.js
-->

### Requirement: Game phases
The game SHALL progress through a defined sequence of phases. Each phase MUST have a clear entry condition and a set of valid transitions. The server MUST broadcast the current phase to all players whenever a phase transition occurs.

#### Scenario: Phase sequence follows game flow
- **WHEN** the game progresses normally
- **THEN** phases occur in the order: LOBBY → ROLE_REVEAL → TEAM_PROPOSAL → VOTE → MISSION → (repeat TEAM_PROPOSAL for next round OR ASSASSINATION) → GAME_OVER

##### Example: Phase transition map
| Current Phase | Trigger | Next Phase |
|---|---|---|
| LOBBY | Host starts game | ROLE_REVEAL |
| ROLE_REVEAL | All players acknowledge | TEAM_PROPOSAL |
| TEAM_PROPOSAL | Leader submits team | VOTE |
| VOTE | All players voted, approved | MISSION |
| VOTE | All players voted, rejected | TEAM_PROPOSAL (leader rotates) |
| VOTE | 5th consecutive rejection | GAME_OVER |
| MISSION | All cards submitted, neither team at 3 wins | TEAM_PROPOSAL (next round) |
| MISSION | Good team reaches 3 wins | ASSASSINATION |
| MISSION | Evil team reaches 3 wins | GAME_OVER |
| ASSASSINATION | Assassin submits target | GAME_OVER |

---
### Requirement: GAME_STATE broadcast on every phase transition
The server SHALL broadcast a GAME_STATE message to all players on every phase transition. The GAME_STATE message MUST contain the current phase, current round number, current leader ID, mission score (good wins and evil wins), and the consecutive rejection count. Secret information (role assignments, submitted cards) MUST NOT be included.

#### Scenario: GAME_STATE broadcast content
- **WHEN** any phase transition occurs
- **THEN** all players receive `{ type: "GAME_STATE", phase: "<phase>", round: N, leader: "<playerId>", goodWins: N, evilWins: N, voteTrack: N, players: [{ id, name, isConnected }] }`

---
### Requirement: Round tracking
The game SHALL track the current round number (1-5). Each round consists of one successful mission execution. The round number SHALL increment after each mission completes (regardless of success or failure). The game MUST NOT allow more than 5 rounds.

#### Scenario: Round increments after mission
- **WHEN** a mission result is calculated
- **THEN** the round counter increments by 1 before transitioning to TEAM_PROPOSAL

#### Scenario: Round five is the final round
- **WHEN** round 5 completes and neither team has won 3 missions
- **THEN** this state is impossible (with 5 rounds and needing 3 wins, a winner is always determined by round 5)

---
### Requirement: Win condition summary
The game SHALL end immediately when any of the following conditions are met, with the appropriate winner declared:
- Good team wins 3 missions → transition to ASSASSINATION (not immediate win)
- Evil team wins 3 missions → evil wins immediately
- 5 consecutive vote rejections → evil wins immediately
- Assassin correctly identifies Merlin → evil wins
- Assassin incorrectly identifies Merlin → good wins

#### Scenario: Evil wins via mission majority
- **WHEN** evil team's mission win count reaches 3
- **THEN** server broadcasts GAME_OVER with `winner: "evil"` immediately without entering ASSASSINATION

#### Scenario: Good wins only after failed assassination
- **WHEN** good team wins 3 missions
- **THEN** game does NOT broadcast GAME_OVER yet; game enters ASSASSINATION phase first