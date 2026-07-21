const avatars = ['🚀','🦊','🐼','👾','🦁','🐯','🐸','🐙'];
export function getIdentity() {
  const stored = localStorage.getItem('tta_identity');
  if (stored) return JSON.parse(stored) as { playerId: string; nickname: string; avatar: string };
  const identity = { playerId: crypto.randomUUID(), nickname: `Player ${Math.floor(Math.random() * 900 + 100)}`, avatar: avatars[Math.floor(Math.random() * avatars.length)] };
  localStorage.setItem('tta_identity', JSON.stringify(identity));
  return identity;
}
export function updateNickname(nickname: string) {
  const identity = getIdentity();
  const next = { ...identity, nickname: nickname.trim() || identity.nickname };
  localStorage.setItem('tta_identity', JSON.stringify(next));
  return next;
}
