import type { Server, Socket } from 'socket.io';
import { roomService } from '../services/roomService.js';
import { GameEngine } from '../utils/gameEngine.js';

interface IdentityPayload {
  playerId: string;
  nickname: string;
  avatar: string;
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

export function registerGameSocket(io: Server, socket: Socket) {
  socket.on('create-room', (payload: IdentityPayload, callback) => {
    try {
      const room = roomService.createRoom({
        id: payload.playerId,
        socketId: socket.id,
        nickname: payload.nickname,
        avatar: payload.avatar,
      });
      socket.join(room.code);
      reply(callback, {
        ok: true,
        room: roomService.publicRoom(room),
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
      io.to(room.code).emit('player-joined', roomService.publicRoom(room));
      const player = room.players.find((candidate) => candidate.socketId === socket.id)!;
      reply(callback, {
        ok: true,
        room: roomService.publicRoom(room),
        reconnectToken: player.reconnectToken,
      });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('make-move', ({ code, playerId, index }, callback) => {
    try {
      const room = roomService.get(code);
      if (!room) throw new Error('Room not found');
      const player = room.players.find(
        (p) => p.id === playerId && p.socketId === socket.id && p.connected,
      );
      if (!player) throw new Error('Player not found');
      if (room.status !== 'playing') throw new Error('Game is not active');
      if (room.turn !== player.mark) throw new Error('It is not your turn');
      if (!GameEngine.validateMove(room.board, index)) throw new Error('Illegal move');

      room.board[index] = player.mark;
      const result = GameEngine.checkWinner(room.board);
      if (result.winner) {
        room.status = 'finished';
        room.winner = result.winner;
        room.winningLine = result.line;
        room.scores[result.winner] += 1;
        io.to(room.code).emit('game-over', roomService.publicRoom(room));
      } else if (GameEngine.isDraw(room.board)) {
        room.status = 'finished';
        room.winner = 'draw';
        room.scores.draws += 1;
        io.to(room.code).emit('game-over', roomService.publicRoom(room));
      } else {
        room.turn = GameEngine.nextTurn(room.turn);
        io.to(room.code).emit('board-update', roomService.publicRoom(room));
        io.to(room.code).emit('turn-change', room.turn);
      }
      reply(callback, { ok: true });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('request-rematch', ({ code, playerId }, callback) => {
    try {
      const room = roomService.get(code);
      if (!room) throw new Error('Room not found');
      if (room.status !== 'finished')
        throw new Error('Rematches are only available after the game');
      const player = room.players.find(
        (p) => p.id === playerId && p.socketId === socket.id && p.connected,
      );
      if (!player) throw new Error('Player not found');
      player.rematchRequested = true;
      io.to(code).emit('rematch-requested', roomService.publicRoom(room));
      if (room.players.length === 2 && room.players.every((p) => p.rematchRequested)) {
        room.board = GameEngine.resetBoard();
        room.turn = (room.scores.X + room.scores.O + room.scores.draws) % 2 === 0 ? 'X' : 'O';
        room.status = 'playing';
        room.winner = null;
        room.winningLine = [];
        room.players.forEach((p) => (p.rematchRequested = false));
        io.to(code).emit('accept-rematch', roomService.publicRoom(room));
      }
      reply(callback, { ok: true });
    } catch (error) {
      reply(callback, { ok: false, error: (error as Error).message });
    }
  });

  socket.on('leave-room', ({ code, playerId }) => {
    const room = roomService.get(code);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId && p.socketId === socket.id);
    if (!player) return;
    player.connected = false;
    player.rematchRequested = false;
    socket.leave(code);
    io.to(code).emit('player-left', roomService.publicRoom(room));
    setTimeout(() => roomService.deleteIfAbandoned(code), 30_000);
  });

  socket.on('disconnect', () => {
    const room = roomService.removeSocket(socket.id);
    if (!room) return;
    io.to(room.code).emit('player-left', roomService.publicRoom(room));
    setTimeout(() => roomService.deleteIfAbandoned(room.code), 30_000);
  });
}
