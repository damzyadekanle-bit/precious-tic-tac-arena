export type GameType = 'tic-tac-toe' | 'memory-match';
export type GameStatus = 'waiting' | 'playing' | 'finished';
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
  deck: string[];
  revealed: number[];
  matchedBy: Array<Seat | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  pairScores: [number, number];
  pendingMismatch: boolean;
}

export interface PublicMemoryMatchState {
  type: 'memory-match';
  cards: Array<string | null>;
  revealed: number[];
  matchedBy: Array<Seat | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  pairScores: [number, number];
}

export type GameState = TicTacToeState | MemoryMatchState;
export type PublicGameState = TicTacToeState | PublicMemoryMatchState;
export type GameAction = { type: 'place'; index: number } | { type: 'flip'; index: number };

export interface Player {
  id: string;
  socketId: string;
  reconnectToken: string;
  nickname: string;
  avatar: string;
  seat: Seat;
  connected: boolean;
  rematchRequested: boolean;
}

export interface Room {
  code: string;
  gameType: GameType;
  game: GameState;
  status: GameStatus;
  players: Player[];
  scores: { wins: [number, number]; draws: number };
  createdAt: number;
}

export interface PublicRoom {
  code: string;
  gameType: GameType;
  game: PublicGameState;
  status: GameStatus;
  players: Array<
    Pick<Player, 'id' | 'nickname' | 'avatar' | 'seat' | 'connected' | 'rematchRequested'>
  >;
  scores: Room['scores'];
}
