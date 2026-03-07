"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { authApi } from "@/src/lib/api";

interface EmailOTPProps {
    email: string;
    onVerified: (data: { access_token: string; refresh_token: string }) => void;
    onError: (message: string) => void;
}

export default function EmailOTP({ email, onVerified, onError }: EmailOTPProps) {
    const [step, setStep] = useState<"send" | "verify">("send");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startCountdown = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCountdown(60);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleSendOTP = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await authApi.requestOTP(email);
            setStep("verify");
            startCountdown();
        } catch (err: unknown) {
            onError(err instanceof Error ? err.message : "ส่ง OTP ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await authApi.verifyOTP(email, otp);
            onVerified({
                access_token: response.access_token,
                refresh_token: response.refresh_token,
            });
        } catch (err: unknown) {
            onError(err instanceof Error ? err.message : "รหัส OTP ไม่ถูกต้อง");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {step === "send" && (
                <div className="space-y-3">
                    <p className="text-sm text-zinc-600">
                        ระบบจะส่งรหัส OTP ไปที่อีเมล <span className="font-semibold">{email}</span>
                    </p>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {loading ? "กำลังส่ง..." : "ส่งรหัส OTP ทางอีเมล"}
                    </button>
                </div>
            )}

            {step === "verify" && (
                <div className="space-y-3">
                    <p className="text-sm text-zinc-600">
                        กรอกรหัส OTP 6 หลักที่ส่งไปยังอีเมล <span className="font-semibold">{email}</span>
                    </p>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="กรอกรหัส OTP 6 หลัก"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {loading ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
                    </button>

                    <button
                        onClick={handleSendOTP}
                        disabled={loading || countdown > 0}
                        className="w-full py-2 text-sm text-emerald-600 hover:underline disabled:text-zinc-400 disabled:no-underline"
                    >
                        {countdown > 0 ? `ส่งใหม่ได้ใน ${countdown} วินาที` : "ส่งรหัส OTP อีกครั้ง"}
                    </button>
                </div>
            )}
        </div>
    );
}
