import assert from 'node:assert/strict';
import test from 'node:test';
import { ticTacToe } from '../src/games/ticTacToe.js';

test('tic-tac-toe adapter applies actions and reports a winner', () => {
  let state = ticTacToe.createInitialState();
  state = ticTacToe.applyAction(state, 0, { type: 'place', index: 0 });
  state = ticTacToe.applyAction(state, 1, { type: 'place', index: 3 });
  state = ticTacToe.applyAction(state, 0, { type: 'place', index: 1 });
  state = ticTacToe.applyAction(state, 1, { type: 'place', index: 4 });
  state = ticTacToe.applyAction(state, 0, { type: 'place', index: 2 });
  assert.deepEqual(ticTacToe.getResult(state), { winner: 0 });
});

test('tic-tac-toe adapter rejects out-of-turn and occupied-cell actions', () => {
  const state = ticTacToe.createInitialState();
  assert.throws(() => ticTacToe.applyAction(state, 1, { type: 'place', index: 0 }), /turn/);
  const next = ticTacToe.applyAction(state, 0, { type: 'place', index: 0 });
  assert.throws(() => ticTacToe.applyAction(next, 1, { type: 'place', index: 0 }), /Illegal/);
});
