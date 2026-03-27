"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { AuthErrorAlert, PasswordField, TextField } from "@/src/components/ui";
import { getAuthPageFieldClassName } from "@/src/components/ui/authFieldStyles";
import { AUTH_TEXT } from "@/src/constants/authText";
import { PASSWORD_PLACEHOLDERS, PASSWORD_TOGGLE_ARIA_LABELS } from "@/src/utils/passwordValidation";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(AUTH_TEXT.login.emptyCredentials);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : AUTH_TEXT.login.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E6D5C3] p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E6D5C3] mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4A3B32]">{AUTH_TEXT.login.title}</h1>
          <p className="text-sm text-[#A89F91] mt-1">{AUTH_TEXT.login.subtitle}</p>
        </div>

        {error && <AuthErrorAlert message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={AUTH_TEXT.common.emailLabel}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={AUTH_TEXT.common.emailPlaceholder}
            inputClassName={getAuthPageFieldClassName()}
          />

          <PasswordField
            label={AUTH_TEXT.common.passwordLabel}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={PASSWORD_PLACEHOLDERS.currentPassword}
            autoComplete="current-password"
            showAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.show}
            hideAriaLabel={PASSWORD_TOGGLE_ARIA_LABELS.hide}
            inputClassName={getAuthPageFieldClassName()}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
          >
            {loading ? AUTH_TEXT.login.loading : AUTH_TEXT.login.submit}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#A89F91]">
          {AUTH_TEXT.login.noAccount}{" "}
          <Link href="/register" className="text-[#D9734E] font-semibold hover:underline">
            {AUTH_TEXT.login.signUp}
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#A89F91] hover:text-[#4A3B32]">
            {AUTH_TEXT.login.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
