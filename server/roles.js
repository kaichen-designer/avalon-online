const ROLES = {
  MERLIN: 'merlin',
  ASSASSIN: 'assassin',
  PERCIVAL: 'percival',
  MORGANA: 'morgana',
  OBERON: 'oberon',
  MORDRED: 'mordred',
  LOYAL: 'loyal-servant',
  MINION: 'minion',
};

const EVIL_ROLES = new Set([
  ROLES.ASSASSIN,
  ROLES.MORGANA,
  ROLES.OBERON,
  ROLES.MORDRED,
  ROLES.MINION,
]);

const GOOD_ROLES = new Set([
  ROLES.MERLIN,
  ROLES.PERCIVAL,
  ROLES.LOYAL,
]);

// Required evil player count per total player count
const EVIL_COUNT_BY_PLAYERS = {
  5: 2,
  6: 2,
  7: 3,
  8: 3,
  9: 3,
  10: 4,
};

/**
 * Returns the role-specific visible info for a player.
 * allPlayers: [{ id, role }]
 * Returns: { knownEvil?: string[], suspects?: string[] }
 */
function getVisibleInfo(role, playerId, allPlayers) {
  switch (role) {
    case ROLES.MERLIN: {
      // Sees all evil except Mordred
      const knownEvil = allPlayers
        .filter(p => p.id !== playerId && EVIL_ROLES.has(p.role) && p.role !== ROLES.MORDRED)
        .map(p => p.id);
      return { knownEvil };
    }
    case ROLES.PERCIVAL: {
      // Sees Merlin + Morgana as indistinguishable suspects
      const suspects = allPlayers
        .filter(p => p.id !== playerId && (p.role === ROLES.MERLIN || p.role === ROLES.MORGANA))
        .map(p => p.id);
      return { suspects };
    }
    case ROLES.MORGANA:
    case ROLES.MORDRED:
    case ROLES.ASSASSIN:
    case ROLES.MINION: {
      // Sees all evil except Oberon (and not self)
      const knownEvil = allPlayers
        .filter(p => p.id !== playerId && EVIL_ROLES.has(p.role) && p.role !== ROLES.OBERON)
        .map(p => p.id);
      return { knownEvil };
    }
    case ROLES.OBERON: {
      // Sees no one
      return { knownEvil: [] };
    }
    case ROLES.LOYAL:
    default: {
      return {};
    }
  }
}

function isEvil(role) {
  return EVIL_ROLES.has(role);
}

function isGood(role) {
  return GOOD_ROLES.has(role);
}

function getAlignment(role) {
  return EVIL_ROLES.has(role) ? 'evil' : 'good';
}

module.exports = { ROLES, EVIL_ROLES, GOOD_ROLES, EVIL_COUNT_BY_PLAYERS, getVisibleInfo, isEvil, isGood, getAlignment };
