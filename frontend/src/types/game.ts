export type GameType = 'tic-tac-toe';
export type Seat = 0 | 1;
export interface TicTacToeState {
  type: 'tic-tac-toe';
  board: Array<'X' | 'O' | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  winningLine: number[];
}
export type GameState = TicTacToeState;
export type GameAction = { type: 'place'; index: number };
export interface PublicPlayer {
  id: string;
  nickname: string;
  avatar: string;
  seat: Seat;
  connected: boolean;
  rematchRequested: boolean;
}
export interface PublicRoom {
  code: string;
  gameType: GameType;
  game: GameState;
  status: 'waiting' | 'playing' | 'finished';
  players: PublicPlayer[];
  scores: { wins: [number, number]; draws: number };
}

export const gameCatalog: Record<GameType, { name: string; description: string; icon: string }> = {
  'tic-tac-toe': { name: 'Tic-Tac-Toe', description: 'Claim three spaces in a row.', icon: '✕○' },
};
