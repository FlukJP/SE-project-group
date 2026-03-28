import { io, Socket } from 'socket.io-client';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

let _socket: Socket | null = null;

// Returns the singleton Socket.IO client instance, creating it on first call with lazy auth token injection.
export function getSocket(): Socket {
    if (!_socket) {
        _socket = io(SOCKET_URL, {
            autoConnect: false,
            withCredentials: true,
            auth: {
                get token() {
                    return typeof window !== 'undefined'
                        ? localStorage.getItem('access_token') || ''
                        : '';
                },
            },
        });
    }
    return _socket;
}

// Named socket export safe for SSR — returns the real socket in the browser, or a no-op proxy on the server.
export const socket: Socket = typeof window !== 'undefined'
    ? getSocket()
    : (new Proxy({} as Socket, {
        get: (_target, prop) => {
            if (prop === 'on' || prop === 'off' || prop === 'emit' || prop === 'connect' || prop === 'disconnect') {
                return () => {};
            }
            if (prop === 'connected') return false;
            return undefined;
        },
    }));
