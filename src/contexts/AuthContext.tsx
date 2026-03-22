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
import { getSocket } from "@/src/lib/socket";

interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    setTokensAndLoadUser: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// Provides authentication state and actions to the component tree.
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Defer setIsLoading into a microtask to avoid synchronous state updates
        // in the effect body, which can cause hydration mismatches.
        Promise.resolve()
            .then(() => {
                setIsLoading(true);
                return userApi.getMe();
            })
            .then((res) => setUser(res.data))
            .catch(() => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Authenticates the user with email and password, then stores the tokens and sets user state.
    const login = useCallback(async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
        setUser(res.user);
    }, []);

    // Logs out the user by calling the logout API, disconnecting the socket, and clearing tokens.
    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {}
        if (typeof window !== "undefined") {
            const s = getSocket();
            if (s.connected) s.disconnect();
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
    }, []);

    // Re-fetches the current user's profile and updates state.
    const refreshUser = useCallback(async () => {
        const res = await userApi.getMe();
        setUser(res.data);
    }, []);

    // Stores the given tokens, loads the user profile, and rolls back both tokens if the request fails.
    const setTokensAndLoadUser = useCallback(async (accessToken: string, refreshToken: string) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        try {
            const res = await userApi.getMe();
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
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
