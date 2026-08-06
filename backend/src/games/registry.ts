import type { GameType } from '../types/game.js';
import { ticTacToe } from './ticTacToe.js';
import { memoryMatch } from './memoryMatch.js';
import type { GameAdapter } from './types.js';

const games: Record<GameType, GameAdapter> = {
  'tic-tac-toe': ticTacToe,
  'memory-match': memoryMatch,
};

export function getGame(type: GameType): GameAdapter {
  const game = games[type];
  if (!game) throw new Error('Unsupported game');
  return game;
}

export const availableGames = Object.keys(games) as GameType[];
