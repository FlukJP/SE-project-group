import { io, Socket } from "socket.io-client";
import { ENV } from "@/src/config/clientEnv";

// SOCKET CLIENT
let _socket: Socket | null = null;

/**
 * Returns the singleton Socket.IO client instance.
 * Token is injected lazily via getter so it always reads the latest value from localStorage.
 */
export function getSocket(): Socket {
    if (!_socket) {
        _socket = io(ENV.SOCKET_URL, {
            autoConnect: false,
            withCredentials: true,
            auth: {
                get token() {
                    return typeof window !== "undefined"
                        ? localStorage.getItem("access_token") ?? ""
                        : "";
                },
            },
        });

        _socket.on("connect_error", (err) => {
            console.error("[Socket] Connection error:", err.message);
        });

        _socket.on("connect", () => {
            console.log("[Socket] Connected");
        });

        _socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
        });
    }
    return _socket;
}

/**
 * Named socket export safe for SSR.
 * Returns the real socket in the browser, or a no-op proxy on the server.
 */
export const socket: Socket =
    typeof window !== "undefined"
        ? getSocket()
        : (new Proxy({} as Socket, {
            get: (_target, prop) => {
                if (
                    prop === "on" ||
                    prop === "off" ||
                    prop === "emit" ||
                    prop === "connect" ||
                    prop === "disconnect"
                ) {
                    return () => { };
                }
                if (prop === "connected") return false;
                return undefined;
            },
        }) as Socket);
