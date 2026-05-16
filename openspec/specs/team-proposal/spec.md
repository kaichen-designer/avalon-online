## ADDED Requirements

### Requirement: Leader nominates team
Only the current leader SHALL be able to submit a team proposal. The proposed team size MUST match the required team size for the current round and player count. Non-leaders MUST NOT be able to submit a proposal.

#### Scenario: Valid team proposal
- **WHEN** the current leader sends PROPOSE_TEAM with the correct number of player IDs
- **THEN** the server transitions to VOTE phase and broadcasts the proposed team to all players

#### Scenario: Wrong team size
- **WHEN** the leader sends PROPOSE_TEAM with an incorrect number of player IDs
- **THEN** the server responds with `{ type: "ERROR", code: "INVALID_TEAM_SIZE" }` to the leader

#### Scenario: Non-leader attempts proposal
- **WHEN** a player who is not the current leader sends PROPOSE_TEAM
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_LEADER" }` to that player only

##### Example: Required team sizes
| Player Count | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| 5 | 2 | 3 | 2 | 3 | 3 |
| 6 | 2 | 3 | 4 | 3 | 4 |
| 7 | 2 | 3 | 3 | 4 | 4 |
| 8 | 3 | 4 | 4 | 5 | 5 |
| 9 | 3 | 4 | 4 | 5 | 5 |
| 10 | 3 | 4 | 4 | 5 | 5 |


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

### Requirement: Leader rotation
After each failed vote (team rejected), the leader role SHALL pass clockwise to the next player in the join order. After a successful mission (pass or fail), the leader SHALL also advance clockwise before the next round's proposal phase.

#### Scenario: Leader advances after rejected vote
- **WHEN** a vote results in rejection
- **THEN** the next player in join order becomes the leader and the game transitions back to TEAM_PROPOSAL phase

#### Scenario: Leader advances after mission completes
- **WHEN** a mission completes (success or failure)
- **THEN** the next player in join order becomes the leader for the following round's TEAM_PROPOSAL phase

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

### Requirement: Leader nominates team
Only the current leader SHALL be able to submit a team proposal. The proposed team size MUST match the required team size for the current round and player count. Non-leaders MUST NOT be able to submit a proposal.

#### Scenario: Valid team proposal
- **WHEN** the current leader sends PROPOSE_TEAM with the correct number of player IDs
- **THEN** the server transitions to VOTE phase and broadcasts the proposed team to all players

#### Scenario: Wrong team size
- **WHEN** the leader sends PROPOSE_TEAM with an incorrect number of player IDs
- **THEN** the server responds with `{ type: "ERROR", code: "INVALID_TEAM_SIZE" }` to the leader

#### Scenario: Non-leader attempts proposal
- **WHEN** a player who is not the current leader sends PROPOSE_TEAM
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_LEADER" }` to that player only

##### Example: Required team sizes
| Player Count | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| 5 | 2 | 3 | 2 | 3 | 3 |
| 6 | 2 | 3 | 4 | 3 | 4 |
| 7 | 2 | 3 | 3 | 4 | 4 |
| 8 | 3 | 4 | 4 | 5 | 5 |
| 9 | 3 | 4 | 4 | 5 | 5 |
| 10 | 3 | 4 | 4 | 5 | 5 |

---
### Requirement: Leader rotation
After each failed vote (team rejected), the leader role SHALL pass clockwise to the next player in the join order. After a successful mission (pass or fail), the leader SHALL also advance clockwise before the next round's proposal phase.

#### Scenario: Leader advances after rejected vote
- **WHEN** a vote results in rejection
- **THEN** the next player in join order becomes the leader and the game transitions back to TEAM_PROPOSAL phase

#### Scenario: Leader advances after mission completes
- **WHEN** a mission completes (success or failure)
- **THEN** the next player in join order becomes the leader for the following round's TEAM_PROPOSAL phase