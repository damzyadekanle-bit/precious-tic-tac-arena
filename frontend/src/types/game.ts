export type GameType = 'tic-tac-toe' | 'memory-match' | 'i-call-on';
export type Seat = number;
export type ICallOnCategory = 'name' | 'animal' | 'food' | 'place' | 'thing';
export type ICallOnAnswers = Record<ICallOnCategory, string>;
export interface ICallOnState {
  type: 'i-call-on';
  phase: 'LOBBY' | 'ROUND_SETUP' | 'PLAYING' | 'REVIEWING' | 'ROUND_RESULTS' | 'GAME_OVER';
  hostSeat: Seat;
  callerSeat: Seat;
  round: number;
  letter: string | null;
  usedLetters: string[];
  durationSeconds: number;
  endsAt: number | null;
  winner: null;
  totals: number[];
  roundPoints: Record<number, Record<ICallOnCategory, number>>;
  myAnswers: ICallOnAnswers;
  reviewTarget: { seat: Seat; answers: ICallOnAnswers } | null;
  myDecisions: Partial<Record<ICallOnCategory, boolean>>;
}
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
export type GameState = TicTacToeState | MemoryMatchState | ICallOnState;
export type GameAction = { type: 'place'; index: number } | { type: 'flip'; index: number };
export type ICallOnAction =
  | { type: 'start-game' }
  | { type: 'start-round'; letter: string; durationSeconds: number }
  | { type: 'update-answers'; answers: ICallOnAnswers }
  | { type: 'hands-up' }
  | { type: 'review'; category: ICallOnCategory; correct: boolean }
  | { type: 'next-round' }
  | { type: 'end-game' }
  | { type: 'play-again' };
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
  scores: { wins: number[]; draws: number };
}

export const gameCatalog: Record<GameType, { name: string; description: string; icon: string }> = {
  'tic-tac-toe': { name: 'Tic-Tac-Toe', description: 'Claim three spaces in a row.', icon: '✕○' },
  'memory-match': {
    name: 'Memory Match',
    description: 'Find the most matching pairs.',
    icon: '🃏',
  },
  'i-call-on': { name: 'I Call On', description: 'Race through five categories.', icon: '📣' },
};
