import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gamepad2, Sparkles } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { gameCatalog, type GameType } from '../types/game';

export function HomePage() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, identity } = useGame();
  const [nickname, setNickname] = useState(identity.nickname);
  const [code, setCode] = useState('');
  const [selectedGame, setSelectedGame] = useState<GameType>('tic-tac-toe');
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
    <main className="relative z-10 mx-auto min-h-screen max-w-6xl px-5 py-10 sm:py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-xl text-zinc-950">
            D
          </span>
          <div>
            <strong className="block">Damola's Game Room</strong>
            <span className="text-sm text-zinc-500">Play together</span>
          </div>
        </div>
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live multiplayer
        </span>
      </header>
      <div className="mt-14 grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
        <section>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[.22em] text-amber-300">
              <Sparkles size={16} /> Pick a game. Invite a friend.
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[.95] tracking-tight sm:text-7xl">
              Good games.
              <br />
              <span className="bg-gradient-to-r from-amber-200 via-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
                Better company.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              A cozy corner for quick challenges, friendly rivalries, and all the rematches you can
              handle.
            </p>
          </motion.div>
          <div className="mt-9">
            <p className="mb-3 text-sm font-semibold text-zinc-300">Choose your game</p>
            {Object.entries(gameCatalog).map(([type, game]) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  type === 'i-call-on' ? navigate('/i-call-on') : setSelectedGame(type as GameType)
                }
                className={`flex w-full max-w-md items-center gap-4 rounded-2xl border p-4 text-left transition ${selectedGame === type ? 'border-amber-300/70 bg-amber-300/10' : 'border-white/10 bg-white/5'}`}
              >
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-zinc-900 text-xl font-black text-amber-300">
                  {game.icon}
                </span>
                <span className="flex-1">
                  <strong className="block">{game.name}</strong>
                  <span className="text-sm text-zinc-500">{game.description}</span>
                </span>
                <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                  Ready
                </span>
              </button>
            ))}
          </div>
        </section>
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <Gamepad2 className="text-amber-300" />
            <div>
              <h2 className="text-xl font-bold">Start playing</h2>
              <p className="text-sm text-zinc-500">No account needed.</p>
            </div>
          </div>
          <label className="text-sm font-medium text-zinc-300">Your nickname</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-300"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => run(() => createRoom(nickname, selectedGame))}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-4 py-3 font-bold text-zinc-950 transition hover:brightness-110 disabled:opacity-50"
          >
            Create a room <ArrowRight size={18} />
          </button>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-zinc-600">
            <div className="h-px flex-1 bg-white/10" />
            or join a room
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 6),
                )
              }
              placeholder="ROOM CODE"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 uppercase tracking-[.2em] outline-none focus:border-fuchsia-400"
            />
            <button
              type="button"
              disabled={loading || code.length !== 6}
              onClick={() => run(() => joinRoom(code, nickname))}
              className="rounded-xl border border-white/15 px-5 font-semibold hover:bg-white/10 disabled:opacity-40"
            >
              Join
            </button>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
