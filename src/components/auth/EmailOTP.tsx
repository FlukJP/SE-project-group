"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { authApi } from "@/src/lib/api";

interface EmailOTPProps {
    email: string;
    onVerified: (data: { access_token: string; refresh_token: string }) => void;
    onError: (message: string) => void;
}

// Handles email OTP flow: requesting a code and verifying it to authenticate the user
export default function EmailOTP({ email, onVerified, onError }: EmailOTPProps) {
    const [step, setStep] = useState<"send" | "verify">("send");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Starts a 60-second countdown that prevents the user from requesting a new OTP too quickly
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

    // Requests an OTP to be sent to the user's email and transitions to the verify step
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

    // Verifies the entered OTP and calls onVerified with the resulting tokens on success
    const handleVerifyOTP = async () => {
        if (loading || otp.length !== 6) return;
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
                    <p className="text-sm text-[#A89F91]">
                        ระบบจะส่งรหัส OTP ไปที่อีเมล <span className="font-semibold">{email}</span>
                    </p>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
                    >
                        {loading ? "กำลังส่ง..." : "ส่งรหัส OTP ทางอีเมล"}
                    </button>
                </div>
            )}

            {step === "verify" && (
                <div className="space-y-3">
                    <p className="text-sm text-[#A89F91]">
                        กรอกรหัส OTP 6 หลักที่ส่งไปยังอีเมล <span className="font-semibold">{email}</span>
                    </p>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="กรอกรหัส OTP 6 หลัก"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-xl border border-[#E6D5C3] text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E]"
                    />
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length !== 6}
                        className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
                    >
                        {loading ? "กำลังยืนยัน..." : "ยืนยัน OTP"}
                    </button>

                    <button
                        onClick={handleSendOTP}
                        disabled={loading || countdown > 0}
                        className="w-full py-2 text-sm text-[#D9734E] hover:underline disabled:text-[#A89F91] disabled:no-underline"
                    >
                        {countdown > 0 ? `ส่งใหม่ได้ใน ${countdown} วินาที` : "ส่งรหัส OTP อีกครั้ง"}
                    </button>
                </div>
            )}
        </div>
    );
}
