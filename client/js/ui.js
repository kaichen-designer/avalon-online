const ROLE_NAMES = {
  merlin: '梅林',
  assassin: '刺客',
  percival: '派西維爾',
  morgana: '莫甘娜',
  oberon: '奧伯倫',
  mordred: '莫德雷德',
  'loyal-servant': '亞瑟忠臣',
  minion: '莫德雷德爪牙',
};

const ROLE_SIDE = {
  merlin: 'good', percival: 'good', 'loyal-servant': 'good',
  assassin: 'evil', morgana: 'evil', oberon: 'evil', mordred: 'evil', minion: 'evil',
};

const ROLE_DESC = {
  merlin: '你知道壞人的身份，但不能暴露自己。',
  assassin: '若好人贏得 3 任務，你可以嘗試刺殺梅林。',
  percival: '你能看到梅林和莫甘娜，但分不清誰是誰。',
  morgana: '你假裝成梅林迷惑派西維爾。',
  oberon: '你是壞人，但壞人看不見你，你也看不見他們。',
  mordred: '你是壞人，梅林看不見你。',
  'loyal-servant': '你是好人，沒有特殊能力。',
  minion: '你是壞人，與其他壞人互相認識（奧伯倫除外）。',
};

// Required evil count per player count
const EVIL_COUNT = { 5:2, 6:2, 7:3, 8:3, 9:3, 10:4 };
// Required team size per player count per round
const TEAM_SIZE = {
  5:[2,3,2,3,3], 6:[2,3,4,3,4], 7:[2,3,3,4,4],
  8:[3,4,4,5,5], 9:[3,4,4,5,5], 10:[3,4,4,5,5],
};

const phaseEl = () => document.getElementById('phase-content');

// ── renderLobby ──────────────────────────────────────────────
function renderLobby(state) {
  const myId = window.myId;
  const isHost = sessionStorage.getItem('isHost') === '1' || state.hostId === myId;

  // Show players section
  renderPlayerChips(state.players, null, null, myId);

  let html = `
    <div class="lobby-room-code">${state.roomCode}</div>
    <div class="lobby-hint">將此房間碼分享給朋友</div>
    <div class="section"><h2>玩家（${state.players.length}/10）</h2></div>
  `;

  if (isHost) {
    const playerCount = state.players.length;
    const evilNeeded = EVIL_COUNT[playerCount] || 2;
    const goodNeeded = playerCount - evilNeeded;

    // Role selector
    const allOptional = ['percival', 'morgana', 'oberon', 'mordred'];
    const extraEvil = evilNeeded - 1; // assassin is always included
    const extraGood = goodNeeded - 1; // merlin is always included

    html += `
      <div class="section">
        <h2>角色設定（${playerCount} 人：好人 ${goodNeeded} / 壞人 ${evilNeeded}）</h2>
        <div class="role-count-info">
          必選：梅林 + 刺客。
          額外好人角色需 ${extraGood - 1} 個，額外壞人角色需 ${extraEvil - 1} 個。
        </div>
        <div class="role-selector" id="role-selector">
    `;
    allOptional.forEach(r => {
      const side = ROLE_SIDE[r];
      html += `<label class="role-toggle ${side}" data-role="${r}" data-side="${side}">${ROLE_NAMES[r]}</label>`;
    });
    html += `</div>`;
    html += `<div id="role-error" class="status-msg error" style="display:none"></div>`;
    html += `<div class="lady-toggle-row"><label><input type="checkbox" id="lady-toggle"> 啟用湖中女（可選）</label></div>`;
    html += `<button class="btn btn-primary" id="start-btn">開始遊戲</button>`;
    html += `</div>`;
  } else {
    html += `<div class="waiting-msg">等待房主開始遊戲…</div>`;
  }

  phaseEl().innerHTML = html;

  if (isHost) {
    const toggles = document.querySelectorAll('.role-toggle');
    toggles.forEach(t => {
      t.addEventListener('click', () => {
        t.classList.toggle('active');
      });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      const selected = [...document.querySelectorAll('.role-toggle.active')].map(t => t.dataset.role);
      const playerCount = state.players.length;
      const roleList = buildRoleList(playerCount, selected);
      const errEl = document.getElementById('role-error');

      if (!roleList) {
        const evilNeeded = EVIL_COUNT[playerCount] || 2;
        errEl.textContent = `角色組合無效：需要 ${evilNeeded} 個壞人、${playerCount - evilNeeded} 個好人`;
        errEl.style.display = 'block';
        return;
      }
      errEl.style.display = 'none';
      const ladyEnabled = document.getElementById('lady-toggle')?.checked || false;
      window.sendMsg({ type: 'START_GAME', roleList, ladyEnabled });
    });
  }
}

function buildRoleList(playerCount, extraRoles) {
  const evilNeeded = EVIL_COUNT[playerCount];
  if (!evilNeeded) return null;

  const extraEvil = extraRoles.filter(r => ROLE_SIDE[r] === 'evil');
  const extraGood = extraRoles.filter(r => ROLE_SIDE[r] === 'good');

  const totalEvil = 1 + extraEvil.length; // assassin + extra
  const totalGood = 1 + extraGood.length; // merlin + extra
  const loyalNeeded = playerCount - totalEvil - totalGood;
  const minionNeeded = evilNeeded - totalEvil;

  if (minionNeeded < 0 || loyalNeeded < 0) return null;
  if (totalEvil !== evilNeeded) return null;

  return [
    'merlin',
    ...extraGood,
    ...Array(loyalNeeded).fill('loyal-servant'),
    'assassin',
    ...extraEvil,
    ...Array(minionNeeded).fill('minion'),
  ];
}

// ── renderRoleReveal ─────────────────────────────────────────
function renderRoleReveal(roleInfo, players) {
  const { role, knownEvil, suspects } = roleInfo;
  const side = ROLE_SIDE[role] || 'good';
  const roleName = ROLE_NAMES[role] || role;
  const roleDesc = ROLE_DESC[role] || '';

  document.getElementById('role-section').style.display = 'block';
  const card = document.getElementById('role-card');
  card.className = `role-card ${side}`;

  const nameEl = document.getElementById('role-name');
  nameEl.textContent = roleName;
  nameEl.className = `role-name ${side}`;

  document.getElementById('role-desc').textContent = roleDesc;

  const knownEl = document.getElementById('role-known');
  if (knownEvil && knownEvil.length > 0) {
    const names = knownEvil.map(id => {
      const p = (players || []).find(x => x.id === id);
      return p ? p.name : id;
    });
    knownEl.innerHTML = `你知道的壞人：<strong>${names.join('、')}</strong>`;
  } else if (suspects && suspects.length > 0) {
    const names = suspects.map(id => {
      const p = (players || []).find(x => x.id === id);
      return p ? p.name : id;
    });
    knownEl.innerHTML = `梅林或莫甘娜（分不清）：<strong>${names.join('、')}</strong>`;
  } else {
    knownEl.textContent = '';
  }

  document.getElementById('phase-section').style.display = 'none';

  document.getElementById('acknowledge-btn').onclick = () => {
    document.getElementById('role-section').style.display = 'none';
    document.getElementById('phase-section').style.display = 'block';
    window.sendMsg({ type: 'ACKNOWLEDGE_ROLE' });
  };
}

// ── renderByPhase (dispatcher) ────────────────────────────────
function renderByPhase(state) {
  const myId = window.myId;
  document.getElementById('players-section').style.display = 'block';

  switch (state.phase) {
    case 'LOBBY':
      renderLobby(state);
      break;
    case 'ROLE_REVEAL':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      phaseEl().innerHTML = `<div class="waiting-msg">查看你的角色卡，點擊確認後繼續…</div>`;
      if (window.myRoleInfo) renderRoleReveal(window.myRoleInfo, state.players);
      break;
    case 'TEAM_PROPOSAL':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      renderTeamProposal(state, myId);
      break;
    case 'VOTE':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      renderVote(state, myId);
      break;
    case 'MISSION':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      renderMission(state, myId);
      break;
    case 'ASSASSINATION':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      renderAssassination(state, myId);
      break;
    case 'LADY_OF_LAKE':
      renderPlayerChips(state.players, state.leader, state.team, myId);
      renderLadyOfLake(state, myId);
      break;
    case 'GAME_OVER':
      document.getElementById('players-section').style.display = 'none';
      break;
  }
}

// ── renderTeamProposal ────────────────────────────────────────
function renderTeamProposal(state, myId) {
  const isLeader = state.leader === myId;
  const playerCount = state.players.length;
  const required = TEAM_SIZE[playerCount]?.[state.round - 1] ?? '?';

  if (!isLeader) {
    const leaderName = state.players.find(p => p.id === state.leader)?.name || '隊長';
    phaseEl().innerHTML = `<div class="waiting-msg">等待 <strong>${leaderName}</strong> 提名 ${required} 位任務隊員…</div>`;
    return;
  }

  // Leader: clickable player list + submit
  let html = `
    <div class="phase-title">選擇 ${required} 位任務隊員</div>
    <div class="players-list" id="team-picker">
  `;
  state.players.forEach(p => {
    html += `<div class="player-chip selectable${p.id === myId ? ' is-me' : ''}" data-id="${p.id}">${p.name}</div>`;
  });
  html += `</div>
    <div id="team-error" style="color:#ef4444;font-size:0.8rem;min-height:1.2em;margin-top:0.5rem"></div>
    <button class="btn btn-primary" id="propose-btn" style="margin-top:0.75rem">確認提名</button>
  `;
  phaseEl().innerHTML = html;

  let selected = new Set();
  document.querySelectorAll('#team-picker .player-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      if (selected.has(id)) {
        selected.delete(id);
        chip.classList.remove('selected');
      } else {
        selected.add(id);
        chip.classList.add('selected');
      }
    });
  });

  document.getElementById('propose-btn').addEventListener('click', () => {
    if (selected.size !== required) {
      document.getElementById('team-error').textContent = `請選擇 ${required} 位（目前選了 ${selected.size} 位）`;
      return;
    }
    document.getElementById('team-error').textContent = '';
    window.sendMsg({ type: 'PROPOSE_TEAM', team: [...selected] });
  });
}

// ── renderVote ────────────────────────────────────────────────
function renderVote(state, myId) {
  const teamNames = state.team.map(id => state.players.find(p => p.id === id)?.name || id);
  let html = `
    <div class="phase-title">投票：同意此任務隊伍？</div>
    <div style="margin-bottom:0.75rem;font-size:0.9rem;color:var(--text-muted)">
      提名隊伍：${teamNames.join('、')}
    </div>
  `;

  // Check if already voted (prevent double render showing buttons after vote)
  if (!window._voted) {
    html += `
      <div class="vote-btns">
        <button class="btn btn-primary" id="approve-btn">同意 ✓</button>
        <button class="btn btn-danger" id="reject-btn">拒絕 ✗</button>
      </div>
    `;
  } else {
    html += `<div class="waiting-msg">已投票，等待其他玩家…</div>`;
  }

  html += `<div style="margin-top:0.5rem;font-size:0.8rem;color:var(--text-muted)" id="vote-waiting"></div>`;
  phaseEl().innerHTML = html;

  if (!window._voted) {
    document.getElementById('approve-btn').addEventListener('click', () => {
      window._voted = true;
      window.sendMsg({ type: 'VOTE', vote: 'approve' });
      phaseEl().querySelector('.vote-btns').outerHTML = `<div class="waiting-msg">已投票：同意。等待其他玩家…</div>`;
    });
    document.getElementById('reject-btn').addEventListener('click', () => {
      window._voted = true;
      window.sendMsg({ type: 'VOTE', vote: 'reject' });
      phaseEl().querySelector('.vote-btns').outerHTML = `<div class="waiting-msg">已投票：拒絕。等待其他玩家…</div>`;
    });
  }
}

// ── renderVoteResult ──────────────────────────────────────────
function renderVoteResult(result, state) {
  window._voted = false;
  const players = state?.players || [];
  const approved = result.approved;

  let html = `
    <div class="mission-result-banner ${approved ? 'success' : 'fail'}">
      ${approved ? '✓ 投票通過！任務進行中…' : '✗ 投票未通過，換隊長提名'}
    </div>
    <div class="vote-results-grid">
  `;
  for (const [pid, vote] of Object.entries(result.votes)) {
    const name = players.find(p => p.id === pid)?.name || pid;
    html += `<div class="vote-item ${vote}">${name} — ${vote === 'approve' ? '同意' : '拒絕'}</div>`;
  }
  html += `</div>`;
  phaseEl().innerHTML = html;
}

// ── renderMission ─────────────────────────────────────────────
function renderMission(state, myId) {
  const onTeam = state.team.includes(myId);
  if (!onTeam) {
    const teamNames = state.team.map(id => state.players.find(p => p.id === id)?.name || id);
    phaseEl().innerHTML = `<div class="waiting-msg">任務進行中…<br>出任務隊員：${teamNames.join('、')}</div>`;
    return;
  }

  if (window._missionSubmitted) {
    phaseEl().innerHTML = `<div class="waiting-msg">已提交任務牌，等待其他隊員…</div>`;
    return;
  }

  const myRole = window.myRoleInfo?.role;
  const EVIL_ROLES = ['assassin', 'morgana', 'oberon', 'mordred', 'minion'];
  const isEvil = EVIL_ROLES.includes(myRole);

  let html = `<div class="phase-title">提交任務牌</div><div class="mission-btns">`;
  html += `<button class="btn btn-primary" id="success-btn">成功 ✓</button>`;
  if (isEvil) {
    html += `<button class="btn btn-danger" id="fail-btn">失敗 ✗</button>`;
  }
  html += `</div>`;
  phaseEl().innerHTML = html;

  document.getElementById('success-btn').addEventListener('click', () => {
    window._missionSubmitted = true;
    window.sendMsg({ type: 'MISSION_CARD', card: 'success' });
    phaseEl().innerHTML = `<div class="waiting-msg">已提交成功牌，等待其他隊員…</div>`;
  });

  const failBtn = document.getElementById('fail-btn');
  if (failBtn) {
    failBtn.addEventListener('click', () => {
      window._missionSubmitted = true;
      window.sendMsg({ type: 'MISSION_CARD', card: 'fail' });
      phaseEl().innerHTML = `<div class="waiting-msg">已提交失敗牌，等待其他隊員…</div>`;
    });
  }
}

// ── renderMissionResult ───────────────────────────────────────
function renderMissionResult(result) {
  window._missionSubmitted = false;
  const success = result.success;
  phaseEl().innerHTML = `
    <div class="mission-result-banner ${success ? 'success' : 'fail'}">
      第 ${result.round} 輪任務：${success ? '✓ 成功' : '✗ 失敗'}
      ${result.failCount > 0 ? `（${result.failCount} 張失敗牌）` : ''}
    </div>
  `;
}

// ── renderAssassination ───────────────────────────────────────
function renderAssassination(state, myId) {
  const myRole = window.myRoleInfo?.role;
  const isAssassin = myRole === 'assassin';

  if (!isAssassin) {
    phaseEl().innerHTML = `<div class="waiting-msg">好人贏得 3 場任務！<br>刺客正在選擇刺殺目標…</div>`;
    return;
  }

  // Show all players that are NOT known evil (assassin shouldn't pick evil)
  // Server validates anyway; show all non-self players as candidates
  let html = `
    <div class="phase-title">刺殺梅林！選擇你認為是梅林的玩家</div>
    <div class="players-list" id="assassin-picker">
  `;
  state.players.forEach(p => {
    if (p.id === myId) return;
    html += `<div class="player-chip selectable" data-id="${p.id}">${p.name}</div>`;
  });
  html += `</div>
    <button class="btn btn-danger" id="assassinate-btn" style="margin-top:0.75rem" disabled>確認刺殺</button>
  `;
  phaseEl().innerHTML = html;

  let target = null;
  document.querySelectorAll('#assassin-picker .player-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#assassin-picker .player-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      target = chip.dataset.id;
      document.getElementById('assassinate-btn').disabled = false;
    });
  });

  document.getElementById('assassinate-btn').addEventListener('click', () => {
    if (!target) return;
    window.sendMsg({ type: 'ASSASSINATE', targetId: target });
    document.getElementById('assassinate-btn').disabled = true;
    phaseEl().innerHTML = `<div class="waiting-msg">刺殺已送出，等待結果…</div>`;
  });
}

// ── renderLadyOfLake ──────────────────────────────────────────
function renderLadyOfLake(state, myId) {
  const isHolder = state.ladyHolder === myId;
  const previousHolders = state.previousLadyHolders || [];

  if (!isHolder) {
    const holderName = state.players.find(p => p.id === state.ladyHolder)?.name || '持有者';
    phaseEl().innerHTML = `<div class="waiting-msg">湖中女調查中…<br><strong>${holderName}</strong> 正在選擇調查對象</div>`;
    return;
  }

  let html = `<div class="phase-title">湖中女：選擇一位玩家調查其陣營</div><div class="players-list" id="lady-picker">`;
  state.players.forEach(p => {
    if (p.id === myId || previousHolders.includes(p.id)) return;
    html += `<div class="player-chip selectable" data-id="${p.id}">${p.name}</div>`;
  });
  html += `</div><button class="btn btn-primary" id="lady-btn" style="margin-top:0.75rem" disabled>確認調查</button>`;
  phaseEl().innerHTML = html;

  let target = null;
  document.querySelectorAll('#lady-picker .player-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#lady-picker .player-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      target = chip.dataset.id;
      document.getElementById('lady-btn').disabled = false;
    });
  });

  document.getElementById('lady-btn').addEventListener('click', () => {
    if (!target) return;
    window.sendMsg({ type: 'LADY_INVESTIGATE', targetId: target });
    phaseEl().innerHTML = `<div class="waiting-msg">調查中，等待結果…</div>`;
  });
}

// ── renderGameOver ────────────────────────────────────────────
function renderGameOver(result) {
  const winner = result.winner;
  const reasonMap = {
    five_rejections: '連續 5 次投票否決',
    three_missions: '壞人完成 3 次任務破壞',
    merlin_assassinated: '刺客成功刺殺梅林',
    merlin_survived: '刺客未能找出梅林',
    player_disconnected: '玩家斷線',
  };
  const reasonText = reasonMap[result.reason] || result.reason || '';

  const merlinName = window.gameState?.players?.find(p => p.id === result.merlinWas)?.name;

  let html = `
    <div class="game-over-banner ${winner === 'good' ? 'good' : 'evil'}">
      <h2>${winner === 'good' ? '好人勝利！' : '壞人勝利！'}</h2>
      <p>${reasonText}</p>
      ${merlinName ? `<p style="margin-top:0.5rem">梅林是：<strong>${merlinName}</strong></p>` : ''}
    </div>
    <button class="btn btn-secondary" onclick="window.location.href='index.html'">回到大廳</button>
  `;
  document.getElementById('role-section').style.display = 'none';
  document.getElementById('vote-track').style.display = 'none';
  document.getElementById('players-section').style.display = 'none';
  phaseEl().innerHTML = html;
}

// ── renderPlayerChips (shared) ────────────────────────────────
function renderPlayerChips(players, leaderId, team, myId) {
  const container = document.getElementById('players-list');
  if (!container) return;
  container.innerHTML = '';
  players.forEach(p => {
    const chip = document.createElement('div');
    let cls = 'player-chip';
    if (p.id === myId) cls += ' is-me';
    if (p.id === leaderId) cls += ' is-leader';
    if (team && team.includes(p.id)) cls += ' on-team';
    if (!p.isConnected) cls += ' disconnected';
    chip.className = cls;
    chip.textContent = p.name + (p.id === leaderId ? ' 👑' : '') + (!p.isConnected ? ' (離線)' : '');
    container.appendChild(chip);
  });
}

// Export to global
window.UI = {
  renderLobby,
  renderRoleReveal,
  renderByPhase,
  renderTeamProposal,
  renderVote,
  renderVoteResult,
  renderMission,
  renderMissionResult,
  renderAssassination,
  renderLadyOfLake,
  renderGameOver,
  renderPlayerChips,
};
