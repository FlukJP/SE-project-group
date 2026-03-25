"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

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
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
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
          <h1 className="text-2xl font-bold text-[#4A3B32]">เข้าสู่ระบบ</h1>
          <p className="text-sm text-[#A89F91] mt-1">เข้าสู่ระบบเพื่อซื้อขายสินค้า</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A3B32] mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-[#E6D5C3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3B32] mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full px-4 py-3 rounded-xl border border-[#E6D5C3] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9734E]/30 focus:border-[#D9734E]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#D9734E] text-white font-semibold hover:bg-[#C25B38] transition disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#A89F91]">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-[#D9734E] font-semibold hover:underline">
            สมัครสมาชิก
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#A89F91] hover:text-[#4A3B32]">
            กลับหน้าแรก
          </Link>
        </div>
      </div>
    </div>
  );
}
