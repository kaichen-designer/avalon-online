const { EVIL_COUNT_BY_PLAYERS } = require('./roles');

// rooms: Map<roomCode, room>
const rooms = new Map();
// wsToPlayer: Map<ws, { playerId, roomCode }>
const wsToPlayer = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function generatePlayerId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function broadcast(room, message) {
  const data = JSON.stringify(message);
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === 1) {
      player.ws.send(data);
    }
  }
}

function sendTo(ws, message) {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(message));
  }
}

function getLobbyState(room) {
  return {
    type: 'LOBBY_STATE',
    roomCode: room.code,
    players: room.players.filter(p => p.isConnected !== false).map(p => ({ id: p.id, name: p.name, isHost: p.id === room.hostId, isConnected: true })),
    hostId: room.hostId,
  };
}

function createRoom(ws, playerName) {
  const playerId = generatePlayerId();
  const roomCode = generateRoomCode();

  const player = { id: playerId, name: playerName, ws, isConnected: true, disconnectTimer: null };
  const room = {
    code: roomCode,
    hostId: playerId,
    players: [player],
    phase: 'LOBBY',
    roles: {},       // playerId → role
    leader: null,
    team: [],
    votes: {},
    missionCards: [],
    round: 1,
    goodWins: 0,
    evilWins: 0,
    voteTrack: 0,
    ladyEnabled: false,
    ladyHolder: null,
    previousLadyHolders: [],
  };

  rooms.set(roomCode, room);
  wsToPlayer.set(ws, { playerId, roomCode });

  sendTo(ws, { type: 'ROOM_JOINED', roomCode, playerId, isHost: true });
  return room;
}

function joinRoom(ws, roomCode, playerName) {
  const room = rooms.get(roomCode.toUpperCase());
  if (!room) {
    sendTo(ws, { type: 'ERROR', code: 'ROOM_NOT_FOUND' });
    return null;
  }
  if (room.phase !== 'LOBBY') {
    sendTo(ws, { type: 'ERROR', code: 'GAME_ALREADY_STARTED' });
    return null;
  }
  if (room.players.length >= 10) {
    sendTo(ws, { type: 'ERROR', code: 'ROOM_FULL' });
    return null;
  }

  const playerId = generatePlayerId();
  const player = { id: playerId, name: playerName, ws, isConnected: true, disconnectTimer: null };
  room.players.push(player);
  wsToPlayer.set(ws, { playerId, roomCode: roomCode.toUpperCase() });

  sendTo(ws, { type: 'ROOM_JOINED', roomCode: room.code, playerId, isHost: false });
  broadcast(room, getLobbyState(room));
  return room;
}

function getRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) return room;
  }
  return null;
}

function getPlayer(room, playerId) {
  return room.players.find(p => p.id === playerId);
}

function handleDisconnect(ws) {
  const info = wsToPlayer.get(ws);
  if (!info) return;
  wsToPlayer.delete(ws);

  const { playerId, roomCode } = info;
  const room = rooms.get(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return;

  if (room.phase === 'LOBBY') {
    player.isConnected = false;
    player.ws = null;

    player.disconnectTimer = setTimeout(() => {
      room.players = room.players.filter(p => p.id !== playerId);
      if (room.players.length === 0) {
        rooms.delete(roomCode);
        return;
      }
      if (room.hostId === playerId) {
        room.hostId = room.players[0].id;
      }
      broadcast(room, getLobbyState(room));
    }, 30000);

    broadcast(room, getLobbyState(room));
  } else {
    player.isConnected = false;
    player.ws = null;
    broadcast(room, { type: 'PLAYER_DISCONNECTED', playerId });

    player.disconnectTimer = setTimeout(() => {
      room.players = room.players.filter(p => p.id !== playerId);
      broadcast(room, {
        type: 'GAME_OVER',
        winner: 'unknown',
        reason: 'player_disconnected',
        disconnectedPlayer: playerId,
      });
    }, 30000);
  }
}

module.exports = { rooms, wsToPlayer, createRoom, joinRoom, getRoomByPlayerId, getPlayer, handleDisconnect, broadcast, sendTo, getLobbyState };
