"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { authApi } from "@/src/lib/api";
import EmailOTP from "@/src/components/auth/EmailOTP";
import PhoneOTP from "@/src/components/auth/PhoneOTP";
import { PROVINCES } from "@/src/data/provinces";

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "อ่อนมาก", color: "bg-red-500" };
  if (score === 2) return { level: 2, label: "อ่อน", color: "bg-orange-500" };
  if (score === 3) return { level: 3, label: "ปานกลาง", color: "bg-yellow-500" };
  if (score === 4) return { level: 4, label: "แข็งแรง", color: "bg-emerald-400" };
  return { level: 5, label: "แข็งแรงมาก", color: "bg-emerald-600" };
}

function validatePhone(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "กรุณากรอกเบอร์โทรศัพท์";
  if (!cleaned.startsWith("0")) return "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0";
  if (cleaned.length !== 10) return "เบอร์โทรศัพท์ต้องมี 10 หลัก";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return "กรุณากรอกอีเมล";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "รูปแบบอีเมลไม่ถูกต้อง";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { isLoggedIn, setTokensAndLoadUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "email-otp" | "phone-otp">("form");
  const [addressDetail, setAddressDetail] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const selectedProvinceData = PROVINCES.find((p) => p.name === province);

  // Track which fields have been touched for inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  if (isLoggedIn) return null;

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Per-field validation (only shown after touch)
  const usernameError = touched.username && !username.trim() ? "กรุณากรอกชื่อผู้ใช้" : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const phoneError = touched.phone ? validatePhone(phone) : null;
  const passwordError = touched.password && password.length > 0 && password.length < 8 ? "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" : null;
  const confirmError = touched.confirmPassword && confirmPassword.length > 0 && password !== confirmPassword ? "รหัสผ่านไม่ตรงกัน" : null;
  const addressDetailError = touched.addressDetail && !addressDetail.trim() ? "กรุณากรอกที่อยู่" : null;
  const provinceError = touched.province && !province ? "กรุณาเลือกจังหวัด" : null;
  const districtError = touched.district && !district ? "กรุณาเลือกเขต/อำเภอ" : null;

  const pwStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Mark all fields as touched
    setTouched({ username: true, email: true, phone: true, password: true, confirmPassword: true, addressDetail: true, province: true, district: true });

    // Validate all
    if (!username.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    const eErr = validateEmail(email);
    if (eErr) { setError(eErr); return; }
    const pErr = validatePhone(phone);
    if (pErr) { setError(pErr); return; }
    if (password.length < 8) { setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"); return; }
    if (password !== confirmPassword) { setError("รหัสผ่านไม่ตรงกัน"); return; }
    if (!addressDetail.trim()) { setError("กรุณากรอกที่อยู่"); return; }
    if (!province) { setError("กรุณาเลือกจังหวัด"); return; }
    if (!district) { setError("กรุณาเลือกเขต/อำเภอ"); return; }

    const fullAddress = [addressDetail.trim(), district, province, postalCode.trim()].filter(Boolean).join(" ");

    setError("");
    setLoading(true);
    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: fullAddress,
      });
      setStep("email-otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // Fix #19: After email OTP verified, move to phone OTP step before going home
  const handleEmailVerified = async (data: { access_token: string; refresh_token: string }) => {
    try {
      await setTokensAndLoadUser(data.access_token, data.refresh_token);
      setError("");
      setStep("phone-otp");
    } catch {
      setError("เข้าสู่ระบบอัตโนมัติไม่สำเร็จ กรุณาเข้าสู่ระบบด้วยตัวเอง");
    }
  };

  const handlePhoneVerified = async (data: { idToken: string }) => {
    try {
      const result = await authApi.verifyPhoneFirebase(data.idToken);
      await setTokensAndLoadUser(result.access_token, result.refresh_token);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ยืนยันเบอร์โทรไม่สำเร็จ");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-zinc-200 p-8">
        {step === "form" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <span className="text-3xl">📝</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">สมัครสมาชิก</h1>
              <p className="text-sm text-zinc-500 mt-1">สร้างบัญชีเพื่อเริ่มซื้อขาย</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => markTouched("username")}
                  placeholder="ชื่อที่แสดงให้ผู้อื่นเห็น"
                  autoComplete="username"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${usernameError ? "border-red-300" : "border-zinc-200"}`}
                />
                {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">อีเมล</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${emailError ? "border-red-300" : "border-zinc-200"}`}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => markTouched("phone")}
                  placeholder="08x-xxx-xxxx"
                  autoComplete="tel"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${phoneError ? "border-red-300" : "border-zinc-200"}`}
                />
                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => markTouched("password")}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${passwordError ? "border-red-300" : "border-zinc-200"}`}
                />
                {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= pwStrength.level ? pwStrength.color : "bg-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">{pwStrength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">ยืนยันรหัสผ่าน</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => markTouched("confirmPassword")}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${confirmError ? "border-red-300" : "border-zinc-200"}`}
                />
                {confirmError && <p className="text-xs text-red-500 mt-1">{confirmError}</p>}
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold text-zinc-700 mb-3">ที่อยู่สำหรับจัดส่ง</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">บ้านเลขที่ / ซอย / ถนน</label>
                    <input
                      type="text"
                      value={addressDetail}
                      onChange={(e) => setAddressDetail(e.target.value)}
                      onBlur={() => markTouched("addressDetail")}
                      placeholder="เช่น 123/4 ซอยสุขุมวิท 11 ถนนสุขุมวิท"
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${addressDetailError ? "border-red-300" : "border-zinc-200"}`}
                    />
                    {addressDetailError && <p className="text-xs text-red-500 mt-1">{addressDetailError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">จังหวัด</label>
                    <select
                      value={province}
                      onChange={(e) => { setProvince(e.target.value); setDistrict(""); }}
                      onBlur={() => markTouched("province")}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white ${provinceError ? "border-red-300" : "border-zinc-200"}`}
                    >
                      <option value="">-- เลือกจังหวัด --</option>
                      {PROVINCES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    {provinceError && <p className="text-xs text-red-500 mt-1">{provinceError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">เขต / อำเภอ</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      onBlur={() => markTouched("district")}
                      disabled={!province}
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white disabled:bg-zinc-50 disabled:text-zinc-400 ${districtError ? "border-red-300" : "border-zinc-200"}`}
                    >
                      <option value="">-- เลือกเขต/อำเภอ --</option>
                      {selectedProvinceData?.districts.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {districtError && <p className="text-xs text-red-500 mt-1">{districtError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">รหัสไปรษณีย์ <span className="text-zinc-400 font-normal">(ไม่บังคับ)</span></label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="เช่น 10110"
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600">
                กลับหน้าแรก
              </Link>
            </div>
          </>
        )}

        {step === "email-otp" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <span className="text-3xl">📧</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">ยืนยันอีเมล</h1>
              <p className="text-sm text-zinc-500 mt-1">ยืนยันตัวตนด้วยรหัส OTP ทางอีเมล</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
                {error}
              </div>
            )}

            <EmailOTP
              email={email}
              onVerified={handleEmailVerified}
              onError={(msg) => setError(msg)}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-zinc-400 hover:text-zinc-600"
              >
                ข้ามขั้นตอนนี้ ไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          </>
        )}

        {step === "phone-otp" && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-zinc-900">ยืนยันเบอร์โทรศัพท์</h1>
              <p className="text-sm text-zinc-500 mt-1">ยืนยันเบอร์โทรศัพท์เพื่อเริ่มซื้อขาย</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
                {error}
              </div>
            )}

            <PhoneOTP
              phone={phone}
              onVerified={handlePhoneVerified}
              onError={(msg) => setError(msg)}
            />

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-zinc-400 hover:text-zinc-600"
              >
                ข้ามขั้นตอนนี้
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
