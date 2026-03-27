"use client";

import { useState, useCallback, useRef, useEffect, useId } from "react";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/src/lib/firebase";

interface PhoneOTPProps {
    phone: string;
    onVerified: (data: { idToken: string }) => void;
    onError: (message: string) => void;
}

const FIREBASE_PHONE_ERRORS: Record<string, string> = {
    "auth/invalid-app-credential": "reCAPTCHA ผิดพลาด กรุณา refresh หน้าแล้วลองใหม่",
    "auth/captcha-check-failed": "reCAPTCHA ผิดพลาด กรุณาลองใหม่",
    "auth/invalid-recaptcha-token": "reCAPTCHA หมดอายุ กรุณาลองใหม่",
    "auth/invalid-phone-number": "เบอร์โทรศัพท์ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
    "auth/missing-phone-number": "กรุณากรอกเบอร์โทรศัพท์",
    "auth/too-many-requests": "ส่ง OTP บ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
    "auth/quota-exceeded": "เกินโควต้า SMS กรุณาลองใหม่ภายหลัง",
    "auth/network-request-failed": "ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบเครือข่าย",
    "auth/code-expired": "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่",
    "auth/invalid-verification-code": "รหัส OTP ไม่ถูกต้อง",
};

// Maps a Firebase auth error code to a user-facing Thai error message
function getFirebaseErrorMessage(err: unknown): string {
    const code = (err as { code?: string }).code;
    console.error("[PhoneOTP] Firebase error:", code, err);
    if (code && FIREBASE_PHONE_ERRORS[code]) return FIREBASE_PHONE_ERRORS[code];
    if (err instanceof Error) return err.message;
    return "เกิดข้อผิดพลาด กรุณาลองใหม่";
}

// Converts a Thai local phone number to E.164 international format
function toE164(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("66")) return `+${digits}`;
    if (digits.startsWith("0")) return `+66${digits.slice(1)}`;
    return `+${digits}`;
}

// Handles SMS OTP flow via Firebase: sending a verification code and confirming it to obtain an ID token
export default function PhoneOTP({ phone, onVerified, onError }: PhoneOTPProps) {
    const [step, setStep] = useState<"send" | "verify">("send");
    const recaptchaContainerId = useId();
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
    const confirmationRef = useRef<ConfirmationResult | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (recaptchaRef.current) {
                recaptchaRef.current.clear();
                recaptchaRef.current = null;
            }
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

    // Initializes a fresh reCAPTCHA verifier and sends an OTP to the given phone number
    const handleSendOTP = async () => {
        if (loading) return;
        setLoading(true);
        try {
            // Always create a fresh RecaptchaVerifier — reusing an old one causes auth/invalid-recaptcha-token
            if (recaptchaRef.current) {
                recaptchaRef.current.clear();
                recaptchaRef.current = null;
            }
            const verifier = new RecaptchaVerifier(firebaseAuth, recaptchaContainerId, {
                size: "invisible",
            });
            recaptchaRef.current = verifier;

            const phoneE164 = toE164(phone);
            const result = await signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
            confirmationRef.current = result;

            setStep("verify");
            setOtp("");
            startCountdown();
        } catch (err: unknown) {
            onError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // Confirms the entered OTP with Firebase and calls onVerified with the resulting ID token
    const handleVerifyOTP = async () => {
        if (loading || !confirmationRef.current) return;
        setLoading(true);
        try {
            const credential = await confirmationRef.current.confirm(otp);
            const idToken = await credential.user.getIdToken();
            onVerified({ idToken });
        } catch (err: unknown) {
            onError(getFirebaseErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Invisible reCAPTCHA container (required by Firebase) */}
            <div id={recaptchaContainerId} />

            {step === "send" && (
                <div className="space-y-3">
                    <p className="text-sm text-[#A89F91]">
                        ระบบจะส่งรหัส OTP ทาง SMS ไปที่เบอร์{" "}
                        <span className="font-semibold">{phone}</span>
                    </p>
                    <button
                        onClick={handleSendOTP}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
                    >
                        {loading ? "กำลังส่ง..." : "ส่งรหัส OTP ทาง SMS"}
                    </button>
                </div>
            )}

            {step === "verify" && (
                <div className="space-y-3">
                    <p className="text-sm text-[#A89F91]">
                        กรอกรหัส OTP 6 หลักที่ส่ง SMS ไปที่เบอร์{" "}
                        <span className="font-semibold">{phone}</span>
                    </p>
                    <input
                        type="text"
                        inputMode="numeric"
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
