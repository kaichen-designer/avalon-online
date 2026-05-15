const { ROLES, EVIL_ROLES, EVIL_COUNT_BY_PLAYERS, getVisibleInfo, isEvil, isGood, getAlignment } = require('./roles');
const { broadcast, sendTo, getPlayer } = require('./gameManager');

// Mission team size: MISSION_REQUIREMENTS[playerCount][roundIndex (0-based)]
// R4 (index 3) for 7+ players requires 2 fails
const MISSION_REQUIREMENTS = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNextLeaderIndex(room) {
  const idx = room.players.findIndex(p => p.id === room.leader);
  return (idx + 1) % room.players.length;
}

function broadcastGameState(room) {
  const merlinId = Object.entries(room.roles).find(([, r]) => r === ROLES.MERLIN)?.[0];
  broadcast(room, {
    type: 'GAME_STATE',
    phase: room.phase,
    round: room.round,
    leader: room.leader,
    goodWins: room.goodWins,
    evilWins: room.evilWins,
    voteTrack: room.voteTrack,
    team: room.team,
    players: room.players.map(p => ({ id: p.id, name: p.name, isConnected: p.isConnected })),
    ...(room.phase === 'GAME_OVER' ? { merlinWas: merlinId } : {}),
    ...(room.ladyEnabled ? { ladyHolder: room.ladyHolder, previousLadyHolders: room.previousLadyHolders } : {}),
  });
}

function assignRoles(room, roleList, sendToFn) {
  const playerCount = room.players.length;
  const evilCount = EVIL_COUNT_BY_PLAYERS[playerCount];

  // Validate: must have exactly one merlin and one assassin
  const merlinCount = roleList.filter(r => r === ROLES.MERLIN).length;
  const assassinCount = roleList.filter(r => r === ROLES.ASSASSIN).length;
  const evilInList = roleList.filter(r => EVIL_ROLES.has(r)).length;

  if (merlinCount !== 1 || assassinCount !== 1 || evilInList !== evilCount || roleList.length !== playerCount) {
    return false;
  }

  const shuffledRoles = shuffle(roleList);
  room.roles = {};
  room.players.forEach((p, i) => {
    room.roles[p.id] = shuffledRoles[i];
  });

  // Send individual ROLE_INFO to each player
  const allPlayersWithRoles = room.players.map(p => ({ id: p.id, role: room.roles[p.id] }));
  room.players.forEach(p => {
    const role = room.roles[p.id];
    const visibleInfo = getVisibleInfo(role, p.id, allPlayersWithRoles);
    sendToFn(p.ws, { type: 'ROLE_INFO', role, ...visibleInfo });
  });

  // Set first leader (first player in join order)
  room.leader = room.players[0].id;
  room.phase = 'ROLE_REVEAL';
  broadcastGameState(room);
  return true;
}

function acknowledgeRole(room, playerId) {
  if (!room.acknowledged) room.acknowledged = new Set();
  room.acknowledged.add(playerId);
  if (room.acknowledged.size >= room.players.length) {
    room.acknowledged = new Set();
    room.phase = 'TEAM_PROPOSAL';
    broadcastGameState(room);
  }
}

function proposeTeam(room, leaderId, team, sendToFn) {
  const leaderWs = getPlayer(room, leaderId)?.ws;

  if (room.leader !== leaderId) {
    sendToFn(leaderWs, { type: 'ERROR', code: 'NOT_LEADER' });
    return false;
  }

  const playerCount = room.players.length;
  const required = MISSION_REQUIREMENTS[playerCount][room.round - 1];
  if (!team || team.length !== required) {
    sendToFn(leaderWs, { type: 'ERROR', code: 'INVALID_TEAM_SIZE' });
    return false;
  }

  // Validate all team members are in the room
  const playerIds = new Set(room.players.map(p => p.id));
  if (!team.every(id => playerIds.has(id))) {
    sendToFn(leaderWs, { type: 'ERROR', code: 'INVALID_TEAM_MEMBER' });
    return false;
  }

  room.team = team;
  room.votes = {};
  room.phase = 'VOTE';
  broadcastGameState(room);
  return true;
}

function submitVote(room, playerId, vote, sendToFn) {
  const playerWs = getPlayer(room, playerId)?.ws;

  if (room.votes[playerId] !== undefined) {
    sendToFn(playerWs, { type: 'ERROR', code: 'ALREADY_VOTED' });
    return false;
  }

  room.votes[playerId] = vote; // 'approve' | 'reject'

  const totalPlayers = room.players.length;
  if (Object.keys(room.votes).length < totalPlayers) return true; // waiting

  // All votes in — calculate result
  const approveCount = Object.values(room.votes).filter(v => v === 'approve').length;
  const approved = approveCount > totalPlayers / 2;

  broadcast(room, {
    type: 'VOTE_RESULT',
    approved,
    votes: { ...room.votes },
    approveCount,
    rejectCount: totalPlayers - approveCount,
  });

  if (approved) {
    room.missionCards = [];
    room.phase = 'MISSION';
    broadcastGameState(room);
  } else {
    room.voteTrack += 1;
    if (room.voteTrack >= 5) {
      room.phase = 'GAME_OVER';
      const merlinId = Object.entries(room.roles).find(([, r]) => r === ROLES.MERLIN)?.[0];
      broadcast(room, { type: 'GAME_OVER', winner: 'evil', reason: 'five_rejections', merlinWas: merlinId });
      return true;
    }
    // Rotate leader
    const nextIdx = getNextLeaderIndex(room);
    room.leader = room.players[nextIdx].id;
    room.phase = 'TEAM_PROPOSAL';
    broadcastGameState(room);
  }
  return true;
}

function submitMissionCard(room, playerId, card, sendToFn) {
  const playerWs = getPlayer(room, playerId)?.ws;

  if (!room.team.includes(playerId)) {
    sendToFn(playerWs, { type: 'ERROR', code: 'NOT_ON_TEAM' });
    return false;
  }

  const role = room.roles[playerId];
  if (card === 'fail' && !isEvil(role)) {
    sendToFn(playerWs, { type: 'ERROR', code: 'CANNOT_FAIL_MISSION' });
    return false;
  }

  // Prevent double submit
  if (room.missionCards.some(c => c.playerId === playerId)) {
    sendToFn(playerWs, { type: 'ERROR', code: 'ALREADY_SUBMITTED' });
    return false;
  }

  room.missionCards.push({ playerId, card });

  if (room.missionCards.length < room.team.length) return true; // waiting

  calcMissionResult(room);
  return true;
}

function calcMissionResult(room) {
  const playerCount = room.players.length;
  const roundIndex = room.round - 1; // 0-based
  const failCards = room.missionCards.filter(c => c.card === 'fail');
  const failCount = failCards.length;

  // R4 (roundIndex === 3) with 7+ players: needs 2 fails
  const failsRequired = (roundIndex === 3 && playerCount >= 7) ? 2 : 1;
  const success = failCount < failsRequired;

  broadcast(room, {
    type: 'MISSION_RESULT',
    success,
    failCount,
    round: room.round,
  });

  if (success) {
    room.goodWins += 1;
  } else {
    room.evilWins += 1;
  }

  checkWinCondition(room);
}

function checkWinCondition(room) {
  const merlinId = Object.entries(room.roles).find(([, r]) => r === ROLES.MERLIN)?.[0];

  if (room.evilWins >= 3) {
    room.phase = 'GAME_OVER';
    broadcast(room, { type: 'GAME_OVER', winner: 'evil', reason: 'three_missions', merlinWas: merlinId });
    return;
  }

  if (room.goodWins >= 3) {
    room.phase = 'ASSASSINATION';
    broadcastGameState(room);
    return;
  }

  // Advance round
  const completedRound = room.round;
  room.round += 1;
  room.voteTrack = 0;
  const nextIdx = getNextLeaderIndex(room);
  room.leader = room.players[nextIdx].id;
  room.team = [];
  room.missionCards = [];

  // Insert LADY_OF_LAKE phase after rounds 2, 3, 4 (when lady is enabled)
  if (room.ladyEnabled && [2, 3, 4].includes(completedRound)) {
    room.phase = 'LADY_OF_LAKE';
    broadcastGameState(room);
    return;
  }

  room.phase = 'TEAM_PROPOSAL';
  broadcastGameState(room);
}

function investigateWithLady(room, holderId, targetId, sendToFn) {
  const holderWs = getPlayer(room, holderId)?.ws;

  if (room.ladyHolder !== holderId) {
    sendToFn(holderWs, { type: 'ERROR', code: 'NOT_LADY_HOLDER' });
    return false;
  }
  if (targetId === holderId || room.previousLadyHolders.includes(targetId)) {
    sendToFn(holderWs, { type: 'ERROR', code: 'INVALID_LADY_TARGET' });
    return false;
  }
  // Validate target is in the room
  if (!getPlayer(room, targetId)) {
    sendToFn(holderWs, { type: 'ERROR', code: 'PLAYER_NOT_FOUND' });
    return false;
  }

  const targetRole = room.roles[targetId];
  const alignment = getAlignment(targetRole);
  const targetName = getPlayer(room, targetId)?.name;

  sendToFn(holderWs, { type: 'LADY_RESULT', alignment, targetName });

  room.previousLadyHolders.push(holderId);
  room.ladyHolder = targetId;

  room.phase = 'TEAM_PROPOSAL';
  broadcastGameState(room);
  return true;
}

function assassinate(room, assassinId, targetId, sendToFn) {
  const assassinWs = getPlayer(room, assassinId)?.ws;

  if (room.roles[assassinId] !== ROLES.ASSASSIN) {
    sendToFn(assassinWs, { type: 'ERROR', code: 'NOT_ASSASSIN' });
    return false;
  }

  const merlinId = Object.entries(room.roles).find(([, r]) => r === ROLES.MERLIN)?.[0];
  const hit = targetId === merlinId;

  room.phase = 'GAME_OVER';
  broadcast(room, {
    type: 'GAME_OVER',
    winner: hit ? 'evil' : 'good',
    reason: hit ? 'merlin_assassinated' : 'merlin_survived',
    merlinWas: merlinId,
  });
  return true;
}

module.exports = {
  MISSION_REQUIREMENTS,
  assignRoles,
  acknowledgeRole,
  proposeTeam,
  submitVote,
  submitMissionCard,
  calcMissionResult,
  checkWinCondition,
  assassinate,
  investigateWithLady,
  broadcastGameState,
};
