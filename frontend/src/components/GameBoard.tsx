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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid aspect-square w-full max-w-md grid-cols-3 gap-3"
      role="grid"
      aria-label="Tic-tac-toe board"
    >
      {room.game.board.map((cell, index) => {
        const win = room.game.winningLine.includes(index);
        return (
          <motion.button
            key={index}
            type="button"
            whileHover={!disabled && !cell ? { scale: 1.03 } : undefined}
            whileTap={!disabled && !cell ? { scale: 0.97 } : undefined}
            onClick={() => onMove(index)}
            disabled={disabled || Boolean(cell)}
            aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ', empty'}`}
            className={`relative rounded-2xl border text-5xl font-black sm:text-6xl ${win ? 'animate-pulse border-amber-300 bg-amber-300/20 shadow-[0_0_30px_rgba(251,191,36,.3)]' : 'border-white/10 bg-white/5 hover:bg-white/10'} disabled:cursor-not-allowed`}
          >
            <motion.span
              initial={cell ? { scale: 0, rotate: -20 } : false}
              animate={{ scale: 1, rotate: 0 }}
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
