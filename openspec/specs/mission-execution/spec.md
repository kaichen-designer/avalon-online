## ADDED Requirements

### Requirement: Only team members submit mission cards
Only players who are on the approved team SHALL be able to submit a mission card. Non-team members MUST NOT be able to submit a card. Each team member MUST submit exactly one card.

#### Scenario: Valid card submission
- **WHEN** a team member sends MISSION_CARD with "success" or "fail"
- **THEN** the server records the card and waits for all team members to submit

#### Scenario: Non-team member attempts to submit
- **WHEN** a player not on the team sends MISSION_CARD
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_ON_TEAM" }` to that player only


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

### Requirement: Only evil-aligned roles may submit fail cards
Good-aligned players (Loyal Servant, Merlin, Percival) MUST NOT be able to submit a fail card. If a good-aligned player submits a fail card, the server MUST reject it. Evil-aligned players (Assassin, Morgana, Mordred, Oberon, Minion) MAY submit either success or fail.

#### Scenario: Good player attempts to fail mission
- **WHEN** a good-aligned team member sends `{ type: "MISSION_CARD", card: "fail" }`
- **THEN** the server responds with `{ type: "ERROR", code: "CANNOT_FAIL_MISSION" }` to that player only


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

### Requirement: Mission result calculation
Once all team members have submitted cards, the server SHALL calculate the mission result. A mission FAILS if it contains at least one fail card, EXCEPT for Round 4 with 7 or more players which requires at least 2 fail cards to fail. The individual cards SHALL NOT be revealed; only the count of fail cards is broadcast.

#### Scenario: Mission succeeds
- **WHEN** all team members submit and there are zero fail cards
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: true, failCount: 0, round: N }`

#### Scenario: Mission fails with one fail card (rounds 1-3, 5)
- **WHEN** all team members submit and there is at least one fail card (not R4 special rule)
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: false, failCount: N, round: N }`

#### Scenario: Round 4 special rule requires two fails
- **WHEN** playing Round 4 with 7 or more players and only one fail card is submitted
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: true, failCount: 1, round: 4 }` (mission succeeds despite one fail)

##### Example: Round 4 two-fail threshold
- **GIVEN** 7 players, Round 4, team of 4 players
- **WHEN** team submits: success, success, success, fail (1 fail card)
- **THEN** result is SUCCESS: `{ success: true, failCount: 1 }`
- **WHEN** team submits: success, success, fail, fail (2 fail cards)
- **THEN** result is FAILURE: `{ success: false, failCount: 2 }`


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

### Requirement: Win condition after mission result
After each mission result, the server SHALL update the mission score and check the win condition. If either team reaches 3 mission wins, the appropriate game end transition SHALL be triggered.

#### Scenario: Good team wins three missions
- **WHEN** the good team's mission win count reaches 3
- **THEN** the server transitions to ASSASSINATION phase

#### Scenario: Evil team wins three missions
- **WHEN** the evil team's mission win count reaches 3
- **THEN** the server broadcasts `{ type: "GAME_OVER", winner: "evil", reason: "three_missions" }` and the game ends

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

### Requirement: Only team members submit mission cards
Only players who are on the approved team SHALL be able to submit a mission card. Non-team members MUST NOT be able to submit a card. Each team member MUST submit exactly one card.

#### Scenario: Valid card submission
- **WHEN** a team member sends MISSION_CARD with "success" or "fail"
- **THEN** the server records the card and waits for all team members to submit

#### Scenario: Non-team member attempts to submit
- **WHEN** a player not on the team sends MISSION_CARD
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_ON_TEAM" }` to that player only

---
### Requirement: Only evil-aligned roles may submit fail cards
Good-aligned players (Loyal Servant, Merlin, Percival) MUST NOT be able to submit a fail card. If a good-aligned player submits a fail card, the server MUST reject it. Evil-aligned players (Assassin, Morgana, Mordred, Oberon, Minion) MAY submit either success or fail.

#### Scenario: Good player attempts to fail mission
- **WHEN** a good-aligned team member sends `{ type: "MISSION_CARD", card: "fail" }`
- **THEN** the server responds with `{ type: "ERROR", code: "CANNOT_FAIL_MISSION" }` to that player only

---
### Requirement: Mission result calculation
Once all team members have submitted cards, the server SHALL calculate the mission result. A mission FAILS if it contains at least one fail card, EXCEPT for Round 4 with 7 or more players which requires at least 2 fail cards to fail. The individual cards SHALL NOT be revealed; only the count of fail cards is broadcast.

#### Scenario: Mission succeeds
- **WHEN** all team members submit and there are zero fail cards
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: true, failCount: 0, round: N }`

#### Scenario: Mission fails with one fail card (rounds 1-3, 5)
- **WHEN** all team members submit and there is at least one fail card (not R4 special rule)
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: false, failCount: N, round: N }`

#### Scenario: Round 4 special rule requires two fails
- **WHEN** playing Round 4 with 7 or more players and only one fail card is submitted
- **THEN** the server broadcasts `{ type: "MISSION_RESULT", success: true, failCount: 1, round: 4 }` (mission succeeds despite one fail)

##### Example: Round 4 two-fail threshold
- **GIVEN** 7 players, Round 4, team of 4 players
- **WHEN** team submits: success, success, success, fail (1 fail card)
- **THEN** result is SUCCESS: `{ success: true, failCount: 1 }`
- **WHEN** team submits: success, success, fail, fail (2 fail cards)
- **THEN** result is FAILURE: `{ success: false, failCount: 2 }`

---
### Requirement: Win condition after mission result
After each mission result, the server SHALL update the mission score and check the win condition. If either team reaches 3 mission wins, the appropriate game end transition SHALL be triggered.

#### Scenario: Good team wins three missions
- **WHEN** the good team's mission win count reaches 3
- **THEN** the server transitions to ASSASSINATION phase

#### Scenario: Evil team wins three missions
- **WHEN** the evil team's mission win count reaches 3
- **THEN** the server broadcasts `{ type: "GAME_OVER", winner: "evil", reason: "three_missions" }` and the game ends