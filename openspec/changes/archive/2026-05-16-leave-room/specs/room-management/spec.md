## ADDED Requirements

### Requirement: Player can voluntarily leave the lobby

Any player SHALL be able to leave a room while the room is in the LOBBY phase by sending a LEAVE_ROOM message. The server SHALL immediately remove the player, transfer host if needed, and notify remaining players.

#### Scenario: Non-host player leaves

- **WHEN** a non-host player sends `LEAVE_ROOM` in LOBBY phase
- **THEN** the player is removed from the room, receives `{ type: 'LEFT' }`, and all remaining players receive an updated `LOBBY_STATE` with the host unchanged

#### Scenario: Host player leaves with others remaining

- **WHEN** the host sends `LEAVE_ROOM` in LOBBY phase and at least one other player remains
- **THEN** the host is removed, receives `{ type: 'LEFT' }`, the next player in join order becomes the new host, and all remaining players receive an updated `LOBBY_STATE` reflecting the new host

#### Scenario: Last player leaves

- **WHEN** the only player in a room sends `LEAVE_ROOM`
- **THEN** the player receives `{ type: 'LEFT' }` and the room is deleted from the server (no LOBBY_STATE broadcast as no one remains)

#### Scenario: Leave attempted during active game

- **WHEN** any player sends `LEAVE_ROOM` while `room.phase` is not `LOBBY`
- **THEN** the server responds with `ERROR { code: 'NOT_IN_LOBBY' }` and the room state is unchanged

#### Scenario: Client clears state after leaving

- **WHEN** the client receives `{ type: 'LEFT' }`
- **THEN** the client SHALL clear `sessionStorage` (playerId, roomCode, isHost) and navigate to `index.html`

##### Example: host transfer on host leave

- **GIVEN** room with players in join order: Alice (host), Bob, Carol
- **WHEN** Alice sends LEAVE_ROOM
- **THEN** Alice receives LEFT, Bob and Carol receive LOBBY_STATE where `hostId` = Bob's playerId
