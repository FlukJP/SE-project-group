"use client";

import { Suspense, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { userApi, productApi, reviewApi, type ReviewData, API_BASE } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import EmailOTP from "@/src/components/auth/EmailOTP";
import PhoneOTP from "@/src/components/auth/PhoneOTP";

type TabKey = "profile" | "autoReply" | "review" | "manageProfile" | "account";

const VALID_TABS: TabKey[] = ["profile", "autoReply", "review", "manageProfile", "account"];
function isTabKey(v: string | null): v is TabKey {
  if (!v) return false;
  return VALID_TABS.includes(v as TabKey);
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<><Navbar /><div className="text-center py-16 text-zinc-500">กำลังโหลด...</div></>}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoggedIn, isLoading, refreshUser, setTokensAndLoadUser } = useAuth();

  const tabTitles: Record<TabKey, string> = useMemo(
    () => ({
      profile: "ข้อมูลส่วนตัว",
      autoReply: "ข้อความตอบกลับอัตโนมัติ",
      review: "รีวิวของฉัน",
      manageProfile: "จัดการโปรไฟล์",
      account: "จัดการบัญชี",
    }),
    []
  );

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (isTabKey(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [searchParams]);

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16">
          <p className="text-lg mb-4">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="bg-zinc-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold text-emerald-700 mb-6">
            {tabTitles[activeTab]}
          </h1>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-emerald-200 grid place-items-center text-3xl overflow-hidden">
              {user?.Avatar_URL ? (
                <img
                  src={`${API_BASE}${user.Avatar_URL}`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                "👤"
              )}
            </div>

            <div>
              <div className="text-sm text-zinc-600">ชื่อผู้ใช้</div>
              <div className="text-lg font-bold text-emerald-800">
                {user?.Username || "..."}
              </div>

              <div className="text-sm text-zinc-600 mt-1">
                หมายเลขสมาชิก{" "}
                <span className="font-semibold text-zinc-800">
                  {user?.User_ID || "..."}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            <aside className="bg-white border border-zinc-200 rounded-xl p-4">
              {[
                { key: "profile", label: "ข้อมูลส่วนตัว" },
                { key: "autoReply", label: "ข้อความตอบกลับอัตโนมัติ" },
                { key: "review", label: "รีวิวของฉัน" },
                { key: "manageProfile", label: "จัดการโปรไฟล์" },
                { key: "account", label: "จัดการบัญชี" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => changeTab(item.key as TabKey)}
                  className={`w-full text-left px-4 py-2 rounded-lg mb-1 flex justify-between items-center
                    ${
                      activeTab === item.key
                        ? "bg-emerald-100 text-emerald-800 font-semibold"
                        : "hover:bg-zinc-50"
                    }
                  `}
                >
                  {item.label}
                  <span>›</span>
                </button>
              ))}
            </aside>

            <section className="bg-white border border-zinc-200 rounded-xl p-6">
              {/* Fix #9: Use key to force remount when user data changes, preventing stale sync */}
              {activeTab === "profile" && (
                <ProfileInfo
                  key={`${user?.Username}-${user?.Phone_number}-${user?.Is_Email_Verified}-${user?.Is_Phone_Verified}`}
                  username={user?.Username || ""}
                  phone={user?.Phone_number || ""}
                  email={user?.Email || ""}
                  isEmailVerified={!!user?.Is_Email_Verified}
                  isPhoneVerified={!!user?.Is_Phone_Verified}
                  onSaved={refreshUser}
                  onVerified={async (data) => {
                    await setTokensAndLoadUser(data.access_token, data.refresh_token);
                  }}
                />
              )}
              {activeTab === "autoReply" && <AutoReply />}
              {activeTab === "review" && <MyReview />}
              {activeTab === "manageProfile" && <ManageProfile />}
              {activeTab === "account" && <Account email={user?.Email || ""} />}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

function Label({ children }: { children: string }) {
  return <label className="block text-sm font-semibold text-zinc-700 mb-1">{children}</label>;
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
    />
  );
}

function ProfileInfo({
  username: initialUsername,
  phone: initialPhone,
  email,
  isEmailVerified,
  isPhoneVerified,
  onSaved,
  onVerified,
}: {
  username: string;
  phone: string;
  email: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onSaved: () => Promise<void>;
  onVerified: (data: { access_token: string; refresh_token: string }) => Promise<void>;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Sync state when props change (e.g., after refreshUser)
  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    setPhone(initialPhone);
  }, [initialPhone]);

  const handleSave = async () => {
    if (saving) return;
    if (!username.trim()) {
      setMessage("กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (phone && !/^0\d{9}$/.test(phone.replace(/\D/g, ""))) {
      setMessage("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await userApi.updateMe({ Username: username.trim(), Phone_number: phone.trim() });
      await onSaved();
      setMessage("บันทึกสำเร็จ");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleOTPVerified = async (data: { access_token: string; refresh_token: string }) => {
    await onVerified(data);
    setShowEmailOTP(false);
    setShowPhoneOTP(false);
  };

  const allVerified = isEmailVerified && isPhoneVerified;

  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">ข้อมูลส่วนตัว</h2>

      {/* Verification Status */}
      <div className="mb-6 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
        <h3 className="text-base font-bold text-zinc-700 mb-3">สถานะการยืนยันตัวตน</h3>
        <div className="space-y-2">
          {/* Email verification */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">อีเมล ({email})</span>
            {isEmailVerified ? (
              <span className="text-sm font-semibold text-emerald-600">ยืนยันแล้ว</span>
            ) : (
              <button
                type="button"
                onClick={() => { setShowEmailOTP(true); setShowPhoneOTP(false); setOtpError(""); }}
                className="text-sm font-semibold text-orange-600 hover:underline"
              >
                ยังไม่ยืนยัน — กดเพื่อยืนยัน
              </button>
            )}
          </div>
          {/* Phone verification */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">เบอร์โทรศัพท์ ({phone || "ยังไม่ได้กรอก"})</span>
            {isPhoneVerified ? (
              <span className="text-sm font-semibold text-emerald-600">ยืนยันแล้ว</span>
            ) : !isEmailVerified ? (
              <span className="text-sm text-zinc-400">รอยืนยันอีเมลก่อน</span>
            ) : !phone ? (
              <span className="text-sm text-zinc-400">กรุณากรอกเบอร์โทรก่อน</span>
            ) : (
              <button
                type="button"
                onClick={() => { setShowPhoneOTP(true); setShowEmailOTP(false); setOtpError(""); }}
                className="text-sm font-semibold text-orange-600 hover:underline"
              >
                ยังไม่ยืนยัน — กดเพื่อยืนยัน
              </button>
            )}
          </div>
        </div>

        {!allVerified && !showEmailOTP && !showPhoneOTP && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            กรุณายืนยันตัวตนทั้งอีเมลและเบอร์โทรศัพท์ จึงจะสามารถแชท ซื้อ หรือขายสินค้าได้
          </div>
        )}

        {/* Email OTP form */}
        {showEmailOTP && !isEmailVerified && (
          <div className="mt-4 p-4 bg-white border border-emerald-200 rounded-xl">
            <h4 className="text-sm font-semibold text-emerald-700 mb-3">ยืนยันอีเมลด้วย OTP</h4>
            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-3">
                {otpError}
              </div>
            )}
            <EmailOTP
              email={email}
              onVerified={handleOTPVerified}
              onError={(msg) => setOtpError(msg)}
            />
            <button
              type="button"
              onClick={() => setShowEmailOTP(false)}
              className="mt-3 text-sm text-zinc-400 hover:text-zinc-600"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Phone OTP form */}
        {showPhoneOTP && !isPhoneVerified && isEmailVerified && phone && (
          <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-700 mb-3">ยืนยันเบอร์โทรศัพท์ด้วย OTP</h4>
            <p className="text-xs text-zinc-500 mb-3">* รหัส OTP จะถูกส่งไปที่อีเมลของคุณ เพื่อยืนยันเบอร์โทร</p>
            {otpError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 mb-3">
                {otpError}
              </div>
            )}
            <PhoneOTP
              phone={phone}
              onVerified={handleOTPVerified}
              onError={(msg) => setOtpError(msg)}
            />
            <button
              type="button"
              onClick={() => setShowPhoneOTP(false)}
              className="mt-3 text-sm text-zinc-400 hover:text-zinc-600"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      <div className="space-y-5 max-w-xl">
        <div>
          <Label>ชื่อผู้ใช้ (แสดงให้ผู้อื่นเห็น)</Label>
          <InputField value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div className="border-t border-zinc-300 pt-6 mt-6">
          <h3 className="text-base font-bold text-emerald-700 mb-4">ข้อมูลการติดต่อ</h3>

          <div className="space-y-4">
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <InputField
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 08x-xxx-xxxx"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className={`text-sm ${message === "บันทึกสำเร็จ" ? "text-emerald-600" : "text-red-600"}`}>
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </>
  );
}

function AutoReply() {
  const [message, setMessage] = useState("ขอบคุณที่สนใจสินค้าของเรา ทักมาสอบถามได้เลย");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: wire to API when backend supports auto-reply
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">ข้อความตอบกลับอัตโนมัติ</h2>

      <Label>ข้อความที่ส่งอัตโนมัติเมื่อมีคนทักแชท</Label>

      <textarea
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-emerald-300"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="ข้อความตอบกลับอัตโนมัติ"
      />

      {saved && <p className="text-sm text-emerald-600 mt-2">บันทึกสำเร็จ</p>}

      <button type="button" onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
    </>
  );
}

function MyReview() {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewApi
      .getMyReviews()
      .then((res) => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-4">รีวิวของฉัน</h2>

      <div className="border-b border-zinc-200 pb-3 mb-6 font-semibold text-zinc-700">
        รีวิวที่เขียนแล้ว ({reviews.length})
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((r) => {
            const date = new Date(r.Created_at);
            const formatted = date.toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            return (
              <div
                key={r.Review_ID}
                className="border border-zinc-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-zinc-800">
                    {r.ProductTitle || "สินค้า"}
                  </div>
                  <div className="text-xs text-zinc-400">{formatted}</div>
                </div>
                <div className="mb-1 text-yellow-400 text-sm">
                  {"★".repeat(r.Rating)}
                  <span className="text-zinc-300">{"★".repeat(5 - r.Rating)}</span>
                </div>
                {r.Comment && (
                  <p className="text-sm text-zinc-600">{r.Comment}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-zinc-500 py-16">ยังไม่มีรายการรีวิว</div>
      )}
    </>
  );
}

function ManageProfile() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.User_ID) { setLoading(false); return; }
    productApi
      .getBySeller(user.User_ID)
      .then((res) => setProducts(res.data.map(toProductDisplay)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [user?.User_ID]);

  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">จัดการโปรไฟล์ร้าน</h2>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-zinc-700">
          สินค้าของฉัน ({products.length})
        </h3>
        <Link
          href="/products/create"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
        >
          + ลงขายสินค้าใหม่
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="border border-zinc-200 rounded-xl overflow-hidden hover:shadow-md transition bg-white"
            >
              <div className="aspect-square bg-zinc-100 overflow-hidden">
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-300 text-3xl">📷</div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-zinc-800 truncate">{p.title}</div>
                <div className="text-sm font-bold text-emerald-700 mt-1">{p.price.toLocaleString()} ฿</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {p.status === "available" ? "กำลังขาย" : p.status === "reserved" ? "จอง" : "ขายแล้ว"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-zinc-500 py-16">
          <div className="text-4xl mb-3">📦</div>
          <p>ยังไม่มีสินค้า</p>
          <Link href="/products/create" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">
            ลงขายสินค้าแรกของคุณ
          </Link>
        </div>
      )}
    </>
  );
}

function Account({ email }: { email: string }) {
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">การเข้าสู่ระบบ</h2>

      <div className="space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <span>Google</span>
          <button type="button" disabled className="border border-zinc-300 px-4 py-1.5 rounded-lg opacity-50 cursor-not-allowed">เชื่อมต่อ (เร็วๆ นี้)</button>
        </div>

        <div>
          <Label>อีเมลสำหรับเข้าสู่ระบบ</Label>
          <InputField value={email} readOnly />
        </div>

        <button type="button" disabled className="border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">เปลี่ยนรหัสผ่าน (เร็วๆ นี้)</button>
      </div>
    </>
  );
}
