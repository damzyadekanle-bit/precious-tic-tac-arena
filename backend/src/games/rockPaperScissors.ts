import type { GameAction, GameState, RockPaperScissorsState, RpsChoice, Seat } from '../types/game.js';
import type { GameAdapter, GameResult } from './types.js';

function requireState(state: GameState): RockPaperScissorsState {
  if (state.type !== 'rock-paper-scissors') throw new Error('Invalid game state');
  return state;
}

function beats(choice: RpsChoice, opponent: RpsChoice): boolean {
  return (
    (choice === 'rock' && opponent === 'scissors') ||
    (choice === 'paper' && opponent === 'rock') ||
    (choice === 'scissors' && opponent === 'paper')
  );
}

export const rockPaperScissors: GameAdapter = {
  type: 'rock-paper-scissors',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState() {
    return { type: 'rock-paper-scissors', choices: [null, null], winner: null };
  },
  applyAction(state: GameState, seat: Seat, action: GameAction) {
    const game = requireState(state);
    if (action.type !== 'choose-rps' || !['rock', 'paper', 'scissors'].includes(action.choice))
      throw new Error('Invalid choice');
    if (game.choices[seat]) throw new Error('You have already chosen');
    const choices = [...game.choices] as Array<RpsChoice | null>;
    choices[seat] = action.choice;
    if (!choices[0] || !choices[1]) return { ...game, choices };
    const winner = choices[0] === choices[1] ? 'draw' : beats(choices[0], choices[1]) ? 0 : 1;
    return { ...game, choices, winner };
  },
  getResult(state: GameState): GameResult {
    return { winner: requireState(state).winner };
  },
  toPublicState(state: GameState, viewerSeat?: Seat) {
    const game = requireState(state);
    return game.winner === null
      ? { ...game, choices: game.choices.map((choice, seat) => (seat === viewerSeat ? choice : null)) }
      : game;
  },
};
