"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { userApi, API_BASE, reviewApi, type ReviewData } from "@/src/lib/api";

type TabKey = "profile" | "autoReply" | "review" | "manageProfile" | "account";

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
  const { user, isLoggedIn, isLoading, refreshUser } = useAuth();

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

  const isTabKey = (v: string | null): v is TabKey => {
    if (!v) return false;
    return ["profile", "autoReply", "review", "manageProfile", "account"].includes(v);
  };

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
              {activeTab === "profile" && (
                <ProfileInfo
                  username={user?.Username || ""}
                  phone={user?.Phone_number || ""}
                  onSaved={refreshUser}
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
  onSaved,
}: {
  username: string;
  phone: string;
  onSaved: () => Promise<void>;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await userApi.updateMe({ Username: username, Phone_number: phone });
      await onSaved();
      setMessage("บันทึกสำเร็จ");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">ข้อมูลส่วนตัว</h2>

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
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">ข้อความตอบกลับอัตโนมัติ</h2>

      <Label>ข้อความที่ส่งอัตโนมัติเมื่อมีคนทักแชท</Label>

      <textarea
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 h-32 focus:ring-2 focus:ring-emerald-300"
        defaultValue="ขอบคุณที่สนใจสินค้าของเรา ทักมาสอบถามได้เลย"
        aria-label="ข้อความตอบกลับอัตโนมัติ"
      />

      <button type="button" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
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
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">จัดการโปรไฟล์ร้าน</h2>

      <Label>รายละเอียดโปรไฟล์ (แสดงในหน้าร้าน)</Label>

      <textarea
        className="w-full border border-zinc-300 rounded-lg px-3 py-2 h-28 focus:ring-2 focus:ring-emerald-300"
        placeholder="แนะนำร้านของคุณสั้น ๆ"
      />

      <button type="button" className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
    </>
  );
}

function Account({ email }: { email: string }) {
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">การเข้าสู่ระบบ</h2>

      <div className="space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <span>Facebook</span>
          <button type="button" className="border border-zinc-300 px-4 py-1.5 rounded-lg">เชื่อมต่อ</button>
        </div>

        <div className="flex items-center justify-between">
          <span>Gmail</span>
          <span className="text-emerald-600 font-semibold">เชื่อมต่อแล้ว</span>
        </div>

        <div>
          <Label>อีเมลสำหรับเข้าสู่ระบบ</Label>
          <InputField defaultValue={email} placeholder="your@email.com" />
        </div>

        <button type="button" className="border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg">เปลี่ยนรหัสผ่าน</button>
      </div>
    </>
  );
}
