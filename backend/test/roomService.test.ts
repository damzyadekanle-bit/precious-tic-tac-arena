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

test('draw-and-guess starts its timer only when the second player joins', () => {
  const rooms = new RoomService();
  const room = rooms.createRoom({
    id: 'artist',
    socketId: 'artist-socket',
    nickname: 'Artist',
    avatar: '🎨',
  }, 'draw-and-guess');
  assert.equal(room.status, 'waiting');
  assert.equal(room.game.type, 'draw-and-guess');
  assert.equal(room.game.endsAt, null);

  const joined = rooms.joinRoom(room.code, {
    id: 'guesser',
    socketId: 'guesser-socket',
    nickname: 'Guesser',
    avatar: '🧠',
  });
  assert.equal(joined.status, 'playing');
  assert.equal(joined.game.type, 'draw-and-guess');
  assert.ok(joined.game.endsAt && joined.game.endsAt > Date.now());
});
