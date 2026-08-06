import type { GameAction, GameState, Seat, TicTacToeState } from '../types/game.js';
import type { GameAdapter, GameResult } from './types.js';

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function requireState(state: GameState): TicTacToeState {
  if (state.type !== 'tic-tac-toe') throw new Error('Invalid game state');
  return state;
}

export const ticTacToe: GameAdapter = {
  type: 'tic-tac-toe',
  createInitialState(startingSeat: Seat = 0) {
    return {
      type: 'tic-tac-toe',
      board: Array(9).fill(null),
      turn: startingSeat,
      winner: null,
      winningLine: [],
    };
  },
  applyAction(state: GameState, seat: Seat, action: GameAction) {
    const game = requireState(state);
    if (
      action.type !== 'place' ||
      !Number.isInteger(action.index) ||
      action.index < 0 ||
      action.index > 8 ||
      game.board[action.index] !== null
    )
      throw new Error('Illegal move');
    if (game.turn !== seat) throw new Error('It is not your turn');
    const board = [...game.board];
    board[action.index] = seat === 0 ? 'X' : 'O';
    const line = winningLines.find(
      ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c],
    );
    const winner = line ? seat : board.every(Boolean) ? 'draw' : null;
    return { ...game, board, turn: seat === 0 ? 1 : 0, winner, winningLine: line ?? [] };
  },
  getResult(state: GameState): GameResult {
    return { winner: requireState(state).winner };
  },
};
