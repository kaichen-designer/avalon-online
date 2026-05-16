## ADDED Requirements

### Requirement: Assassination phase triggered after good team wins three missions
When the good team wins their third mission, the server SHALL transition to the ASSASSINATION phase instead of ending the game immediately. Only the player with the Assassin role SHALL be permitted to submit an assassination target.

#### Scenario: Assassination phase begins
- **WHEN** the good team wins their third mission
- **THEN** the server broadcasts `{ type: "GAME_STATE", phase: "ASSASSINATION" }` and all players are informed that the Assassin must now guess Merlin

#### Scenario: Non-assassin attempts assassination
- **WHEN** a player without the Assassin role sends ASSASSINATE
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_ASSASSIN" }` to that player only

### Requirement: Assassin guesses Merlin
The Assassin SHALL submit exactly one target player ID. The server MUST determine whether the target is the Merlin player and broadcast the game result accordingly.

#### Scenario: Assassin correctly identifies Merlin
- **WHEN** the Assassin sends `{ type: "ASSASSINATE", targetId: "<merlinPlayerId>" }`
- **THEN** the server broadcasts `{ type: "GAME_OVER", winner: "evil", reason: "merlin_assassinated", merlinWas: "<merlinPlayerId>" }`

#### Scenario: Assassin incorrectly identifies Merlin
- **WHEN** the Assassin sends ASSASSINATE with a targetId that is NOT the Merlin player
- **THEN** the server broadcasts `{ type: "GAME_OVER", winner: "good", reason: "merlin_survived", merlinWas: "<merlinPlayerId>" }`

### Requirement: Merlin identity revealed at game end
When the game ends (for any reason), the server SHALL reveal Merlin's true identity to all players in the GAME_OVER message. This applies to both assassination outcomes.

#### Scenario: Merlin revealed on game over
- **WHEN** the server broadcasts GAME_OVER
- **THEN** the message includes `merlinWas: "<playerId>"` indicating which player was Merlin
