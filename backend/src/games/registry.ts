import type { GameType } from '../types/game.js';
import { ticTacToe } from './ticTacToe.js';
import { memoryMatch } from './memoryMatch.js';
import { iCallOn } from './iCallOn.js';
import { rockPaperScissors } from './rockPaperScissors.js';
import { drawAndGuess } from './drawAndGuess.js';
import type { GameAdapter } from './types.js';

const games: Record<GameType, GameAdapter> = {
  'tic-tac-toe': ticTacToe,
  'memory-match': memoryMatch,
  'i-call-on': iCallOn,
  'rock-paper-scissors': rockPaperScissors,
  'draw-and-guess': drawAndGuess,
};

export function getGame(type: GameType): GameAdapter {
  const game = games[type];
  if (!game) throw new Error('Unsupported game');
  return game;
}

export const availableGames = Object.keys(games) as GameType[];
