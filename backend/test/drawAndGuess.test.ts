import assert from 'node:assert/strict';
import test from 'node:test';
import { drawAndGuess } from '../src/games/drawAndGuess.js';

test('draw-and-guess keeps the prompt private from the guesser and accepts a correct guess', () => {
  let state = drawAndGuess.createInitialState(0);
  const artistView = drawAndGuess.toPublicState(state, 0);
  const guesserView = drawAndGuess.toPublicState(state, 1);
  assert.equal(guesserView.prompt, null);
  assert.ok(artistView.prompt);
  state = drawAndGuess.applyAction(state, 1, { type: 'guess', guess: artistView.prompt! });
  assert.deepEqual(drawAndGuess.getResult(state), { winner: 1 });
});

test('draw-and-guess rejects strokes from a guesser', () => {
  const state = drawAndGuess.createInitialState(0);
  assert.throws(() => drawAndGuess.applyAction(state, 1, { type: 'draw-stroke', stroke: { x: 0, y: 0, toX: 1, toY: 1 } }), /artist/);
});
