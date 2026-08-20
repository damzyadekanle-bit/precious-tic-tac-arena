import { useState } from 'react';
import { ArrowLeft, Megaphone, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';

const steps = [
  'Players take turns being the Caller.',
  'The Caller picks a letter.',
  'Everyone fills five categories before time runs out.',
  'Review another player’s answers.',
  'Unique correct answers earn 10; duplicates earn 5.',
  'The highest total score wins.',
];

export function ICallOnLandingPage() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, identity } = useGame();
  const [name, setName] = useState(identity.nickname);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const run = async (action: () => Promise<string>) => {
    setLoading(true);
    try {
      navigate(`/room/${await action()}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-5xl px-4 py-8 sm:py-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={18} /> Game Room
      </button>
      <header className="mt-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-3xl">
          <Megaphone />
        </span>
        <h1 className="mt-5 text-4xl font-black sm:text-6xl">I Call On</h1>
        <p className="mt-3 text-zinc-400">Think fast. Fill every category. Call hands up!</p>
      </header>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Host a Game</h2>
          <label className="mt-5 block text-sm text-zinc-300">Your Name</label>
          <input
            value={name}
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-amber-300"
          />
          <button
            disabled={loading}
            onClick={() => run(() => createRoom(name, 'i-call-on'))}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-4 py-3 font-bold text-zinc-950"
          >
            Create Game
          </button>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-bold">Join a Game</h2>
          <label className="mt-5 block text-sm text-zinc-300">Enter Game Code</label>
          <input
            value={code}
            placeholder="ABC123"
            onChange={(event) =>
              setCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 6),
              )
            }
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 uppercase tracking-[.2em] outline-none focus:border-fuchsia-400"
          />
          <button
            disabled={loading || code.length !== 6}
            onClick={() => run(() => joinRoom(code, name))}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 font-bold disabled:opacity-40"
          >
            <Users size={18} /> Join Game
          </button>
        </section>
      </div>
      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-950/70 p-6">
        <h2 className="text-xl font-bold">How to Play</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-zinc-300">
              <span className="font-bold text-amber-300">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
