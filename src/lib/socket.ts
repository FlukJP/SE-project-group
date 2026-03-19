import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

let _socket: Socket | null = null;

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

// Backward-compatible named export: safe for SSR (no-op proxy if not in browser)
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
