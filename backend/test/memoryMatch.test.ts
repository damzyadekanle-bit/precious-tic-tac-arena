import assert from 'node:assert/strict';
import test from 'node:test';
import { memoryMatch } from '../src/games/memoryMatch.js';
import type { MemoryMatchState } from '../src/types/game.js';

function fixedGame(): MemoryMatchState {
  return {
    type: 'memory-match',
    deck: ['A', 'A', 'B', 'B'],
    revealed: [],
    matchedBy: Array(4).fill(null),
    turn: 0,
    winner: null,
    pairScores: [0, 0],
    pendingMismatch: false,
  };
}

test('memory match hides face-down card values from public state', () => {
  const publicState = memoryMatch.toPublicState(fixedGame());
  assert.equal(publicState.type, 'memory-match');
  if (publicState.type === 'memory-match')
    assert.deepEqual(publicState.cards, [null, null, null, null]);
});

test('memory match awards pairs and keeps the turn after a match', () => {
  let state = memoryMatch.applyAction(fixedGame(), 0, { type: 'flip', index: 0 });
  state = memoryMatch.applyAction(state, 0, { type: 'flip', index: 1 });
  assert.equal(state.type, 'memory-match');
  if (state.type === 'memory-match') {
    assert.deepEqual(state.pairScores, [1, 0]);
    assert.equal(state.turn, 0);
  }
});

test('memory match passes the turn after a mismatch', () => {
  let state = memoryMatch.applyAction(fixedGame(), 0, { type: 'flip', index: 0 });
  state = memoryMatch.applyAction(state, 0, { type: 'flip', index: 2 });
  assert.equal(state.type, 'memory-match');
  if (state.type === 'memory-match') {
    assert.equal(state.turn, 1);
    assert.equal(state.pendingMismatch, true);
  }
});
