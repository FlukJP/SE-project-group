"use client";

import { useState } from "react";
import { useAuth } from "@/src/contexts/AuthContext";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [mode, setMode] = useState<"choice" | "email">("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
      <div className="bg-white rounded-2xl w-[520px] px-10 py-8 relative text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 border-none bg-transparent text-xl cursor-pointer"
        >
          ✕
        </button>

        <div className="flex justify-center mb-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/609/609803.png"
            alt="login"
            className="w-[120px]"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6">เริ่มต้นใช้งาน</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {mode === "choice" ? (
          <>
            <button
              type="button"
              onClick={() => setMode("email")}
              className="w-full p-3.5 rounded-xl border border-zinc-200 bg-white text-base mb-3 cursor-pointer hover:bg-zinc-50 transition"
            >
              ✉️ เข้าสู่ระบบด้วยอีเมล
            </button>

            <button
              type="button"
              className="w-full p-3.5 rounded-xl border border-zinc-200 bg-white text-base flex justify-center items-center mb-5 cursor-pointer hover:bg-zinc-50 transition opacity-50"
              disabled
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="google"
                className="w-5 mr-2"
              />
              เชื่อมต่อด้วย Google (เร็ว ๆ นี้)
            </button>
          </>
        ) : (
          <form onSubmit={handleEmailLogin} className="text-left space-y-3">
            <button
              type="button"
              onClick={() => { setMode("choice"); setError(""); }}
              className="text-sm text-emerald-700 hover:underline mb-2"
            >
              &larr; กลับ
            </button>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-3.5 rounded-xl border border-zinc-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full p-3.5 rounded-xl border border-zinc-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3.5 rounded-xl border-none bg-emerald-600 text-white text-base font-semibold cursor-pointer hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        )}

        <p className="text-xs text-zinc-500 mt-4">
          กด &quot;เข้าสู่ระบบ&quot; เพื่อยอมรับ{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">เงื่อนไขการใช้บริการ</span>{" "}
          และ{" "}
          <span className="text-blue-600 cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
        </p>
      </div>
    </div>
  );
}
