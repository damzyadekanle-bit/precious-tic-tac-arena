import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { socket } from '../services/socket';
import type { GameAction, GameType, PublicRoom } from '../types/game';
import { getIdentity, updateNickname } from '../utils/identity';

interface GameContextValue {
  room: PublicRoom | null;
  identity: ReturnType<typeof getIdentity>;
  connected: boolean;
  createRoom: (nickname: string, gameType: GameType) => Promise<string>;
  joinRoom: (code: string, nickname: string) => Promise<string>;
  performAction: (action: GameAction) => void;
  requestRematch: () => void;
  leaveRoom: () => void;
}
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [identity, setIdentity] = useState(getIdentity());
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const update = (next: PublicRoom) => setRoom(next);
    const connect = () => {
      setConnected(true);
      const code = localStorage.getItem('tta_room');
      const reconnectToken = localStorage.getItem('tta_reconnect_token');
      if (!socket.recovered && code && reconnectToken) {
        const currentIdentity = getIdentity();
        socket.emit(
          'join-room',
          { ...currentIdentity, code, reconnectToken },
          (res: RoomResponse) => {
            if (res.ok && res.room) {
              setRoom(res.room);
              if (res.reconnectToken)
                localStorage.setItem('tta_reconnect_token', res.reconnectToken);
            } else {
              setRoom(null);
              localStorage.removeItem('tta_room');
              localStorage.removeItem('tta_reconnect_token');
              toast.error(res.error ?? 'Could not reconnect to room');
            }
          },
        );
      }
    };
    const disconnect = () => setConnected(false);
    socket.on('connect', connect);
    socket.on('disconnect', disconnect);
    socket.on('player-joined', update);
    socket.on('player-left', update);
    socket.on('game-update', update);
    socket.on('game-over', update);
    socket.on('rematch-requested', update);
    socket.on('accept-rematch', update);
    return () => {
      socket.off('connect', connect);
      socket.off('disconnect', disconnect);
      socket.off('player-joined', update);
      socket.off('player-left', update);
      socket.off('game-update', update);
      socket.off('game-over', update);
      socket.off('rematch-requested', update);
      socket.off('accept-rematch', update);
    };
  }, []);

  const createRoom = async (nickname: string, gameType: GameType) =>
    new Promise<string>((resolve, reject) => {
      const nextIdentity = updateNickname(nickname);
      setIdentity(nextIdentity);
      socket
        .timeout(8_000)
        .emit(
          'create-room',
          { ...nextIdentity, gameType },
          (error: Error | null, res?: RoomResponse) => {
            if (error || !res) {
              toast.error('The game server did not respond. Please try again.');
              reject(error ?? new Error('Game server did not respond'));
              return;
            }
            if (!res.ok || !res.room || !res.reconnectToken) {
              toast.error(res.error ?? 'Could not create room');
              reject(new Error(res.error));
              return;
            }
            setRoom(res.room);
            localStorage.setItem('tta_room', res.room.code);
            localStorage.setItem('tta_reconnect_token', res.reconnectToken);
            resolve(res.room.code);
          },
        );
    });
  const joinRoom = async (code: string, nickname: string) =>
    new Promise<string>((resolve, reject) => {
      const nextIdentity = updateNickname(nickname);
      setIdentity(nextIdentity);
      const normalizedCode = code.toUpperCase();
      const reconnectToken =
        localStorage.getItem('tta_room') === normalizedCode
          ? localStorage.getItem('tta_reconnect_token')
          : null;
      socket.emit(
        'join-room',
        { ...nextIdentity, code: normalizedCode, reconnectToken },
        (res: RoomResponse) => {
          if (!res.ok || !res.room || !res.reconnectToken) {
            toast.error(res.error ?? 'Could not join room');
            reject(new Error(res.error));
            return;
          }
          setRoom(res.room);
          localStorage.setItem('tta_room', res.room.code);
          localStorage.setItem('tta_reconnect_token', res.reconnectToken);
          resolve(res.room.code);
        },
      );
    });
  const performAction = (action: GameAction) => {
    if (!room) return;
    socket.emit(
      'game-action',
      { code: room.code, action },
      (res: { ok: boolean; error?: string }) => {
        if (!res.ok) toast.error(res.error ?? 'Move rejected');
      },
    );
  };
  const requestRematch = () => {
    if (room) socket.emit('request-rematch', { code: room.code }, () => undefined);
  };
  const leaveRoom = () => {
    if (room) socket.emit('leave-room', { code: room.code });
    setRoom(null);
    localStorage.removeItem('tta_room');
    localStorage.removeItem('tta_reconnect_token');
  };
  const value = {
    room,
    identity,
    connected,
    createRoom,
    joinRoom,
    performAction,
    requestRematch,
    leaveRoom,
  };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
interface RoomResponse {
  ok: boolean;
  room?: PublicRoom;
  reconnectToken?: string;
  error?: string;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}
