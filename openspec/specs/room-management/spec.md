## ADDED Requirements

### Requirement: Create room
A player SHALL be able to create a new game room by providing their name. The server MUST generate a unique 4-character uppercase room code and assign the creator as the host.

#### Scenario: Successful room creation
- **WHEN** a player sends CREATE_ROOM with a valid name
- **THEN** the server creates a room, assigns a unique 4-character code, marks the player as host, and returns ROOM_JOINED with the room code

##### Example: room code format
- **GIVEN** no existing rooms
- **WHEN** player "Alice" creates a room
- **THEN** server responds with `{ type: "ROOM_JOINED", roomCode: "ABCD", playerId: "<uuid>", isHost: true }` where roomCode is exactly 4 uppercase letters

### Requirement: Join room
A player SHALL be able to join an existing room by providing a room code and their name. The server MUST reject the request if the room does not exist, the game has already started, or the room is full (10 players).

#### Scenario: Successful join
- **WHEN** a player sends JOIN_ROOM with a valid roomCode and name
- **THEN** the server adds the player to the room and broadcasts updated player list to all players in the room

#### Scenario: Room not found
- **WHEN** a player sends JOIN_ROOM with a non-existent roomCode
- **THEN** the server responds with `{ type: "ERROR", code: "ROOM_NOT_FOUND" }` to that player only

#### Scenario: Game already started
- **WHEN** a player sends JOIN_ROOM and the room's phase is not LOBBY
- **THEN** the server responds with `{ type: "ERROR", code: "GAME_ALREADY_STARTED" }` to that player only

#### Scenario: Room full
- **WHEN** a player sends JOIN_ROOM and the room already has 10 players
- **THEN** the server responds with `{ type: "ERROR", code: "ROOM_FULL" }` to that player only

### Requirement: Host starts game
Only the host SHALL be able to start the game. The host MUST specify the role list before starting. The server MUST reject the start request if the player count is fewer than 5 or more than 10.

#### Scenario: Host starts successfully
- **WHEN** the host sends START_GAME with a valid roleList and player count is between 5 and 10
- **THEN** the server transitions to ROLE_REVEAL phase and proceeds with role assignment

#### Scenario: Non-host attempts to start
- **WHEN** a non-host player sends START_GAME
- **THEN** the server responds with `{ type: "ERROR", code: "NOT_HOST" }` to that player only

#### Scenario: Insufficient players
- **WHEN** the host sends START_GAME with fewer than 5 players in the room
- **THEN** the server responds with `{ type: "ERROR", code: "INSUFFICIENT_PLAYERS" }` to that player only

### Requirement: Player disconnect handling
When a player disconnects, the server MUST handle the disconnect based on game phase. If the game has not started, the player SHALL be removed and the remaining players notified. If the game is in progress, the player's slot SHALL be retained and marked as disconnected for up to 30 seconds; after 30 seconds the player is removed and the game ends with that team forfeiting.

#### Scenario: Disconnect before game starts
- **WHEN** a player's WebSocket connection closes and the room phase is LOBBY
- **THEN** the player is removed from the room and all remaining players receive an updated LOBBY_STATE

#### Scenario: Disconnect during game
- **WHEN** a player's WebSocket connection closes and the room phase is not LOBBY
- **THEN** the player is marked disconnected, other players receive a PLAYER_DISCONNECTED notification, and a 30-second reconnect window begins
