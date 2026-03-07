"use client";

import { useState, useRef, useCallback } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/src/config/firebase";
import { apiFetch } from "@/src/lib/api";

interface PhoneOTPProps {
    phoneNumber: string;
    onVerified: (data: { access_token: string; refresh_token: string }) => void;
    onError: (message: string) => void;
}

export default function PhoneOTP({ phoneNumber, onVerified, onError }: PhoneOTPProps) {
    const [step, setStep] = useState<"send" | "verify">("send");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const confirmationRef = useRef<ConfirmationResult | null>(null);
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

    const formatPhoneE164 = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            return "+66" + cleaned.substring(1);
        }
        if (cleaned.startsWith("66")) {
            return "+" + cleaned;
        }
        return "+66" + cleaned;
    };

    const startCountdown = useCallback(() => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const handleSendOTP = async () => {
        setLoading(true);
        try {
            if (!recaptchaRef.current) {
                recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
                    size: "invisible",
                });
            }

            const formattedPhone = formatPhoneE164(phoneNumber);
            const confirmation = await signInWithPhoneNumber(
                firebaseAuth,
                formattedPhone,
                recaptchaRef.current
            );

            confirmationRef.current = confirmation;
            setStep("verify");
            startCountdown();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "ส่ง OTP ไม่สำเร็จ";
            if (message.includes("too-many-requests")) {
                onError("ส่ง OTP บ่อยเกินไป กรุณารอสักครู่");
            } else if (message.includes("invalid-phone-number")) {
                onError("เบอร์โทรศัพท์ไม่ถูกต้อง");
            } else {
                onError(message);
            }
            // Reset recaptcha on error
            recaptchaRef.current = null;
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!confirmationRef.current) {
            onError("กรุณาส่ง OTP ก่อน");
            return;
        }

        setLoading(true);
        try {
            const result = await confirmationRef.current.confirm(otp);
            const idToken = await result.user.getIdToken();

            // ส่ง Firebase ID Token ไป backend เพื่อ verify และออก JWT
            const response = await apiFetch<{
                success: boolean;
                access_token: string;
                refresh_token: string;
            }>("/auth/verify-phone", {
                method: "POST",
                body: JSON.stringify({ firebaseToken: idToken }),
            });

            onVerified({
                access_token: response.access_token,
                refresh_token: response.refresh_token,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "รหัส OTP ไม่ถูกต้อง";
            if (message.includes("invalid-verification-code")) {
                onError("รหัส OTP ไม่ถูกต้อง");
            } else {
                onError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div id="recaptcha-container"></div>

            {step === "send" && (
                <div className="space-y-3">
                    <p className="text-sm text-zinc-600">
                        ระบบจะส่ง SMS ไปที่เบอร์ <span className="font-semibold">{phoneNumber}</span>
                    </p>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                        {loading ? "กำลังส่ง..." : "ส่งรหัส OTP ทาง SMS"}
                    </button>
                </div>
            )}

            {step === "verify" && (
                <div className="space-y-3">
                    <p className="text-sm text-zinc-600">
                        กรอกรหัส OTP 6 หลักที่ส่งไปยังเบอร์ <span className="font-semibold">{phoneNumber}</span>
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
