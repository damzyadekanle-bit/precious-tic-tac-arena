import { useEffect, useState } from 'react';
import { Copy, LogOut, Megaphone, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type {
  ICallOnAction,
  ICallOnAnswers,
  ICallOnCategory,
  PublicPlayer,
  PublicRoom,
} from '../types/game';

const categories: ICallOnCategory[] = ['name', 'animal', 'food', 'place', 'thing'];
const durations = [15, 30, 45, 60, 90, 120, 180, 300];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export function ICallOnGame({
  room,
  me,
  connected,
  performAction,
  leave,
}: {
  room: PublicRoom & { game: Extract<PublicRoom['game'], { type: 'i-call-on' }> };
  me?: PublicPlayer;
  connected: boolean;
  performAction: (action: ICallOnAction) => void;
  leave: () => void;
}) {
  const game = room.game;
  const isHost = me?.seat === game.hostSeat;
  const isCaller = me?.seat === game.callerSeat;
  const [answers, setAnswers] = useState<ICallOnAnswers>(game.myAnswers);
  const [letter, setLetter] = useState('');
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(0);
  useEffect(() => setAnswers(game.myAnswers), [game.myAnswers]);
  useEffect(() => {
    const update = () =>
      setRemaining(game.endsAt ? Math.max(0, Math.ceil((game.endsAt - Date.now()) / 1000)) : 0);
    update();
    const timer = window.setInterval(update, 250);
    return () => clearInterval(timer);
  }, [game.endsAt]);
  const updateAnswer = (category: ICallOnCategory, value: string) => {
    const next = { ...answers, [category]: value };
    setAnswers(next);
    performAction({ type: 'update-answers', answers: next });
  };
  const copy = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(message);
  };
  const caller = room.players.find((player) => player.seat === game.callerSeat);
  if (game.phase === 'LOBBY')
    return (
      <Shell title="Game Lobby" room={room} me={me} connected={connected} leave={leave}>
        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <Panel>
            <p className="text-sm text-zinc-500">Game Code</p>
            <div className="mt-2 flex items-center gap-3">
              <strong className="text-4xl tracking-[.18em]">{room.code}</strong>
              <button onClick={() => copy(room.code, 'Code copied')} aria-label="Copy code">
                <Copy />
              </button>
              <button
                onClick={() => copy(window.location.href, 'Invite link copied')}
                aria-label="Copy invite link"
              >
                <Share2 />
              </button>
            </div>
            <p className="mt-5 text-zinc-400">
              {room.players.length}/12 players ·{' '}
              {room.players.filter((player) => player.connected).length} online
            </p>
            {isHost && (
              <button
                disabled={room.players.length < 2}
                onClick={() => performAction({ type: 'start-game' })}
                className="primary mt-6 w-full"
              >
                Start Game
              </button>
            )}
            {!isHost && (
              <p className="mt-6 rounded-xl bg-white/5 p-4 text-center">
                Waiting for the host to start…
              </p>
            )}
          </Panel>
          <Panel>
            <h2 className="font-bold">Players</h2>
            <div className="mt-3 space-y-2">
              {room.players.map((player) => (
                <Player key={player.id} player={player} host={player.seat === game.hostSeat} />
              ))}
            </div>
          </Panel>
        </div>
      </Shell>
    );
  if (game.phase === 'ROUND_SETUP')
    return (
      <Shell title={`Round ${game.round}`} room={room} me={me} connected={connected} leave={leave}>
        <Panel>
          <p className="text-center text-xl font-bold">
            {isCaller ? 'You are the Caller' : `${caller?.nickname ?? 'The Caller'} is the Caller`}
          </p>
          {isCaller ? (
            <>
              <p className="mt-6 text-sm text-zinc-400">Choose an unused letter</p>
              <div className="mt-3 grid grid-cols-7 gap-2">
                {alphabet.map((item) => (
                  <button
                    key={item}
                    disabled={game.usedLetters.includes(item)}
                    onClick={() => setLetter(item)}
                    className={`aspect-square rounded-lg border font-bold ${letter === item ? 'border-amber-300 bg-amber-300 text-zinc-950' : 'border-white/10 bg-white/5'} disabled:opacity-20`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-6 text-sm text-zinc-400">Round timer</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {durations.map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setDuration(seconds)}
                    className={`rounded-lg border px-3 py-2 ${duration === seconds ? 'border-amber-300 bg-amber-300/10' : 'border-white/10'}`}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </button>
                ))}
              </div>
              <button
                disabled={!letter}
                onClick={() =>
                  performAction({ type: 'start-round', letter, durationSeconds: duration })
                }
                className="primary mt-6 w-full"
              >
                Start Round
              </button>
            </>
          ) : (
            <p className="mt-6 text-center text-zinc-400">They’re choosing the letter and timer.</p>
          )}
        </Panel>
      </Shell>
    );
  if (game.phase === 'PLAYING')
    return (
      <Shell
        title={`Round ${game.round} · Letter ${game.letter}`}
        room={room}
        me={me}
        connected={connected}
        leave={leave}
      >
        <div className="sticky top-2 z-20 mx-auto mb-4 w-fit rounded-full border border-white/10 bg-zinc-950/95 px-6 py-3 text-2xl font-black">
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        </div>
        {remaining <= 10 && (
          <p className="mb-4 text-center font-bold text-amber-300">
            ⏰ Time almost up! Finish your answers!
          </p>
        )}
        <Panel>
          <div className="space-y-4">
            {categories.map((category) => (
              <label key={category} className="block capitalize">
                <span className="text-sm font-semibold">{category}</span>
                <input
                  value={answers[category]}
                  onChange={(event) => updateAnswer(category, event.target.value)}
                  placeholder={`Enter a ${category} starting with “${game.letter}”`}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-base outline-none focus:border-amber-300"
                />
              </label>
            ))}
          </div>
          {isCaller && (
            <button
              disabled={categories.some((category) => !answers[category].trim())}
              onClick={() => performAction({ type: 'hands-up' })}
              className="primary sticky bottom-3 mt-6 w-full py-4 text-lg"
            >
              🙌 HANDS UP!
            </button>
          )}
        </Panel>
      </Shell>
    );
  if (game.phase === 'REVIEWING')
    return (
      <Shell
        title={`Round ${game.round} Review`}
        room={room}
        me={me}
        connected={connected}
        leave={leave}
      >
        <Panel>
          <p className="mb-5 text-zinc-400">
            Reviewing{' '}
            {room.players.find((player) => player.seat === game.reviewTarget?.seat)?.nickname ??
              'player'}
            ’s answers
          </p>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category} className="rounded-xl border border-white/10 p-4">
                <p className="text-xs uppercase text-zinc-500">{category}</p>
                <p className="my-2 text-lg font-semibold">
                  {game.reviewTarget?.answers[category] || 'Blank'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => performAction({ type: 'review', category, correct: true })}
                    className={`rounded-lg border p-2 ${game.myDecisions[category] === true ? 'border-emerald-400 bg-emerald-400/15' : 'border-white/10'}`}
                  >
                    ✓ Correct
                  </button>
                  <button
                    onClick={() => performAction({ type: 'review', category, correct: false })}
                    className={`rounded-lg border p-2 ${game.myDecisions[category] === false ? 'border-red-400 bg-red-400/15' : 'border-white/10'}`}
                  >
                    ✕ Incorrect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </Shell>
    );
  const leaderboard = [...room.players].sort(
    (a, b) => (game.totals[b.seat] ?? 0) - (game.totals[a.seat] ?? 0),
  );
  const nextCaller = (game.callerSeat + 1) % room.players.length;
  return (
    <Shell
      title={game.phase === 'GAME_OVER' ? 'Final Results' : `Round ${game.round} Results`}
      room={room}
      me={me}
      connected={connected}
      leave={leave}
    >
      <Panel>
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-xl bg-white/5 p-4"
            >
              <span>
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `${index + 1}.`} {player.nickname}
              </span>
              <strong>{game.totals[player.seat] ?? 0} pts</strong>
            </div>
          ))}
        </div>
        {game.phase === 'ROUND_RESULTS' && me?.seat === nextCaller && (
          <button
            onClick={() => performAction({ type: 'next-round' })}
            className="primary mt-6 w-full"
          >
            Choose Next Letter
          </button>
        )}
        {game.phase === 'ROUND_RESULTS' && me?.seat !== nextCaller && (
          <p className="mt-6 text-center text-zinc-400">
            Waiting for {room.players.find((player) => player.seat === nextCaller)?.nickname} to
            start the next round…
          </p>
        )}
        {game.phase === 'GAME_OVER' && isHost && (
          <button
            onClick={() => performAction({ type: 'play-again' })}
            className="primary mt-6 w-full"
          >
            Play Again
          </button>
        )}
        {isHost && game.phase !== 'GAME_OVER' && (
          <button
            onClick={() => performAction({ type: 'end-game' })}
            className="mt-4 w-full rounded-xl border border-red-400/30 p-3 text-red-300"
          >
            End Game
          </button>
        )}
      </Panel>
    </Shell>
  );
}

function Shell({
  title,
  room,
  me,
  connected,
  leave,
  children,
}: {
  title: string;
  room: PublicRoom;
  me?: PublicPlayer;
  connected: boolean;
  leave: () => void;
  children: React.ReactNode;
}) {
  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-4xl overflow-x-hidden px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-amber-300">
            <Megaphone size={16} /> I Call On · {connected ? 'Live' : 'Reconnecting'}
          </p>
          <h1 className="text-2xl font-black">{title}</h1>
        </div>
        <button
          onClick={leave}
          className="rounded-xl border border-white/10 p-3"
          aria-label="Leave game"
        >
          <LogOut />
        </button>
      </header>
      {children}
      <p className="mt-6 text-center text-xs text-zinc-600">
        Room {room.code} · Playing as {me?.nickname}
      </p>
    </main>
  );
}
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-zinc-950/75 p-5 shadow-xl sm:p-7">
      {children}
    </section>
  );
}
function Player({ player, host }: { player: PublicPlayer; host: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
      <span>
        {player.avatar} {player.nickname}{' '}
        {host && <small className="ml-2 text-amber-300">HOST</small>}
      </span>
      <span className={player.connected ? 'text-emerald-400' : 'text-zinc-600'}>●</span>
    </div>
  );
}
