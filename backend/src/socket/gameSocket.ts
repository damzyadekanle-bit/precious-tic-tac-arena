import type { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService.js';
import { getGame } from '../games/registry.js';
import type { GameAction, GameType } from '../types/game.js';

interface IdentityPayload {
  playerId: string;
  nickname: string;
  avatar: string;
}
interface CreateRoomPayload extends IdentityPayload {
  gameType?: GameType;
}
interface RoomPayload extends IdentityPayload {
  code: string;
  reconnectToken?: string;
}
type Ack = (response: {
  ok: boolean;
  room?: ReturnType<typeof roomService.publicRoom>;
  reconnectToken?: string;
  error?: string;
}) => void;

function reply(callback: unknown, response: Parameters<Ack>[0]): void {
  if (typeof callback === 'function') (callback as Ack)(response);
}

function broadcastRoom(
  io: Server,
  room: NonNullable<ReturnType<typeof roomService.get>>,
  event = 'game-update',
) {
  for (const player of room.players)
    io.to(player.socketId).emit(event, roomService.publicRoom(room, player.seat));
}

function advanceDisconnectedCaller(room: NonNullable<ReturnType<typeof roomService.get>>) {
  if (room.game.type !== 'i-call-on' || room.game.phase !== 'ROUND_SETUP') return;
  const game = room.game;
  const caller = room.players.find((player) => player.seat === game.callerSeat);
  if (caller?.connected) return;
  const active = room.players.filter((player) => player.connected);
  if (active.length)
    game.callerSeat =
      active.find((player) => player.seat > game.callerSeat)?.seat ?? active[0].seat;
}

export function registerGameSocket(io: Server, socket: Socket) {
  socket.on('create-room', (payload: CreateRoomPayload, callback) => {
    try {
      const room = roomService.createRoom(
        {
          id: payload.playerId,
          socketId: socket.id,
          nickname: payload.nickname,
          avatar: payload.avatar,
        },
        payload.gameType ?? 'tic-tac-toe',
      );
      socket.join(room.code);
      reply(callback, {
        ok: true,
        room: roomService.publicRoom(room, 0),
        reconnectToken: room.players[0].reconnectToken,
      });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('join-room', (payload: RoomPayload, callback) => {
    try {
      const room = roomService.joinRoom(
        payload.code,
        {
          id: payload.playerId,
          socketId: socket.id,
          nickname: payload.nickname,
          avatar: payload.avatar,
        },
        payload.reconnectToken,
      );
      socket.join(room.code);
      broadcastRoom(io, room, 'player-joined');
      const player = room.players.find((candidate) => candidate.socketId === socket.id)!;
      reply(callback, {
        ok: true,
        room: roomService.publicRoom(room, player.seat),
        reconnectToken: player.reconnectToken,
      });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('game-action', ({ code, action }: { code: string; action: GameAction }, callback) => {
    try {
      const room = roomService.get(code);
      if (!room) throw new Error('Room not found');
      const player = room.players.find((p) => p.socketId === socket.id && p.connected);
      if (!player) throw new Error('Player not found');
      if (room.status !== 'playing' && room.gameType !== 'i-call-on')
        throw new Error('Game is not active');
      const adapter = getGame(room.gameType);
      if (
        room.gameType === 'i-call-on' &&
        action.type === 'start-game' &&
        room.players.filter((candidate) => candidate.connected).length < 2
      )
        throw new Error('At least 2 connected players are required');
      room.game = adapter.applyAction(room.game, player.seat, action, {
        playerCount: room.players.length,
        now: Date.now(),
      });
      if (room.gameType === 'i-call-on' && action.type === 'start-game') room.status = 'playing';
      const result = adapter.getResult(room.game);
      if (result.winner !== null) {
        room.status = 'finished';
        if (result.winner === 'draw') room.scores.draws += 1;
        else room.scores.wins[result.winner] += 1;
        broadcastRoom(io, room, 'game-over');
      } else {
        broadcastRoom(io, room);
      }
      if (
        room.gameType === 'i-call-on' &&
        action.type === 'start-round' &&
        room.game.type === 'i-call-on' &&
        room.game.endsAt
      ) {
        const expectedEnd = room.game.endsAt;
        setTimeout(
          () => {
            const current = roomService.get(room.code);
            if (
              !current ||
              current.game.type !== 'i-call-on' ||
              current.game.endsAt !== expectedEnd ||
              current.game.phase !== 'PLAYING'
            )
              return;
            current.game = adapter.applyAction(
              current.game,
              -1,
              { type: 'expire-round' },
              { playerCount: current.players.length, now: Date.now() },
            );
            broadcastRoom(io, current);
          },
          Math.max(0, expectedEnd - Date.now()),
        );
      }
      reply(callback, { ok: true });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('request-rematch', ({ code }, callback) => {
    try {
      const room = roomService.get(code);
      if (!room) throw new Error('Room not found');
      if (room.status !== 'finished')
        throw new Error('Rematches are only available after the game');
      const player = room.players.find((p) => p.socketId === socket.id && p.connected);
      if (!player) throw new Error('Player not found');
      player.rematchRequested = true;
      broadcastRoom(io, room, 'rematch-requested');
      if (room.players.length === 2 && room.players.every((p) => p.rematchRequested)) {
        const rounds = room.scores.wins[0] + room.scores.wins[1] + room.scores.draws;
        room.game = getGame(room.gameType).createInitialState(rounds % 2 === 0 ? 0 : 1);
        room.status = 'playing';
        room.players.forEach((p) => (p.rematchRequested = false));
        broadcastRoom(io, room, 'accept-rematch');
      }
      reply(callback, { ok: true });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('leave-room', ({ code }) => {
    const room = roomService.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;
    player.connected = false;
    player.rematchRequested = false;
    socket.leave(code);
    advanceDisconnectedCaller(room);
    broadcastRoom(io, room, 'player-left');
    setTimeout(() => roomService.deleteIfAbandoned(code), 30_000);
  });

  socket.on('disconnect', () => {
    const room = roomService.removeSocket(socket.id);
    if (!room) return;
    advanceDisconnectedCaller(room);
    broadcastRoom(io, room, 'player-left');
    setTimeout(() => roomService.deleteIfAbandoned(room.code), 30_000);
  });
}
