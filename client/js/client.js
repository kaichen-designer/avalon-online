// Global state visible to ui.js
window.gameState = null;
window.myId = sessionStorage.getItem('playerId');
window.myRoleInfo = null;

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
let ws;

function connect() {
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    const playerId = window.myId;
    const roomCode = sessionStorage.getItem('roomCode');
    if (!playerId || !roomCode) {
      window.location.href = 'index.html';
      return;
    }
    send({ type: 'REJOIN_ROOM', playerId, roomCode });
  };

  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    dispatch(msg);
  };

  ws.onclose = () => {
    showNotification('與伺服器斷線，請重新整理頁面');
  };

  ws.onerror = () => {
    showNotification('連線錯誤');
  };
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

// Expose send globally so ui.js can use it
window.sendMsg = send;

function dispatch(msg) {
  switch (msg.type) {
    case 'LOBBY_STATE':
      UI.renderLobby(msg);
      break;

    case 'ROLE_INFO':
      window.myRoleInfo = msg;
      UI.renderRoleReveal(msg, window.gameState?.players || []);
      break;

    case 'GAME_STATE':
      window.gameState = msg;
      updateHeader(msg);
      UI.renderByPhase(msg);
      break;

    case 'VOTE_RESULT':
      UI.renderVoteResult(msg, window.gameState);
      break;

    case 'MISSION_RESULT':
      UI.renderMissionResult(msg);
      setTimeout(() => {
        if (window.gameState) UI.renderByPhase(window.gameState);
      }, 2500);
      break;

    case 'GAME_OVER':
      UI.renderGameOver(msg);
      break;

    case 'PLAYER_DISCONNECTED':
      showNotification(`玩家已斷線（等待重連…）`);
      break;

    case 'PLAYER_RECONNECTED':
      showNotification(`玩家重新連線`);
      break;

    case 'LADY_RESULT': {
      const side = msg.alignment === 'good' ? '好人' : '壞人';
      showNotification(`湖中女結果：${msg.targetName} 是${side}`, false);
      break;
    }

    case 'KICKED':
      sessionStorage.removeItem('playerId');
      sessionStorage.removeItem('roomCode');
      sessionStorage.removeItem('isHost');
      alert('你已被房主踢出');
      window.location.href = 'index.html';
      break;

    case 'LEFT':
      sessionStorage.removeItem('playerId');
      sessionStorage.removeItem('roomCode');
      sessionStorage.removeItem('isHost');
      window.location.href = 'index.html';
      break;

    case 'ERROR':
      if (msg.code === 'ROOM_NOT_FOUND' || msg.code === 'PLAYER_NOT_FOUND') {
        sessionStorage.removeItem('roomCode');
        sessionStorage.removeItem('playerId');
        sessionStorage.removeItem('isHost');
        alert('房間已不存在（伺服器可能重新啟動），請重新建立房間。');
        window.location.href = 'index.html';
        return;
      }
      showNotification(errorMsg(msg.code), true);
      break;

    default:
      console.warn('Unknown message type:', msg.type);
  }
}

function errorMsg(code) {
  const map = {
    NOT_IN_ROOM: '你不在任何房間中',
    NOT_HOST: '只有房主能執行此操作',
    NOT_LEADER: '只有隊長能提名',
    NOT_ASSASSIN: '只有刺客能執行刺殺',
    INSUFFICIENT_PLAYERS: '人數不足（至少 5 人）',
    INVALID_ROLE_LIST: '角色組合無效（請確認人數和邪惡人數）',
    INVALID_TEAM_SIZE: '隊員人數不符合本輪要求',
    NOT_ON_TEAM: '你不在任務隊伍中',
    CANNOT_FAIL_MISSION: '好人陣營不能出失敗牌',
    ALREADY_VOTED: '你已投票',
    ALREADY_SUBMITTED: '你已提交任務牌',
  };
  return map[code] || `錯誤：${code}`;
}

function updateHeader(state) {
  const roomCode = sessionStorage.getItem('roomCode');
  document.getElementById('room-code-display').textContent = `房間：${roomCode || '----'}`;
  document.getElementById('round-display').textContent = `第 ${state.round} 輪`;

  // Score dots
  const goodDots = '●'.repeat(state.goodWins) + '○'.repeat(3 - state.goodWins);
  const evilDots = '●'.repeat(state.evilWins) + '○'.repeat(3 - state.evilWins);
  document.getElementById('good-score').textContent = `好人 ${goodDots}`;
  document.getElementById('evil-score').textContent = `壞人 ${evilDots}`;

  // Vote track
  const vtEl = document.getElementById('vote-track');
  const vtCount = document.getElementById('vote-track-count');
  if (state.phase !== 'LOBBY' && state.phase !== 'GAME_OVER') {
    vtEl.style.display = 'block';
    vtCount.textContent = state.voteTrack;
  } else {
    vtEl.style.display = 'none';
  }
}

let notifTimer;
function showNotification(text, isError) {
  const el = document.getElementById('notification');
  el.textContent = text;
  el.style.display = 'block';
  el.className = 'notification' + (isError ? ' error' : '');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => { el.style.display = 'none'; }, 3200);
}

window.showNotification = showNotification;

// Guard: if no playerId, redirect to lobby
if (!window.myId) {
  window.location.href = 'index.html';
} else {
  connect();
}
