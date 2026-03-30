"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authApi } from "@/src/lib/api";

interface PhoneOTPProps {
    phone: string;
    onVerified: (data: { access_token: string }) => void | Promise<void>;
    onError: (message: string) => void;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof Error && err.message.trim()) return err.message;
    return fallback;
}

export default function PhoneOTP({ phone, onVerified, onError }: PhoneOTPProps) {
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

    const startCountdown = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setCountdown(60);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
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
            await authApi.requestPhoneOTP(phone);
            setStep("verify");
            setOtp("");
            startCountdown();
        } catch (err: unknown) {
            onError(getApiErrorMessage(err, "ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"));
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (loading || otp.length !== 6) return;
        setLoading(true);

        try {
            const result = await authApi.verifyPhoneOTP(phone, otp);
            await onVerified({ access_token: result.access_token });
        } catch (err: unknown) {
            onError(getApiErrorMessage(err, "รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {step === "send" && (
                <div className="space-y-3">
                    <p className="text-sm text-[#A89F91]">
                        ระบบจะส่งรหัส OTP สำหรับยืนยันเบอร์โทร <span className="font-semibold">{phone}</span>
                    </p>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full rounded-xl bg-[#D9734E] py-3 font-semibold text-white transition hover:bg-[#C25B38] disabled:opacity-50"
                    >
                        {loading ? "กำลังส่ง..." : "ส่งรหัส OTP"}
                    </button>
                </div>
            )}

            {step === "verify" && (
                <div className="space-y-3">
                    <p className="text-sm text-[#A89F91]">
                        กรอกรหัส OTP 6 หลักสำหรับยืนยันเบอร์โทร <span className="font-semibold">{phone}</span>
                    </p>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="กรอกรหัส OTP 6 หลัก"
                        maxLength={6}
                        className="w-full rounded-xl border border-[#E6D5C3] px-4 py-3 text-center font-mono text-sm tracking-[0.5em] focus:border-[#D9734E] focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30"
                    />
                    <button
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.length !== 6}
                        className="w-full rounded-xl bg-[#D9734E] py-3 font-semibold text-white transition hover:bg-[#C25B38] disabled:opacity-50"
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
