import crypto from 'node:crypto';
import type { GameAction, GameState, MemoryMatchState, Seat } from '../types/game.js';
import type { GameAdapter, GameResult } from './types.js';

const symbols = ['🌙', '⭐', '🌈', '🍓', '🎲', '🚀'];

function requireState(state: GameState): MemoryMatchState {
  if (state.type !== 'memory-match') throw new Error('Invalid game state');
  return state;
}

function shuffledDeck(): string[] {
  const deck = [...symbols, ...symbols];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = crypto.randomInt(index + 1);
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

export const memoryMatch: GameAdapter = {
  type: 'memory-match',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState(startingSeat: Seat = 0) {
    return {
      type: 'memory-match',
      deck: shuffledDeck(),
      revealed: [],
      matchedBy: Array(12).fill(null),
      turn: startingSeat,
      winner: null,
      pairScores: [0, 0],
      pendingMismatch: false,
    };
  },
  applyAction(state: GameState, seat: Seat, action: GameAction) {
    const game = requireState(state);
    if (
      action.type !== 'flip' ||
      !Number.isInteger(action.index) ||
      action.index < 0 ||
      action.index >= game.deck.length ||
      game.matchedBy[action.index] !== null
    )
      throw new Error('Illegal card choice');
    if (game.turn !== seat) throw new Error('It is not your turn');
    const revealed = game.pendingMismatch ? [] : [...game.revealed];
    if (revealed.includes(action.index)) throw new Error('Card is already revealed');
    revealed.push(action.index);
    if (revealed.length === 1) return { ...game, revealed, pendingMismatch: false };
    const [first, second] = revealed;
    if (game.deck[first] === game.deck[second]) {
      const matchedBy = [...game.matchedBy];
      matchedBy[first] = seat;
      matchedBy[second] = seat;
      const pairScores: [number, number] = [...game.pairScores];
      pairScores[seat] += 1;
      const complete = matchedBy.every((owner) => owner !== null);
      const winner = complete
        ? pairScores[0] === pairScores[1]
          ? 'draw'
          : pairScores[0] > pairScores[1]
            ? 0
            : 1
        : null;
      return { ...game, revealed: [], matchedBy, pairScores, winner, pendingMismatch: false };
    }
    return { ...game, revealed, turn: seat === 0 ? 1 : 0, pendingMismatch: true };
  },
  getResult(state: GameState): GameResult {
    return { winner: requireState(state).winner };
  },
  toPublicState(state: GameState) {
    const game = requireState(state);
    return {
      type: game.type,
      cards: game.deck.map((symbol, index) =>
        game.revealed.includes(index) || game.matchedBy[index] !== null ? symbol : null,
      ),
      revealed: game.revealed,
      matchedBy: game.matchedBy,
      turn: game.turn,
      winner: game.winner,
      pairScores: game.pairScores,
    };
  },
};
