import crypto from 'node:crypto';
import type { Player, PublicRoom, Room } from '../types/game.js';
import type { GameType } from '../types/game.js';
import { getGame } from '../games/registry.js';

export class RoomService {
  private rooms = new Map<string, Room>();

  createRoom(
    player: Omit<Player, 'seat' | 'connected' | 'rematchRequested' | 'reconnectToken'>,
    gameType: GameType,
  ): Room {
    const code = this.generateCode();
    const room: Room = {
      code,
      gameType,
      game: getGame(gameType).createInitialState(),
      status: 'waiting',
      players: [
        {
          ...player,
          reconnectToken: this.generateToken(),
          seat: 0,
          connected: true,
          rematchRequested: false,
        },
      ],
      scores: { wins: [0, 0], draws: 0 },
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(
    code: string,
    player: Omit<Player, 'seat' | 'connected' | 'rematchRequested' | 'reconnectToken'>,
    reconnectToken?: string,
  ): Room {
    const room = this.get(code);
    if (!room) throw new Error('Room not found');
    const returning = room.players.find((p) => p.id === player.id);
    if (returning) {
      if (!reconnectToken || reconnectToken !== returning.reconnectToken)
        throw new Error('Invalid reconnect credentials');
      returning.socketId = player.socketId;
      returning.connected = true;
      returning.nickname = player.nickname;
      returning.avatar = player.avatar;
      return room;
    }
    if (room.players.length >= 2) throw new Error('Room is full');
    room.players.push({
      ...player,
      reconnectToken: this.generateToken(),
      seat: 1,
      connected: true,
      rematchRequested: false,
    });
    room.status = 'playing';
    return room;
  }

  removeSocket(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.find((p) => p.socketId === socketId);
      if (player) {
        player.connected = false;
        player.rematchRequested = false;
        return room;
      }
    }
    return undefined;
  }

  publicRoom(room: Room): PublicRoom {
    return {
      code: room.code,
      gameType: room.gameType,
      game: room.game,
      status: room.status,
      players: room.players.map(({ id, nickname, avatar, seat, connected, rematchRequested }) => ({
        id,
        nickname,
        avatar,
        seat,
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

  private generateToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }
}

export const roomService = new RoomService();
