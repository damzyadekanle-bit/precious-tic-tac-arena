export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: string;
  mark: Mark;
  connected: boolean;
  rematchRequested: boolean;
}

export interface Room {
  code: string;
  board: Cell[];
  turn: Mark;
  status: GameStatus;
  winner: Mark | 'draw' | null;
  winningLine: number[];
  players: Player[];
  scores: { X: number; O: number; draws: number };
  createdAt: number;
}

export interface PublicRoom {
  code: string;
  board: Cell[];
  turn: Mark;
  status: GameStatus;
  winner: Mark | 'draw' | null;
  winningLine: number[];
  players: Array<Pick<Player, 'id' | 'nickname' | 'avatar' | 'mark' | 'connected' | 'rematchRequested'>>;
  scores: Room['scores'];
}
