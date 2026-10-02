# Damola's Game Room

A real-time multiplayer game room built with React, TypeScript, Vite, Tailwind CSS, Framer Motion, Express, and Socket.IO. Play Tic-Tac-Toe, Memory Match, or the 2–12 player word game I Call On.

## Features

- Real-time multiplayer rooms for 2–12 players
- Game catalog and server-side game adapter registry
- Tic-Tac-Toe, Memory Match, and I Call On
- Discriminated game state and generic game actions
- Shareable six-character room codes
- Strict server-side move validation
- Session scoreboards, round results, and rematches
- Reconnection-friendly player identities
- Responsive 320px–1440px UI
- Motion, confetti, synthesized sound effects, mute control, and optional microphone voice chat
- Accessible board buttons and live status messaging

## Local setup

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

## Production build

```bash
npm run build
```

## Deploy frontend to Vercel

1. Import the repository.
2. Set the root directory to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add `VITE_SERVER_URL=https://your-render-backend.onrender.com`.
6. Add a Vercel rewrite for SPA routing if needed.

## Deploy backend to Render

1. Create a Web Service from the repository.
2. Set the root directory to `backend`.
3. Build command: `npm install && npm run build`.
4. Start command: `npm start`.
5. Add `CLIENT_URL=https://your-frontend.vercel.app`.
6. Render supplies `PORT` automatically.

## Railway

Deploy `backend` as the service root, then set `CLIENT_URL` to the deployed frontend URL.

## Redis-ready architecture

All room access is isolated behind `RoomService`. Replace its internal `Map` with a Redis adapter while preserving the public methods. For multi-instance Socket.IO hosting, also add the official Socket.IO Redis adapter.

## Important production notes

- In-memory rooms reset whenever the backend restarts.
- Multiple backend instances require Redis for shared rooms and Socket.IO pub/sub.
- Add rate limiting, observability, persistent analytics, and automated tests before operating at scale.
- Voice chat uses browser-to-browser WebRTC, with Socket.IO used only for private in-room setup messages. Microphone permission is requested only after a player presses the microphone button. The included public STUN service enables most direct connections; configure a TURN service for reliable voice chat across restrictive corporate networks and some mobile carriers.
