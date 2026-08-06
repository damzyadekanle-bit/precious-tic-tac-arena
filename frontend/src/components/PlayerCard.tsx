import type { GameType, PublicPlayer } from '../types/game';
export function PlayerCard({
  player,
  active,
  gameType,
}: {
  player?: PublicPlayer;
  active: boolean;
  gameType: GameType;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${active ? 'border-amber-300 bg-amber-300/10' : 'border-white/10 bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{player?.avatar ?? '⏳'}</div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{player?.nickname ?? 'Waiting...'}</p>
          <p className="text-sm text-zinc-400">
            {player
              ? `${gameType === 'memory-match' ? `Player ${player.seat + 1}` : player.seat === 0 ? 'X' : 'O'} · ${player.connected ? 'Online' : 'Disconnected'}`
              : 'Open slot'}
          </p>
        </div>
      </div>
    </div>
  );
}
