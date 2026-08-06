import type { GameAction, GameState, GameType, PublicGameState, Seat } from '../types/game.js';

export interface GameResult {
  winner: Seat | 'draw' | null;
}

export interface GameAdapter {
  readonly type: GameType;
  createInitialState(startingSeat?: Seat): GameState;
  applyAction(state: GameState, seat: Seat, action: GameAction): GameState;
  getResult(state: GameState): GameResult;
  toPublicState(state: GameState): PublicGameState;
}
