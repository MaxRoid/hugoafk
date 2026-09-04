import { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { botManager } from '../clients/BotManager.js';

export let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io',
  });

  io.on('connection', (socket) => {
    // Send immediate ping
    socket.emit('connected', { time: Date.now() });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  // Relay all BotManager events through Socket.IO to connected clients
  botManager.on('client:status', (payload) => {
    io?.emit('client:status', payload);
  });

  botManager.on('client:update', (payload) => {
    io?.emit('client:update', payload);
  });

  botManager.on('client:chat', (payload) => {
    io?.emit('client:chat', payload);
  });

  botManager.on('client:log', (payload) => {
    io?.emit('client:log', payload);
  });

  botManager.on('client:stats', (payload) => {
    io?.emit('client:stats', payload);
  });

  botManager.on('client:position', (payload) => {
    io?.emit('client:position', payload);
  });

  botManager.on('client:inventory', (payload) => {
    io?.emit('client:inventory', payload);
  });

  botManager.on('client:device_code', (payload) => {
    io?.emit('client:device_code', payload);
  });

  botManager.on('client:kicked', (payload) => {
    io?.emit('client:kicked', payload);
  });

  botManager.on('client:error', (payload) => {
    io?.emit('client:error', payload);
  });

  console.log('[Socket.IO] Real-time gateway active and listening for bot telemetry');
}
