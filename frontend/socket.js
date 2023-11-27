import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/', { ackTimeout: 10000, retries: 3 });

export { socket };
