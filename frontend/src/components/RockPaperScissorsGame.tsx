import type { PublicPlayer, RockPaperScissorsState, RpsChoice } from '../types/game';

const choices: Array<{ choice: RpsChoice; icon: string }> = [
  { choice: 'rock', icon: '✊' }, { choice: 'paper', icon: '✋' }, { choice: 'scissors', icon: '✌️' },
];

export function RockPaperScissorsGame({ game, me, disabled = false, onChoose }: { game: RockPaperScissorsState; me?: PublicPlayer; disabled?: boolean; onChoose: (choice: RpsChoice) => void }) {
  const mine = me ? game.choices[me.seat] : null;
  return <section className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl">
    <p className="text-sm font-semibold uppercase tracking-[.2em] text-amber-300">Choose in secret</p>
    <h2 className="mt-2 text-3xl font-black">Rock. Paper. Scissors.</h2>
    <p className="mt-3 text-zinc-400">{disabled ? 'Waiting for another player to join.' : mine ? 'Choice locked — waiting for your opponent.' : 'Make your choice.'}</p>
    <div className="mt-7 grid grid-cols-3 gap-3">{choices.map(({ choice, icon }) => <button key={choice} type="button" disabled={disabled || Boolean(mine)} onClick={() => onChoose(choice)} className="rounded-2xl border border-white/10 bg-zinc-900 p-5 text-4xl transition hover:-translate-y-1 hover:border-amber-300 disabled:opacity-50" aria-label={choice}>{icon}<span className="mt-2 block text-sm capitalize text-zinc-300">{choice}</span></button>)}</div>
  </section>;
}
