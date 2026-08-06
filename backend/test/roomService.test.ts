import assert from 'node:assert/strict';
import test from 'node:test';
import { RoomService } from '../src/services/roomService.js';

test('room creation defaults to Tic-Tac-Toe for older clients', () => {
  const rooms = new RoomService();
  const room = rooms.createRoom({
    id: 'player',
    socketId: 'socket',
    nickname: 'Damola',
    avatar: '🎮',
  });
  assert.equal(room.gameType, 'tic-tac-toe');
  assert.equal(room.game.type, 'tic-tac-toe');
  assert.equal(room.status, 'waiting');
});
