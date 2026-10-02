import crypto from 'node:crypto';
import type { DrawAndGuessState, GameAction, GameState, Seat } from '../types/game.js';
import type { GameAdapter, GameResult } from './types.js';

const prompts = [
  { prompt: 'bicycle', category: 'Things' }, { prompt: 'volcano', category: 'Places' },
  { prompt: 'astronaut', category: 'People' }, { prompt: 'popcorn', category: 'Food' },
  { prompt: 'guitar', category: 'Things' },
];

function requireState(state: GameState): DrawAndGuessState {
  if (state.type !== 'draw-and-guess') throw new Error('Invalid game state');
  return state;
}
function normalise(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); }

export const drawAndGuess: GameAdapter = {
  type: 'draw-and-guess', minPlayers: 2, maxPlayers: 2,
  createInitialState(startingSeat: Seat = 0) {
    const selected = prompts[crypto.randomInt(prompts.length)];
    return { type: 'draw-and-guess', artistSeat: startingSeat, prompt: selected.prompt, category: selected.category, strokes: [], endsAt: null, winner: null };
  },
  applyAction(state: GameState, seat: Seat, action: GameAction) {
    const game = requireState(state);
    if (game.winner !== null) throw new Error('Round is over');
    if (action.type === 'expire-draw-round') return { ...game, endsAt: null, winner: 'draw' };
    if (action.type === 'draw-stroke') {
      if (seat !== game.artistSeat) throw new Error('Only the artist can draw');
      const { x, y, toX, toY } = action.stroke;
      if (![x, y, toX, toY].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)) throw new Error('Invalid stroke');
      if (game.strokes.length >= 2_000) throw new Error('Drawing is full');
      return { ...game, strokes: [...game.strokes, action.stroke] };
    }
    if (action.type === 'guess') {
      if (seat === game.artistSeat) throw new Error('The artist cannot guess');
      if (normalise(action.guess) !== normalise(game.prompt)) throw new Error('Not quite — keep guessing');
      return { ...game, endsAt: null, winner: seat };
    }
    throw new Error('Invalid action');
  },
  getResult(state: GameState): GameResult { return { winner: requireState(state).winner }; },
  toPublicState(state: GameState, viewerSeat?: Seat) {
    const game = requireState(state);
    return { ...game, prompt: viewerSeat === game.artistSeat || game.winner !== null ? game.prompt : null, wordLength: game.prompt.length };
  },
};
