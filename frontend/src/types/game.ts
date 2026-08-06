export type GameType = 'tic-tac-toe' | 'memory-match';
export type Seat = 0 | 1;
export interface TicTacToeState {
  type: 'tic-tac-toe';
  board: Array<'X' | 'O' | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  winningLine: number[];
}
export interface MemoryMatchState {
  type: 'memory-match';
  cards: Array<string | null>;
  revealed: number[];
  matchedBy: Array<Seat | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  pairScores: [number, number];
}
export type GameState = TicTacToeState | MemoryMatchState;
export type GameAction = { type: 'place'; index: number } | { type: 'flip'; index: number };
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
  'memory-match': {
    name: 'Memory Match',
    description: 'Find the most matching pairs.',
    icon: '🃏',
  },
};
