import assert from 'node:assert/strict';
import test from 'node:test';
import { categories, iCallOn } from '../src/games/iCallOn.js';
import type { ICallOnAnswers, ICallOnState } from '../src/types/game.js';

const answers = (value: string): ICallOnAnswers => ({
  name: value,
  animal: value,
  food: value,
  place: value,
  thing: value,
});
const context = { playerCount: 3, now: 1_000 };
function start(): ICallOnState {
  let state = iCallOn.createInitialState();
  state = iCallOn.applyAction(state, 0, { type: 'start-game' }, context);
  state = iCallOn.applyAction(
    state,
    0,
    { type: 'start-round', letter: 'N', durationSeconds: 30 },
    context,
  );
  return state as ICallOnState;
}

test('requires two players and only lets the Caller choose a letter', () => {
  const lobby = iCallOn.createInitialState();
  assert.throws(
    () => iCallOn.applyAction(lobby, 0, { type: 'start-game' }, { playerCount: 1, now: 0 }),
    /2 players/,
  );
  const setup = iCallOn.applyAction(lobby, 0, { type: 'start-game' }, context);
  assert.throws(
    () =>
      iCallOn.applyAction(
        setup,
        1,
        { type: 'start-round', letter: 'N', durationSeconds: 30 },
        context,
      ),
    /Caller/,
  );
});

test('keeps answers private and assigns cyclic reviewers', () => {
  let state = start();
  state = iCallOn.applyAction(
    state,
    0,
    { type: 'update-answers', answers: answers('Nigeria') },
    context,
  );
  const view = iCallOn.toPublicState(state, 1);
  assert.equal(view.type, 'i-call-on');
  if (view.type === 'i-call-on') assert.equal(view.myAnswers.name, '');
  state = iCallOn.applyAction(state, -1, { type: 'expire-round' }, context) as ICallOnState;
  assert.deepEqual(state.reviewerFor, { 0: 1, 1: 2, 2: 0 });
});

test('scores valid duplicates at five and unique answers at ten', () => {
  let state: GameStateLike = start();
  state = iCallOn.applyAction(
    state,
    0,
    { type: 'update-answers', answers: answers(' Nigeria ') },
    context,
  );
  state = iCallOn.applyAction(
    state,
    1,
    { type: 'update-answers', answers: answers('NIGERIA') },
    context,
  );
  state = iCallOn.applyAction(
    state,
    2,
    { type: 'update-answers', answers: answers('Namibia') },
    context,
  );
  state = iCallOn.applyAction(state, -1, { type: 'expire-round' }, context);
  for (let reviewer = 0; reviewer < 3; reviewer += 1)
    for (const category of categories)
      state = iCallOn.applyAction(
        state,
        reviewer,
        { type: 'review', category, correct: true },
        context,
      );
  const result = state as ICallOnState;
  assert.equal(result.roundPoints[0].name, 5);
  assert.equal(result.roundPoints[2].name, 10);
  assert.deepEqual(result.totals, [25, 25, 50]);
});

test('rotates Caller and prevents reused letters', () => {
  let state: GameStateLike = start();
  state = iCallOn.applyAction(state, -1, { type: 'expire-round' }, context);
  for (let reviewer = 0; reviewer < 3; reviewer += 1)
    for (const category of categories)
      state = iCallOn.applyAction(
        state,
        reviewer,
        { type: 'review', category, correct: false },
        context,
      );
  state = iCallOn.applyAction(state, 1, { type: 'next-round' }, context);
  assert.equal((state as ICallOnState).callerSeat, 1);
  assert.throws(
    () =>
      iCallOn.applyAction(
        state,
        1,
        { type: 'start-round', letter: 'n', durationSeconds: 30 },
        context,
      ),
    /unused/,
  );
});

type GameStateLike = Parameters<typeof iCallOn.applyAction>[0];
