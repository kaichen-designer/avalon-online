const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const { rooms, createRoom, joinRoom, getRoomByPlayerId, getPlayer, handleDisconnect, sendTo, getLobbyState, broadcast } = require('./gameManager');
const { assignRoles, acknowledgeRole, proposeTeam, submitVote, submitMissionCard, assassinate, investigateWithLady, broadcastGameState } = require('./gameEngine');
const { ROLES, getVisibleInfo } = require('./roles');

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, '..', 'client');

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

// HTTP server — serves static files from client/
const server = http.createServer((req, res) => {
  let filePath = path.join(CLIENT_DIR, req.url === '/' ? 'index.html' : req.url);
  // Prevent path traversal
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try index.html for SPA-like fallback
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
      return;
    }
    const isHtml = ext === '.html';
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': isHtml ? 'no-cache' : 'public, max-age=3600',
    });
    res.end(data);
  });
});

// WebSocket server — game protocol
const wss = new WebSocketServer({ server });

// ws → playerId mapping (for fast lookup)
const wsToPlayerId = new Map();

wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      sendTo(ws, { type: 'ERROR', code: 'INVALID_JSON' });
      return;
    }

    const playerId = wsToPlayerId.get(ws);
    const room = playerId ? getRoomByPlayerId(playerId) : null;

    switch (msg.type) {
      case 'REJOIN_ROOM': {
        const { playerId: rejoinId, roomCode: rejoinCode } = msg;
        if (!rejoinId || !rejoinCode) { sendTo(ws, { type: 'ERROR', code: 'MISSING_FIELDS' }); break; }
        const rejoinRoom = rooms.get(rejoinCode.toUpperCase());
        if (!rejoinRoom) { sendTo(ws, { type: 'ERROR', code: 'ROOM_NOT_FOUND' }); break; }
        const rejoinPlayer = rejoinRoom.players.find(p => p.id === rejoinId);
        if (!rejoinPlayer) { sendTo(ws, { type: 'ERROR', code: 'PLAYER_NOT_FOUND' }); break; }

        // Update ws reference and clear disconnect timer
        if (rejoinPlayer.disconnectTimer) { clearTimeout(rejoinPlayer.disconnectTimer); rejoinPlayer.disconnectTimer = null; }
        rejoinPlayer.ws = ws;
        rejoinPlayer.isConnected = true;
        wsToPlayerId.set(ws, rejoinId);

        if (rejoinRoom.phase === 'LOBBY') {
          sendTo(ws, getLobbyState(rejoinRoom));
          broadcast(rejoinRoom, getLobbyState(rejoinRoom));
        } else {
          // Re-send role info to reconnected player
          if (rejoinRoom.roles[rejoinId]) {
            const allPlayersWithRoles = rejoinRoom.players.map(p => ({ id: p.id, role: rejoinRoom.roles[p.id] }));
            const visibleInfo = getVisibleInfo(rejoinRoom.roles[rejoinId], rejoinId, allPlayersWithRoles);
            sendTo(ws, { type: 'ROLE_INFO', role: rejoinRoom.roles[rejoinId], ...visibleInfo });
          }
          broadcastGameState(rejoinRoom);
          broadcast(rejoinRoom, { type: 'PLAYER_RECONNECTED', playerId: rejoinId });
        }
        break;
      }

      case 'CREATE_ROOM': {
        if (!msg.playerName || typeof msg.playerName !== 'string') {
          sendTo(ws, { type: 'ERROR', code: 'MISSING_NAME' });
          break;
        }
        const r = createRoom(ws, msg.playerName.trim().slice(0, 20));
        if (r) {
          const p = r.players[r.players.length - 1];
          wsToPlayerId.set(ws, p.id);
        }
        break;
      }

      case 'JOIN_ROOM': {
        if (!msg.playerName || !msg.roomCode) {
          sendTo(ws, { type: 'ERROR', code: 'MISSING_FIELDS' });
          break;
        }
        const r = joinRoom(ws, msg.roomCode, msg.playerName.trim().slice(0, 20));
        if (r) {
          const p = r.players[r.players.length - 1];
          wsToPlayerId.set(ws, p.id);
        }
        break;
      }

      case 'START_GAME': {
        if (!room) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        if (room.hostId !== playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_HOST' }); break; }
        if (room.players.length < 5) { sendTo(ws, { type: 'ERROR', code: 'INSUFFICIENT_PLAYERS' }); break; }
        if (room.players.length > 10) { sendTo(ws, { type: 'ERROR', code: 'TOO_MANY_PLAYERS' }); break; }
        if (!msg.roleList || !Array.isArray(msg.roleList)) {
          sendTo(ws, { type: 'ERROR', code: 'MISSING_ROLE_LIST' }); break;
        }
        room.ladyEnabled = !!msg.ladyEnabled;
        const ok = assignRoles(room, msg.roleList, sendTo);
        if (!ok) {
          room.ladyEnabled = false;
          sendTo(ws, { type: 'ERROR', code: 'INVALID_ROLE_LIST' });
        } else if (room.ladyEnabled) {
          // Set initial lady holder: player after first leader
          const leaderIdx = room.players.findIndex(p => p.id === room.leader);
          room.ladyHolder = room.players[(leaderIdx + 1) % room.players.length].id;
        }
        break;
      }

      case 'ACKNOWLEDGE_ROLE': {
        if (!room || !playerId) break;
        acknowledgeRole(room, playerId);
        break;
      }

      case 'PROPOSE_TEAM': {
        if (!room || !playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        proposeTeam(room, playerId, msg.team, sendTo);
        break;
      }

      case 'VOTE': {
        if (!room || !playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        if (msg.vote !== 'approve' && msg.vote !== 'reject') {
          sendTo(ws, { type: 'ERROR', code: 'INVALID_VOTE' }); break;
        }
        submitVote(room, playerId, msg.vote, sendTo);
        break;
      }

      case 'MISSION_CARD': {
        if (!room || !playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        if (msg.card !== 'success' && msg.card !== 'fail') {
          sendTo(ws, { type: 'ERROR', code: 'INVALID_CARD' }); break;
        }
        submitMissionCard(room, playerId, msg.card, sendTo);
        break;
      }

      case 'ASSASSINATE': {
        if (!room || !playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        assassinate(room, playerId, msg.targetId, sendTo);
        break;
      }

      case 'LADY_INVESTIGATE': {
        if (!room || !playerId) { sendTo(ws, { type: 'ERROR', code: 'NOT_IN_ROOM' }); break; }
        investigateWithLady(room, playerId, msg.targetId, sendTo);
        break;
      }

      default:
        sendTo(ws, { type: 'ERROR', code: 'UNKNOWN_MESSAGE_TYPE' });
    }
  });

  ws.on('close', () => {
    const pid = wsToPlayerId.get(ws);
    wsToPlayerId.delete(ws);
    handleDisconnect(ws);
  });

  ws.on('error', err => {
    console.error('WebSocket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Avalon server running at http://localhost:${PORT}`);
});
