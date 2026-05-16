## ADDED Requirements

### Requirement: All players vote on proposed team
Every player SHALL cast exactly one vote (approve or reject) on the proposed team. The server MUST wait until all players have voted before revealing the result. A player MUST NOT vote more than once per proposal.

#### Scenario: Successful vote collection
- **WHEN** all players have submitted their votes
- **THEN** the server broadcasts VOTE_RESULT containing the outcome (approved/rejected) and all individual votes

#### Scenario: Duplicate vote attempt
- **WHEN** a player who has already voted sends another VOTE message for the same proposal
- **THEN** the server ignores the duplicate and responds with `{ type: "ERROR", code: "ALREADY_VOTED" }` to that player only

### Requirement: Vote approval threshold
A team proposal is approved if strictly more than half of all players vote approve. Otherwise the proposal is rejected.

#### Scenario: Vote passes by majority
- **WHEN** more than half of players vote approve
- **THEN** the server broadcasts `{ type: "VOTE_RESULT", approved: true, votes: { ... } }` and transitions to MISSION phase

#### Scenario: Vote fails by majority
- **WHEN** half or fewer players vote approve
- **THEN** the server broadcasts `{ type: "VOTE_RESULT", approved: false, votes: { ... } }` and transitions back to TEAM_PROPOSAL with leader advanced

##### Example: Approval threshold by player count
| Player Count | Minimum Approve Votes to Pass |
|---|---|
| 5 | 3 |
| 6 | 4 |
| 7 | 4 |
| 8 | 5 |
| 9 | 5 |
| 10 | 6 |

### Requirement: Five consecutive rejections
The vote track SHALL count consecutive rejected proposals. If 5 proposals are rejected in a row without a mission being executed, the evil team wins immediately.

#### Scenario: Five consecutive rejections triggers evil victory
- **WHEN** the 5th consecutive proposal is rejected
- **THEN** the server broadcasts `{ type: "GAME_OVER", winner: "evil", reason: "five_rejections" }` and the game ends

#### Scenario: Vote track resets after mission
- **WHEN** a mission completes (success or failure)
- **THEN** the consecutive rejection counter resets to 0 for the next round
