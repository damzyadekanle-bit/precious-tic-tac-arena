import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { socket } from '../services/socket';
import type { PublicRoom } from '../types/game';
import { getIdentity, updateNickname } from '../utils/identity';

interface GameContextValue { room: PublicRoom | null; identity: ReturnType<typeof getIdentity>; connected: boolean; createRoom: (nickname: string) => Promise<string>; joinRoom: (code: string, nickname: string) => Promise<string>; makeMove: (index: number) => void; requestRematch: () => void; leaveRoom: () => void }
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [identity, setIdentity] = useState(getIdentity());
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const update = (next: PublicRoom) => setRoom(next);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('player-joined', update); socket.on('player-left', update); socket.on('board-update', update); socket.on('game-over', update); socket.on('rematch-requested', update); socket.on('accept-rematch', update);
    return () => { socket.off('connect'); socket.off('disconnect'); socket.off('player-joined', update); socket.off('player-left', update); socket.off('board-update', update); socket.off('game-over', update); socket.off('rematch-requested', update); socket.off('accept-rematch', update); };
  }, []);

  const createRoom = async (nickname: string) => new Promise<string>((resolve, reject) => {
    const nextIdentity = updateNickname(nickname); setIdentity(nextIdentity);
    socket.emit('create-room', nextIdentity, (res: { ok: boolean; room?: PublicRoom; error?: string }) => { if (!res.ok || !res.room) { toast.error(res.error ?? 'Could not create room'); reject(new Error(res.error)); return; } setRoom(res.room); localStorage.setItem('tta_room', res.room.code); resolve(res.room.code); });
  });
  const joinRoom = async (code: string, nickname: string) => new Promise<string>((resolve, reject) => {
    const nextIdentity = updateNickname(nickname); setIdentity(nextIdentity);
    socket.emit('join-room', { ...nextIdentity, code: code.toUpperCase() }, (res: { ok: boolean; room?: PublicRoom; error?: string }) => { if (!res.ok || !res.room) { toast.error(res.error ?? 'Could not join room'); reject(new Error(res.error)); return; } setRoom(res.room); localStorage.setItem('tta_room', res.room.code); resolve(res.room.code); });
  });
  const makeMove = (index: number) => { if (!room) return; socket.emit('make-move', { code: room.code, playerId: identity.playerId, index }, (res: { ok: boolean; error?: string }) => { if (!res.ok) toast.error(res.error ?? 'Move rejected'); }); };
  const requestRematch = () => { if (room) socket.emit('request-rematch', { code: room.code, playerId: identity.playerId }, () => undefined); };
  const leaveRoom = () => { if (room) socket.emit('leave-room', { code: room.code, playerId: identity.playerId }); setRoom(null); localStorage.removeItem('tta_room'); };
  const value = useMemo(() => ({ room, identity, connected, createRoom, joinRoom, makeMove, requestRematch, leaveRoom }), [room, identity, connected]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
export function useGame() { const ctx = useContext(GameContext); if (!ctx) throw new Error('useGame must be inside GameProvider'); return ctx; }
