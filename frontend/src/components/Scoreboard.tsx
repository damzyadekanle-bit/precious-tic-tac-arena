import type { GameType, PublicRoom } from '../types/game';
export function Scoreboard({
  scores,
  gameType,
}: {
  scores: PublicRoom['scores'];
  gameType: GameType;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-white/5 p-3 text-center">
        <div className="text-xs text-zinc-400">
          {gameType === 'memory-match' ? 'P1 wins' : 'X wins'}
        </div>
        <div className="text-xl font-bold">{scores.wins[0]}</div>
      </div>
      <div className="rounded-xl bg-white/5 p-3 text-center">
        <div className="text-xs text-zinc-400">Draws</div>
        <div className="text-xl font-bold">{scores.draws}</div>
      </div>
      <div className="rounded-xl bg-white/5 p-3 text-center">
        <div className="text-xs text-zinc-400">
          {gameType === 'memory-match' ? 'P2 wins' : 'O wins'}
        </div>
        <div className="text-xl font-bold">{scores.wins[1]}</div>
      </div>
    </div>
  );
}
