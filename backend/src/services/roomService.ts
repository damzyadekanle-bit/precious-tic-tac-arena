import crypto from 'node:crypto';
import type { Player, PublicRoom, Room } from '../types/game.js';
import { GameEngine } from '../utils/gameEngine.js';

export class RoomService {
  private rooms = new Map<string, Room>();

  createRoom(player: Omit<Player, 'mark' | 'connected' | 'rematchRequested'>): Room {
    const code = this.generateCode();
    const room: Room = {
      code,
      board: GameEngine.resetBoard(),
      turn: 'X',
      status: 'waiting',
      winner: null,
      winningLine: [],
      players: [{ ...player, mark: 'X', connected: true, rematchRequested: false }],
      scores: { X: 0, O: 0, draws: 0 },
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(code: string, player: Omit<Player, 'mark' | 'connected' | 'rematchRequested'>): Room {
    const room = this.get(code);
    if (!room) throw new Error('Room not found');
    const returning = room.players.find((p) => p.id === player.id);
    if (returning) {
      returning.socketId = player.socketId;
      returning.connected = true;
      returning.nickname = player.nickname;
      returning.avatar = player.avatar;
      return room;
    }
    if (room.players.length >= 2) throw new Error('Room is full');
    room.players.push({ ...player, mark: 'O', connected: true, rematchRequested: false });
    room.status = 'playing';
    return room;
  }

  removeSocket(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;
        return room;
      }
    }
    return undefined;
  }

  publicRoom(room: Room): PublicRoom {
    return {
      code: room.code,
      board: room.board,
      turn: room.turn,
      status: room.status,
      winner: room.winner,
      winningLine: room.winningLine,
      players: room.players.map(({ id, nickname, avatar, mark, connected, rematchRequested }) => ({
        id,
        nickname,
        avatar,
        mark,
        connected,
        rematchRequested,
      })),
      scores: room.scores,
    };
  }

  deleteIfAbandoned(code: string): void {
    const room = this.get(code);
    if (room && room.players.every((p) => !p.connected)) this.rooms.delete(code);
  }

  private generateCode(): string {
    let code = '';
    do code = crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
    while (this.rooms.has(code));
    return code;
  }
}

export const roomService = new RoomService();
