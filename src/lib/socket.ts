import { io, Socket } from 'socket.io-client';
import { ENV } from '../config/env';

export const socket: Socket = io(ENV.SOCKET_URL, {
    autoConnect: false, 
    withCredentials: true,
});