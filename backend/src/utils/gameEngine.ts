import type { Cell, Mark } from '../types/game.js';

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

export class GameEngine {
  static checkWinner(board: Cell[]): { winner: Mark | null; line: number[] } {
    for (const line of winningLines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return { winner: null, line: [] };
  }

  static isDraw(board: Cell[]): boolean {
    return board.every(Boolean) && !this.checkWinner(board).winner;
  }

  static nextTurn(turn: Mark): Mark {
    return turn === 'X' ? 'O' : 'X';
  }

  static resetBoard(): Cell[] {
    return Array<Cell>(9).fill(null);
  }

  static validateMove(board: Cell[], index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < 9 && board[index] === null;
  }
}
