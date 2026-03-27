"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import { AuthErrorAlert, PasswordField, TextField } from "@/src/components/ui";
import { getAuthModalFieldClassName } from "@/src/components/ui/authFieldStyles";
import { AUTH_TEXT } from "@/src/constants/authText";
import { PASSWORD_PLACEHOLDERS, PASSWORD_TOGGLE_ARIA_LABELS } from "@/src/utils/passwordValidation";

// Renders a login modal with email/password form and optional Google login (disabled)
export default function LoginModal({ onClose }: { onClose: () => void }) {
    const { login } = useAuth();
    const [mode, setMode] = useState<"choice" | "email">("choice");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Close the modal when Escape is pressed, blocked during loading
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onClose();
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [loading, onClose]);

    // Validates and submits the email/password login form
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        if (!email.trim() || !password.trim()) {
            setError(AUTH_TEXT.login.emptyCredentials);
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError(AUTH_TEXT.register.invalidEmail);
            return;
        }
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : AUTH_TEXT.login.failed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-[520px] px-10 py-8 relative text-center">
                <button
                    type="button"
                    onClick={() => {
                        if (!loading) onClose();
                    }}
                    disabled={loading}
                    className="absolute top-4 right-4 border-none bg-transparent text-xl cursor-pointer disabled:opacity-50"
                >
                    &times;
                </button>

                <div className="flex justify-center mb-4">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/609/609803.png"
                        alt="login"
                        className="w-[120px]"
                    />
                </div>

                <h2 className="text-2xl font-bold mb-6">{AUTH_TEXT.modal.title}</h2>

                {error && <AuthErrorAlert message={error} />}

                {mode === "choice" ? (
                    <>
                        <button
                            type="button"
                            onClick={() => setMode("email")}
                            className="w-full p-3.5 rounded-xl border border-[#DCD0C0] bg-white text-base mb-3 cursor-pointer hover:bg-[#E6D5C3] transition-colors"
                        >
                            ✉️ {AUTH_TEXT.modal.emailOption}
                        </button>

                        <button
                            type="button"
                            className="w-full p-3.5 rounded-xl border border-[#DCD0C0] bg-white text-base flex justify-center items-center mb-5 cursor-pointer hover:bg-[#E6D5C3] transition-colors opacity-50"
                            disabled
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="google"
                                className="w-5 mr-2"
                            />
                            {AUTH_TEXT.modal.googleComingSoon}
                        </button>
                    </>
                ) : (
                    <form onSubmit={handleEmailLogin} className="text-left space-y-3">
                        <button
                            type="button"
                            onClick={() => {
                                setMode("choice");
                                setError("");
                            }}
                            className="text-sm text-[#D9734E] hover:underline mb-2 transition-colors"
                        >
                            &larr; {AUTH_TEXT.modal.back}
                        </button>

                        <TextField
                            label={AUTH_TEXT.common.emailLabel}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={AUTH_TEXT.common.emailPlaceholder}
                            inputClassName={getAuthModalFieldClassName()}
                        />

                        <PasswordField
                            label={AUTH_TEXT.common.passwordLabel}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={PASSWORD_PLACEHOLDERS.currentPassword}
                            autoComplete="current-password"
                            showAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.show}
                            hideAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.hide}
                            inputClassName={getAuthModalFieldClassName()}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-3.5 rounded-xl border-none bg-[#D9734E] text-white text-base font-semibold cursor-pointer hover:bg-[#C25B38] transition-colors disabled:opacity-50"
                        >
                            {loading ? AUTH_TEXT.login.loading : AUTH_TEXT.login.submit}
                        </button>
                    </form>
                )}

                <p className="text-sm text-[#A89F91] mt-5">
                    {AUTH_TEXT.login.noAccount}{" "}
                    <Link
                        href="/register"
                        onClick={onClose}
                        className="text-[#D9734E] font-semibold hover:underline transition-colors"
                    >
                        {AUTH_TEXT.login.signUp}
                    </Link>
                </p>

                <p className="text-xs text-[#A89F91] mt-4">
                    {AUTH_TEXT.modal.acceptPrefix} &quot;{AUTH_TEXT.login.submit}&quot; {AUTH_TEXT.modal.acceptMiddle}{" "}
                    <span className="text-[#D9734E] cursor-pointer hover:underline transition-colors">
                        {AUTH_TEXT.modal.termsOfService}
                    </span>{" "}
                    {AUTH_TEXT.modal.and}{" "}
                    <span className="text-[#D9734E] cursor-pointer hover:underline transition-colors">
                        {AUTH_TEXT.modal.privacyPolicy}
                    </span>
                </p>
            </div>
        </div>
    );
}
