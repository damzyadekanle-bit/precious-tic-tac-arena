import type {
  GameAction,
  GameState,
  ICallOnAnswers,
  ICallOnCategory,
  ICallOnState,
  Seat,
} from '../types/game.js';
import type { GameAdapter } from './types.js';

export const categories: ICallOnCategory[] = ['name', 'animal', 'food', 'place', 'thing'];
const blankAnswers = (): ICallOnAnswers => ({
  name: '',
  animal: '',
  food: '',
  place: '',
  thing: '',
});
const requireState = (state: GameState): ICallOnState => {
  if (state.type !== 'i-call-on') throw new Error('Invalid game state');
  return state;
};
const clean = (answers: ICallOnAnswers): ICallOnAnswers =>
  Object.fromEntries(
    categories.map((category) => [
      category,
      String(answers[category] ?? '')
        .trim()
        .slice(0, 60),
    ]),
  ) as ICallOnAnswers;

function beginReview(game: ICallOnState, playerCount: number): ICallOnState {
  const reviewerFor: Record<number, Seat> = {};
  for (let seat = 0; seat < playerCount; seat += 1) reviewerFor[seat] = (seat + 1) % playerCount;
  return { ...game, phase: 'REVIEWING', endsAt: null, reviewerFor, decisions: {} };
}

function score(game: ICallOnState, playerCount: number): ICallOnState {
  const roundPoints: ICallOnState['roundPoints'] = {};
  const totals = [...game.totals];
  for (let seat = 0; seat < playerCount; seat += 1) {
    roundPoints[seat] = { name: 0, animal: 0, food: 0, place: 0, thing: 0 };
    const reviewer = Object.entries(game.reviewerFor).find(([, target]) => target === seat)?.[0];
    for (const category of categories) {
      const answer = game.answers[seat]?.[category]?.trim() ?? '';
      const valid = reviewer !== undefined && game.decisions[Number(reviewer)]?.[category] === true;
      if (!answer || !valid) continue;
      const normalized = answer.toLocaleLowerCase();
      const duplicate =
        Object.values(game.answers).filter(
          (entry) => entry[category]?.trim().toLocaleLowerCase() === normalized,
        ).length > 1;
      roundPoints[seat][category] = duplicate ? 5 : 10;
      totals[seat] = (totals[seat] ?? 0) + roundPoints[seat][category];
    }
  }
  return { ...game, phase: 'ROUND_RESULTS', roundPoints, totals };
}

export const iCallOn: GameAdapter = {
  type: 'i-call-on',
  minPlayers: 2,
  maxPlayers: 12,
  managesLobby: true,
  createInitialState() {
    return {
      type: 'i-call-on',
      phase: 'LOBBY',
      hostSeat: 0,
      callerSeat: 0,
      round: 0,
      letter: null,
      usedLetters: [],
      durationSeconds: 60,
      endsAt: null,
      winner: null,
      answers: {},
      reviewerFor: {},
      decisions: {},
      roundPoints: {},
      totals: [],
    };
  },
  applyAction(
    state: GameState,
    seat: Seat,
    action: GameAction,
    context = { playerCount: 2, now: Date.now() },
  ) {
    const game = requireState(state);
    if (action.type === 'start-game') {
      if (seat !== game.hostSeat) throw new Error('Only the host can start');
      if (context.playerCount < 2) throw new Error('At least 2 players are required');
      if (game.phase !== 'LOBBY') throw new Error('Game has already started');
      return {
        ...game,
        phase: 'ROUND_SETUP',
        round: 1,
        callerSeat: 0,
        totals: Array(context.playerCount).fill(0),
      };
    }
    if (action.type === 'start-round') {
      const letter = action.letter.toUpperCase();
      const durations = [15, 30, 45, 60, 90, 120, 180, 300];
      if (game.phase !== 'ROUND_SETUP' || seat !== game.callerSeat)
        throw new Error('Only the Caller can start this round');
      if (!/^[A-Z]$/.test(letter) || game.usedLetters.includes(letter))
        throw new Error('Choose an unused letter');
      if (!durations.includes(action.durationSeconds)) throw new Error('Invalid timer');
      const answers = Object.fromEntries(
        Array.from({ length: context.playerCount }, (_, playerSeat) => [
          playerSeat,
          blankAnswers(),
        ]),
      );
      return {
        ...game,
        phase: 'PLAYING',
        letter,
        usedLetters: [...game.usedLetters, letter],
        durationSeconds: action.durationSeconds,
        endsAt: context.now + action.durationSeconds * 1000,
        answers,
        decisions: {},
        reviewerFor: {},
        roundPoints: {},
      };
    }
    if (action.type === 'update-answers') {
      if (game.phase !== 'PLAYING') throw new Error('Round is not accepting answers');
      return { ...game, answers: { ...game.answers, [seat]: clean(action.answers) } };
    }
    if (action.type === 'hands-up') {
      if (game.phase !== 'PLAYING' || seat !== game.callerSeat)
        throw new Error('Only the Caller can call Hands Up');
      if (categories.some((category) => !game.answers[seat]?.[category]?.trim()))
        throw new Error('Complete every category first');
      return beginReview(game, context.playerCount);
    }
    if (action.type === 'expire-round')
      return game.phase === 'PLAYING' ? beginReview(game, context.playerCount) : game;
    if (action.type === 'review') {
      if (game.phase !== 'REVIEWING' || !(seat in game.reviewerFor))
        throw new Error('No review assigned');
      const decisions = {
        ...game.decisions,
        [seat]: { ...game.decisions[seat], [action.category]: action.correct },
      };
      const next = { ...game, decisions };
      return Array.from({ length: context.playerCount }, (_, playerSeat) =>
        categories.every((category) => typeof decisions[playerSeat]?.[category] === 'boolean'),
      ).every(Boolean)
        ? score(next, context.playerCount)
        : next;
    }
    if (action.type === 'next-round') {
      const nextCaller = (game.callerSeat + 1) % context.playerCount;
      if (game.phase !== 'ROUND_RESULTS' || seat !== nextCaller)
        throw new Error('Only the next Caller can continue');
      if (game.usedLetters.length >= 26) return { ...game, phase: 'GAME_OVER' };
      return {
        ...game,
        phase: 'ROUND_SETUP',
        round: game.round + 1,
        callerSeat: nextCaller,
        letter: null,
      };
    }
    if (action.type === 'end-game') {
      if (seat !== game.hostSeat) throw new Error('Only the host can end the game');
      return { ...game, phase: 'GAME_OVER', endsAt: null };
    }
    if (action.type === 'play-again') {
      if (seat !== game.hostSeat || game.phase !== 'GAME_OVER')
        throw new Error('Only the host can play again');
      return this.createInitialState();
    }
    throw new Error('Action is not available now');
  },
  getResult() {
    return { winner: null };
  },
  toPublicState(state: GameState, viewerSeat = -1) {
    const game = requireState(state);
    const target = game.reviewerFor[viewerSeat];
    return {
      ...game,
      answers: undefined,
      decisions: undefined,
      myAnswers: game.answers[viewerSeat] ?? blankAnswers(),
      reviewTarget:
        game.phase === 'REVIEWING' && target !== undefined
          ? { seat: target, answers: game.answers[target] ?? blankAnswers() }
          : null,
      myDecisions: game.decisions[viewerSeat] ?? {},
    } as ReturnType<GameAdapter['toPublicState']>;
  },
};
