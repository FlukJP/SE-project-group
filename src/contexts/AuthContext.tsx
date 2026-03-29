"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import type { User } from "@/src/types/User";
import { authApi, userApi } from "@/src/lib/api";
import { clearAccessToken, restoreSession, setAccessToken } from "@/src/lib/apiClient";
import { getSocket } from "@/src/lib/socket";

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setTokensAndLoadUser: (accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Provides authentication state and actions to the component tree.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let cancelled = false;

        const handleSessionExpired = () => {
            clearAccessToken();
            setUser(null);
            const s = getSocket();
            if (s.connected) s.disconnect();
        };

        window.addEventListener("session:expired", handleSessionExpired);

        Promise.resolve()
            .then(async () => {
                setIsLoading(true);
                const restored = await restoreSession();
                if (!restored) {
                    if (!cancelled) setUser(null);
                    return;
                }

                const res = await userApi.getMe();
                if (!cancelled) setUser(res.data);
            })
            .catch(() => {
                clearAccessToken();
                if (!cancelled) setUser(null);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
            window.removeEventListener("session:expired", handleSessionExpired);
        };
    }, []);

    // Authenticates the user with email and password, stores the access token in memory, and sets user state.
    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        setAccessToken(res.access_token);
        setUser(res.user);
    }, []);

    // Logs out the user by calling the logout API, disconnecting the socket, and clearing auth state.
    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {}
        if (typeof window !== "undefined") {
            const s = getSocket();
            if (s.connected) s.disconnect();
        }
        clearAccessToken();
        setUser(null);
    }, []);

    // Re-fetches the current user's profile and updates state.
    const refreshUser = useCallback(async () => {
        const res = await userApi.getMe();
        setUser(res.data);
    }, []);

    // Stores the given access token in memory, loads the user profile, and rolls back if the request fails.
    const setTokensAndLoadUser = useCallback(async (accessToken: string) => {
        setAccessToken(accessToken);
        try {
            const res = await userApi.getMe();
            setUser(res.data);
        } catch (err) {
            clearAccessToken();
            setUser(null);
            throw err;
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isLoggedIn: !!user, isLoading, login, logout, refreshUser, setTokensAndLoadUser }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Returns the current authentication context, throwing if used outside of AuthProvider.
export function useAuth(): AuthState {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
