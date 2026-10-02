import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Share2, Volume2, VolumeX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useGame } from '../contexts/GameContext';
import { GameBoard } from '../components/GameBoard';
import { PlayerCard } from '../components/PlayerCard';
import { Scoreboard } from '../components/Scoreboard';
import { GameOverModal } from '../components/GameOverModal';
import { useSound } from '../hooks/useSound';
import { gameCatalog } from '../types/game';
import { ICallOnGame } from '../components/ICallOnGame';
import { RockPaperScissorsGame } from '../components/RockPaperScissorsGame';
import { DrawAndGuessGame } from '../components/DrawAndGuessGame';

export function GamePage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { room, identity, connected, joinRoom, performAction, requestRematch, leaveRoom } =
    useGame();
  const { muted, setMuted, play } = useSound();
  useEffect(() => {
    if (!room && code) void joinRoom(code, identity.nickname).catch(() => navigate('/'));
    // Room restoration is intentionally attempted once when this route mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const me = room?.players.find((p) => p.id === identity.playerId);
  const opponent = room?.players.find((p) => p.id !== identity.playerId);
  const myTurn =
    room?.status === 'playing' &&
    (room.game.type === 'tic-tac-toe' || room.game.type === 'memory-match') &&
    room.game.turn === me?.seat;
  const title = useMemo(() => {
    if (!connected) return 'Reconnecting...';
    if (!room) return 'Loading room...';
    if (room.status === 'waiting') return 'Waiting for opponent...';
    if (room.status === 'finished')
      return room.game.winner === 'draw'
        ? 'Draw game'
        : room.game.winner === me?.seat
          ? 'Victory!'
          : 'Defeat';
    return myTurn ? 'Your turn' : "Opponent's turn";
  }, [connected, room, me?.seat, myTurn]);
  useEffect(() => {
    if (room?.status === 'finished') {
      if (room.game.winner === me?.seat) {
        play('win');
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
      } else if (room.game.winner === 'draw') play('draw');
    }
    // Only entering the finished state should trigger sound and confetti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.status]);
  if (!room)
    return (
      <main className="relative z-10 grid min-h-screen place-items-center">
        <div className="animate-pulse text-zinc-400">Connecting to room...</div>
      </main>
    );
  if (room.game.type === 'i-call-on') {
    const leaveICallOn = () => {
      leaveRoom();
      navigate('/');
    };
    return (
      <ICallOnGame
        room={{ ...room, game: room.game }}
        me={me}
        connected={connected}
        performAction={performAction}
        leave={leaveICallOn}
      />
    );
  }
  if (room.game.type === 'rock-paper-scissors') {
    return (
      <main className="relative z-10 mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-8">
        <RockPaperScissorsGame game={room.game} me={me} onChoose={(choice) => performAction({ type: 'choose-rps', choice })} />
        {room.status === 'finished' && <GameOverModal title={room.game.winner === 'draw' ? 'Draw game' : room.game.winner === me?.seat ? 'Victory!' : 'Defeat'} requested={Boolean(me?.rematchRequested)} onRematch={requestRematch} onLeave={() => { leaveRoom(); navigate('/'); }} />}
      </main>
    );
  }
  if (room.game.type === 'draw-and-guess') {
    return (
      <main className="relative z-10 mx-auto grid min-h-screen max-w-2xl place-items-center px-4 py-8">
        <DrawAndGuessGame game={room.game} me={me} onAction={performAction} />
        {room.status === 'finished' && <GameOverModal title={room.game.winner === 'draw' ? `Time! The word was ${room.game.prompt}` : room.game.winner === me?.seat ? 'Correct guess!' : `They guessed ${room.game.prompt}!`} requested={Boolean(me?.rematchRequested)} onRematch={requestRematch} onLeave={() => { leaveRoom(); navigate('/'); }} />}
      </main>
    );
  }
  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
    toast.success('Room code copied');
  };
  const share = async () => {
    const data = {
      title: `Join ${gameCatalog[room.gameType].name} in Damola's Game Room`,
      text: `Room code: ${room.code}`,
      url: window.location.href,
    };
    if (navigator.share) await navigator.share(data);
    else await copyCode();
  };
  const leave = () => {
    play('leave');
    leaveRoom();
    navigate('/');
  };
  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-amber-300">{gameCatalog[room.gameType].name} · Room</p>
          <h1 className="text-2xl font-black tracking-[.18em]">{room.code}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="rounded-xl border border-white/10 p-3 hover:bg-white/10"
            aria-label="Copy room code"
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            onClick={share}
            className="rounded-xl border border-white/10 p-3 hover:bg-white/10"
            aria-label="Share room"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="rounded-xl border border-white/10 p-3 hover:bg-white/10"
            aria-label="Toggle sound"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr_280px] lg:items-start">
        <aside className="space-y-4">
          <PlayerCard player={me} active={Boolean(myTurn)} gameType={room.gameType} />
          <PlayerCard
            player={opponent}
            active={Boolean(!myTurn && room.status === 'playing')}
            gameType={room.gameType}
          />
          <Scoreboard scores={room.scores} gameType={room.gameType} />
        </aside>
        <section className="flex flex-col items-center">
          <div className="mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold">
            {title}
          </div>
          <GameBoard
            room={room}
            disabled={!myTurn || !connected || room.status !== 'playing'}
            onMove={(index) => {
              play('move');
              performAction(
                room.game.type === 'memory-match'
                  ? { type: 'flip', index }
                  : { type: 'place', index },
              );
            }}
          />
        </section>
        <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-bold">Match status</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Connection</dt>
              <dd>{connected ? 'Online' : 'Offline'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">
                {room.game.type === 'memory-match' ? 'Your pairs' : 'Your mark'}
              </dt>
              <dd>
                {room.game.type === 'memory-match'
                  ? me
                    ? room.game.pairScores[me.seat]
                    : '—'
                  : me
                    ? me.seat === 0
                      ? 'X'
                      : 'O'
                    : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Current turn</dt>
              <dd>
                {room.game.type === 'memory-match'
                  ? (room.players.find(
                      (player) =>
                        player.seat === (room.game.type === 'memory-match' ? room.game.turn : -1),
                    )?.nickname ?? '—')
                  : room.game.type === 'tic-tac-toe' && room.game.turn === 0
                    ? 'X'
                    : 'O'}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={leave}
            className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/10"
          >
            Leave Room
          </button>
        </aside>
      </div>
      {room.status === 'finished' && (
        <GameOverModal
          title={title}
          requested={Boolean(me?.rematchRequested)}
          onRematch={requestRematch}
          onLeave={leave}
        />
      )}
    </main>
  );
}
