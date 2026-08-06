const avatars = ['🚀', '🦊', '🐼', '👾', '🦁', '🐯', '🐸', '🐙'];
export function getIdentity() {
  const stored = localStorage.getItem('tta_identity');
  if (stored) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isIdentity(parsed)) return parsed;
    } catch {
      // Replace corrupt or obsolete local data with a fresh identity below.
    }
  }
  const identity = {
    playerId: crypto.randomUUID(),
    nickname: `Player ${Math.floor(Math.random() * 900 + 100)}`,
    avatar: avatars[Math.floor(Math.random() * avatars.length)],
  };
  localStorage.setItem('tta_identity', JSON.stringify(identity));
  return identity;
}

function isIdentity(
  value: unknown,
): value is { playerId: string; nickname: string; avatar: string } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.playerId === 'string' &&
    typeof candidate.nickname === 'string' &&
    typeof candidate.avatar === 'string'
  );
}
export function updateNickname(nickname: string) {
  const identity = getIdentity();
  const next = { ...identity, nickname: nickname.trim() || identity.nickname };
  localStorage.setItem('tta_identity', JSON.stringify(next));
  return next;
}
