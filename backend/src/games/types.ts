import type { GameAction, GameState, GameType, PublicGameState, Seat } from '../types/game.js';

export interface GameResult {
  winner: Seat | 'draw' | null;
}

export interface GameAdapter {
  readonly type: GameType;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly managesLobby?: boolean;
  createInitialState(startingSeat?: Seat): GameState;
  applyAction(
    state: GameState,
    seat: Seat,
    action: GameAction,
    context?: { playerCount: number; now: number },
  ): GameState;
  getResult(state: GameState): GameResult;
  toPublicState(state: GameState, viewerSeat?: Seat): PublicGameState;
}
