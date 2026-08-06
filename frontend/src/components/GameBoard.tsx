import { motion } from 'framer-motion';
import type { PublicRoom } from '../types/game';

export function GameBoard({
  room,
  disabled,
  onMove,
}: {
  room: PublicRoom;
  disabled: boolean;
  onMove: (index: number) => void;
}) {
  if (room.game.type === 'memory-match')
    return <MemoryBoard game={room.game} disabled={disabled} onMove={onMove} />;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid aspect-square w-full max-w-md grid-cols-3 gap-3"
      role="grid"
      aria-label="Tic-tac-toe board"
    >
      {room.game.board.map((cell, index) => {
        const win = room.game.type === 'tic-tac-toe' && room.game.winningLine.includes(index);
        return (
          <motion.button
            key={index}
            type="button"
            whileHover={!disabled && !cell ? { scale: 1.03 } : undefined}
            whileTap={!disabled && !cell ? { scale: 0.97 } : undefined}
            onClick={() => onMove(index)}
            disabled={disabled || Boolean(cell)}
            aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ', empty'}`}
            className={`relative rounded-2xl border text-5xl font-black sm:text-6xl ${win ? 'animate-pulse border-amber-300 bg-amber-300/20' : 'border-white/10 bg-white/5 hover:bg-white/10'} disabled:cursor-not-allowed`}
          >
            <motion.span
              animate={{ scale: 1 }}
              className={cell === 'X' ? 'text-amber-300' : 'text-fuchsia-300'}
            >
              {cell}
            </motion.span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

function MemoryBoard({
  game,
  disabled,
  onMove,
}: {
  game: Extract<PublicRoom['game'], { type: 'memory-match' }>;
  disabled: boolean;
  onMove: (index: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid w-full max-w-lg grid-cols-3 gap-3 sm:grid-cols-4"
      role="grid"
      aria-label="Memory match cards"
    >
      {game.cards.map((symbol, index) => {
        const owner = game.matchedBy[index];
        return (
          <motion.button
            key={index}
            type="button"
            whileHover={!disabled && owner === null ? { y: -3 } : undefined}
            onClick={() => onMove(index)}
            disabled={disabled || owner !== null || game.revealed.includes(index)}
            aria-label={
              symbol
                ? `Card ${index + 1}, ${symbol}${owner !== null ? ', matched' : ''}`
                : `Card ${index + 1}, face down`
            }
            className={`aspect-[4/5] rounded-2xl border text-4xl shadow-lg sm:text-5xl ${symbol ? (owner === 0 ? 'border-amber-300/60 bg-amber-300/15' : owner === 1 ? 'border-fuchsia-400/60 bg-fuchsia-400/15' : 'border-white/30 bg-zinc-800') : 'border-white/10 bg-gradient-to-br from-amber-300 to-orange-500 text-zinc-950'} disabled:cursor-not-allowed`}
          >
            <motion.span animate={{ rotateY: symbol ? 0 : 180 }}>{symbol ?? 'D'}</motion.span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
