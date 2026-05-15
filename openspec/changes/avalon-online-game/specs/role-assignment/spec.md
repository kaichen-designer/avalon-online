## ADDED Requirements

### Requirement: Secret role assignment
The server SHALL randomly assign one role to each player when the game starts. Each player MUST receive only the information their role is permitted to see via an individual ROLE_INFO message. The complete role mapping MUST NOT be broadcast to all players.

#### Scenario: Individual role info delivery
- **WHEN** the server assigns roles and starts the game
- **THEN** each player receives exactly one ROLE_INFO message on their own WebSocket connection containing their role and the list of player IDs they can identify

##### Example: Merlin's visible information
- **GIVEN** players: Alice(merlin), Bob(assassin), Carol(loyal), Dave(mordred), Eve(minion)
- **WHEN** game starts
- **THEN** Alice receives `{ type: "ROLE_INFO", role: "merlin", knownEvil: ["Bob", "Eve"] }` — Dave(mordred) is NOT in the list

##### Example: Percival's visible information
- **GIVEN** players include percival, merlin, and morgana
- **WHEN** game starts
- **THEN** Percival receives `{ type: "ROLE_INFO", role: "percival", suspects: ["<merlinId>", "<morganaId>"] }` — both IDs are listed but which is which is not indicated

### Requirement: Role visibility rules
The server MUST enforce visibility rules for each role as follows:
- **Merlin** SHALL see all evil-aligned players EXCEPT Mordred
- **Percival** SHALL see Merlin and Morgana as suspects (indistinguishable)
- **Morgana** SHALL see all evil-aligned players EXCEPT Oberon
- **Mordred** SHALL see all evil-aligned players EXCEPT Oberon
- **Oberon** SHALL NOT see any other evil players; other evil players SHALL NOT see Oberon
- **Assassin and Minion** SHALL see all evil-aligned players EXCEPT Oberon
- **Loyal Servant** SHALL NOT see any role information about other players

#### Scenario: Oberon isolation
- **WHEN** Oberon's ROLE_INFO is computed
- **THEN** Oberon receives `{ type: "ROLE_INFO", role: "oberon", knownEvil: [] }` with no other evil players listed

#### Scenario: Evil players mutual recognition
- **WHEN** an evil player (not Oberon) receives ROLE_INFO
- **THEN** they receive a list of all other evil players except Oberon

### Requirement: Role list validation
The host-specified role list MUST be validated before the game starts. The role list SHALL contain exactly one Merlin and exactly one Assassin. The number of evil roles (Assassin, Morgana, Mordred, Oberon, Minions) MUST match the required evil count for the player count.

#### Scenario: Invalid role count
- **WHEN** the host sends START_GAME with a role list that has the wrong number of evil roles for the current player count
- **THEN** the server responds with `{ type: "ERROR", code: "INVALID_ROLE_LIST" }` to the host

##### Example: Evil counts by player count
| Player Count | Evil Count |
|---|---|
| 5 | 2 |
| 6 | 2 |
| 7 | 3 |
| 8 | 3 |
| 9 | 3 |
| 10 | 4 |
