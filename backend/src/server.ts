import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerGameSocket } from './socket/gameSocket.js';

const port = Number(process.env.PORT ?? 4000);
const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
const app = express();
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use('/health', healthRouter);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: clientUrl, credentials: true },
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
});
io.on('connection', (socket) => registerGameSocket(io, socket));
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
