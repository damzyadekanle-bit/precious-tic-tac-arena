import assert from 'node:assert/strict';
import test from 'node:test';
import { rockPaperScissors } from '../src/games/rockPaperScissors.js';

test('rock-paper-scissors hides an unrevealed opponent choice and resolves the round', () => {
  let state = rockPaperScissors.createInitialState();
  state = rockPaperScissors.applyAction(state, 0, { type: 'choose-rps', choice: 'rock' });
  assert.deepEqual(rockPaperScissors.toPublicState(state, 1).choices, [null, null]);
  state = rockPaperScissors.applyAction(state, 1, { type: 'choose-rps', choice: 'scissors' });
  assert.deepEqual(rockPaperScissors.getResult(state), { winner: 0 });
});
