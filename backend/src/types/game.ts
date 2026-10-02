export type GameType = 'tic-tac-toe' | 'memory-match' | 'i-call-on' | 'rock-paper-scissors' | 'draw-and-guess';
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Seat = number;
export type ICallOnCategory = 'name' | 'animal' | 'food' | 'place' | 'thing';
export type ICallOnAnswers = Record<ICallOnCategory, string>;
export type ICallOnPhase =
  'LOBBY' | 'ROUND_SETUP' | 'PLAYING' | 'REVIEWING' | 'ROUND_RESULTS' | 'GAME_OVER';

export interface ICallOnState {
  type: 'i-call-on';
  phase: ICallOnPhase;
  hostSeat: Seat;
  callerSeat: Seat;
  round: number;
  letter: string | null;
  usedLetters: string[];
  durationSeconds: number;
  endsAt: number | null;
  winner: null;
  answers: Record<number, ICallOnAnswers>;
  reviewerFor: Record<number, Seat>;
  decisions: Record<number, Partial<Record<ICallOnCategory, boolean>>>;
  roundPoints: Record<number, Record<ICallOnCategory, number>>;
  totals: number[];
}

export interface PublicICallOnState extends Omit<ICallOnState, 'answers' | 'decisions'> {
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
  deck: string[];
  revealed: number[];
  matchedBy: Array<Seat | null>;
  turn: Seat;
  winner: Seat | 'draw' | null;
  pairScores: [number, number];
  pendingMismatch: boolean;
}

export type RpsChoice = 'rock' | 'paper' | 'scissors';
export interface RockPaperScissorsState {
  type: 'rock-paper-scissors';
  choices: Array<RpsChoice | null>;
  winner: Seat | 'draw' | null;
}

export interface DrawStroke {
  x: number;
  y: number;
  toX: number;
  toY: number;
}
export interface DrawAndGuessState {
  type: 'draw-and-guess';
  artistSeat: Seat;
  prompt: string;
  category: string;
  strokes: DrawStroke[];
  endsAt: number | null;
  winner: Seat | 'draw' | null;
}
export interface PublicDrawAndGuessState extends Omit<DrawAndGuessState, 'prompt'> {
  prompt: string | null;
  wordLength: number;
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

export type GameState = TicTacToeState | MemoryMatchState | ICallOnState | RockPaperScissorsState | DrawAndGuessState;
export type PublicGameState = TicTacToeState | PublicMemoryMatchState | PublicICallOnState | RockPaperScissorsState | PublicDrawAndGuessState;
export type GameAction =
  | { type: 'place'; index: number }
  | { type: 'flip'; index: number }
  | { type: 'start-game' }
  | { type: 'start-round'; letter: string; durationSeconds: number }
  | { type: 'update-answers'; answers: ICallOnAnswers }
  | { type: 'hands-up' }
  | { type: 'review'; category: ICallOnCategory; correct: boolean }
  | { type: 'next-round' }
  | { type: 'end-game' }
  | { type: 'play-again' }
  | { type: 'expire-round' }
  | { type: 'choose-rps'; choice: RpsChoice }
  | { type: 'draw-stroke'; stroke: DrawStroke }
  | { type: 'guess'; guess: string }
  | { type: 'expire-draw-round' };

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
  scores: { wins: number[]; draws: number };
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
