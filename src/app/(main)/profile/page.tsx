"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import Profile from "@/src/components/user/Profile";

type TabKey = "profile" | "autoReply" | "review" | "manageProfile" | "account";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [showProfile, setShowProfile] = useState(false);

  // ✅ sync tab from URL safely
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (isTabKey(tabFromUrl)) setActiveTab(tabFromUrl);
  }, [searchParams]);

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
  };

  // ✅ called by Profile popup menu: go to tab and close popup
  const handleMenuNavigate = (tab: TabKey) => {
    changeTab(tab);
    setShowProfile(false);
  };

  return (
    <>
      <Navbar isLoggedIn onProfileClick={() => setShowProfile(true)} />

      <main className="bg-zinc-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* ===== Title ===== */}
          <h1 className="text-2xl font-extrabold text-emerald-700 mb-6">
            {tabTitles[activeTab]}
          </h1>

          {/* ===== Profile Summary ===== */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex items-center gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-emerald-200 grid place-items-center text-3xl">
              👤
            </div>

            <div>
              <div className="text-sm text-zinc-600">ชื่อผู้ใช้</div>
              <div className="text-lg font-bold text-emerald-800">EiEi</div>

              <div className="text-sm text-zinc-600 mt-1">
                หมายเลขสมาชิก <span className="font-semibold text-zinc-800">14884114</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            {/* ===== Sidebar ===== */}
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

            {/* ===== Content ===== */}
            <section className="bg-white border border-zinc-200 rounded-xl p-6">
              {activeTab === "profile" && <ProfileInfo />}
              {activeTab === "autoReply" && <AutoReply />}
              {activeTab === "review" && <MyReview />}
              {activeTab === "manageProfile" && <ManageProfile />}
              {activeTab === "account" && <Account />}
            </section>
          </div>
        </div>
      </main>

      {/* ✅ Profile popup menu */}
      {showProfile && (
        <Profile
          onClose={() => setShowProfile(false)}
          onNavigate={handleMenuNavigate}
        />
      )}
    </>
  );
}

/* ================= TAB CONTENT ================= */

function Label({ children }: { children: string }) {
  return <label className="block text-sm font-semibold text-zinc-700 mb-1">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
    />
  );
}

function ProfileInfo() {
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">ข้อมูลส่วนตัว</h2>

      <div className="space-y-5 max-w-xl">
        <div>
          <Label>ชื่อผู้ใช้ (แสดงให้ผู้อื่นเห็น)</Label>
          <Input defaultValue="EiEi" />
        </div>

        <div>
          <Label>ชื่อจริง</Label>
          <Input placeholder="กรอกชื่อของคุณ" />
        </div>

        <div>
          <Label>นามสกุล</Label>
          <Input placeholder="กรอกนามสกุลของคุณ" />
        </div>

        <div className="border-t border-zinc-300 pt-6 mt-6">
          <h3 className="text-base font-bold text-emerald-700 mb-4">ข้อมูลการติดต่อ</h3>

          <div className="space-y-4">
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <Input placeholder="เช่น 08x-xxx-xxxx" />
            </div>
          </div>
        </div>

        <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold">บันทึก</button>
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
      />

      <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
    </>
  );
}

function MyReview() {
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-4">รีวิวของฉัน</h2>

      <div className="border-b border-zinc-200 pb-3 mb-6 font-semibold text-zinc-700">
        รีวิวที่รอดำเนินการ (0)
      </div>

      <div className="text-center text-zinc-500 py-16">⭐ ยังไม่มีรายการรีวิว</div>
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

      <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
    </>
  );
}

function Account() {
  return (
    <>
      <h2 className="text-lg font-bold text-emerald-700 mb-6">การเข้าสู่ระบบ</h2>

      <div className="space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <span>Facebook</span>
          <button className="border border-zinc-300 px-4 py-1.5 rounded-lg">เชื่อมต่อ</button>
        </div>

        <div className="flex items-center justify-between">
          <span>Gmail</span>
          <span className="text-emerald-600 font-semibold">เชื่อมต่อแล้ว</span>
        </div>

        <div>
          <Label>อีเมลสำหรับเข้าสู่ระบบ</Label>
          <Input placeholder="your@email.com" />
          <button className="border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg mt-2">
            ยืนยัน
          </button>
        </div>

        <button className="border border-emerald-600 text-emerald-700 px-4 py-2 rounded-lg">เปลี่ยนรหัสผ่าน</button>
      </div>
    </>
  );
}