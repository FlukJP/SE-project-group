"use client";

import { Suspense, startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  API_BASE,
  orderApi,
  productApi,
  reviewApi,
  resolveMediaUrl,
  userApi,
  type OrderWithDetails,
  type ReviewData,
} from "@/src/lib/api";
import { type ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import ProductCard from "@/src/components/product/ProductCard";
import EmailOTP from "@/src/components/auth/EmailOTP";
import PhoneOTP from "@/src/components/auth/PhoneOTP";
import {
  FormErrorNotice,
  FormSuccessNotice,
  SidebarNavGroup,
  TextareaField,
} from "@/src/components/ui";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";

type TabKey = "profile" | "autoReply" | "review" | "manageProfile" | "account";

const VALID_TABS: TabKey[] = ["profile", "autoReply", "review", "manageProfile", "account"];
const PROFILE_NAV_ITEMS: { key: TabKey; label: string; suffix: string }[] = [
  { key: "profile", label: "ข้อมูลส่วนตัว", suffix: "›" },
  { key: "autoReply", label: "ข้อความตอบกลับอัตโนมัติ", suffix: "›" },
  { key: "review", label: "รีวิวของฉัน", suffix: "›" },
  { key: "manageProfile", label: "จัดการโปรไฟล์", suffix: "›" },
  { key: "account", label: "จัดการบัญชี", suffix: "›" },
];

function isTabKey(v: string | null): v is TabKey {
  if (!v) return false;
  return VALID_TABS.includes(v as TabKey);
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <>
          <Navbar />
          <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
        </>
      }
    >
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
    if (isTabKey(tabFromUrl)) {
      startTransition(() => setActiveTab(tabFromUrl));
    }
  }, [searchParams]);

  const changeTab = (tab: TabKey) => {
    setActiveTab(tab);
    router.push(`/profile?tab=${tab}`);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="py-16 text-center">
          <p className="mb-4 text-lg">กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F9F6F0]">
        <div className="container mx-auto px-4 py-8">
          <h1 className="mb-6 text-2xl font-extrabold text-[#D9734E]">{tabTitles[activeTab]}</h1>

          <div className="mb-8 flex items-center gap-6 rounded-xl border border-[#DCD0C0] bg-[#E6D5C3] p-6">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#E6D5C3] text-3xl">
              {user?.Avatar_URL ? (
                <img src={resolveMediaUrl(user.Avatar_URL)} alt="" className="h-full w-full object-cover" />
              ) : (
                "👤"
              )}
            </div>

            <div>
              <div className="text-sm text-[#A89F91]">ชื่อผู้ใช้</div>
              <div className="text-lg font-bold text-[#4A3B32]">{user?.Username || "..."}</div>

              <div className="mt-1 text-sm text-[#A89F91]">
                หมายเลขสมาชิก{" "}
                <span className="font-semibold text-[#4A3B32]">{user?.User_ID || "..."}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
            <SidebarNavGroup items={PROFILE_NAV_ITEMS} activeKey={activeTab} onChange={changeTab} />

            <section className="rounded-xl border border-[#E6D5C3] bg-white p-6">
              {activeTab === "profile" && (
                <ProfileInfo
                  key={`${user?.Username}-${user?.Email}-${user?.Phone_number}-${user?.Is_Email_Verified}-${user?.Is_Phone_Verified}-${user?.Address}-${user?.Avatar_URL}`}
                  username={user?.Username || ""}
                  email={user?.Email || ""}
                  phone={user?.Phone_number || ""}
                  address={user?.Address || ""}
                  avatarUrl={user?.Avatar_URL || ""}
                  isEmailVerified={!!user?.Is_Email_Verified}
                  isPhoneVerified={!!user?.Is_Phone_Verified}
                  onSaved={refreshUser}
                  onVerified={async (data) => {
                    await setTokensAndLoadUser(data.access_token);
                  }}
                />
              )}
              {activeTab === "autoReply" && (
                <AutoReply initialMessage={user?.Auto_Reply_Message || ""} onSaved={refreshUser} />
              )}
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
  return <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">{children}</label>;
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={getFormFieldClassName({ size: "lg", readOnly: props.readOnly })} />;
}

async function createSquareAvatarBlob(
  imageSrc: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
  outputSize = 512
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("ไม่สามารถโหลดรูปที่เลือกได้"));
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("ไม่สามารถเตรียมพื้นที่ครอปรูปได้");
  }

  const baseScale = Math.max(outputSize / image.width, outputSize / image.height);
  const drawWidth = image.width * baseScale * zoom;
  const drawHeight = image.height * baseScale * zoom;
  const maxOffsetX = Math.max(0, (drawWidth - outputSize) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - outputSize) / 2);
  const safeOffsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX));
  const safeOffsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY));
  const dx = (outputSize - drawWidth) / 2 + safeOffsetX;
  const dy = (outputSize - drawHeight) / 2 + safeOffsetY;

  ctx.clearRect(0, 0, outputSize, outputSize);
  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("ไม่สามารถสร้างไฟล์รูปโปรไฟล์ได้"));
    }, "image/jpeg", 0.92);
  });
}

function ProfileInfo({
  username: initialUsername,
  email: initialEmail,
  phone: initialPhone,
  address: initialAddress,
  avatarUrl: initialAvatarUrl,
  isEmailVerified,
  isPhoneVerified,
  onSaved,
  onVerified,
}: {
  username: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onSaved: () => Promise<void>;
  onVerified: (data: { access_token: string }) => Promise<void>;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState("");
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarOffsetX, setAvatarOffsetX] = useState(0);
  const [avatarOffsetY, setAvatarOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [otpError, setOtpError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setUsername(initialUsername), [initialUsername]);
  useEffect(() => setEmail(initialEmail), [initialEmail]);
  useEffect(() => setPhone(initialPhone), [initialPhone]);
  useEffect(() => setAddress(initialAddress), [initialAddress]);
  useEffect(() => setAvatarUrl(initialAvatarUrl), [initialAvatarUrl]);
  useEffect(() => {
    return () => {
      if (pendingAvatarSrc) {
        URL.revokeObjectURL(pendingAvatarSrc);
      }
    };
  }, [pendingAvatarSrc]);

  const handleSave = async () => {
    if (saving) return;
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, "");
    const normalizedAddress = address.trim();
    const emailChanged = normalizedEmail !== initialEmail.trim().toLowerCase();
    const phoneChanged = normalizedPhone !== initialPhone.replace(/\D/g, "");
    if (!normalizedUsername) {
      setMessage("กรุณากรอกชื่อผู้ใช้");
      return;
    }
    if (!normalizedEmail) {
      setMessage("กรุณากรอกอีเมล");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setMessage("อีเมลไม่ถูกต้อง");
      return;
    }
    if (normalizedPhone && !/^0\d{9}$/.test(normalizedPhone)) {
      setMessage("เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await userApi.updateMe({
        Username: normalizedUsername,
        Email: normalizedEmail,
        Phone_number: normalizedPhone,
        Address: normalizedAddress,
      });
      await onSaved();
      if (emailChanged) {
        setShowEmailOTP(true);
        setShowPhoneOTP(false);
        setOtpError("");
        setMessage("บันทึกสำเร็จ กรุณายืนยันอีเมลใหม่ด้วย OTP");
      } else if (phoneChanged && normalizedPhone) {
        setShowPhoneOTP(true);
        setShowEmailOTP(false);
        setOtpError("");
        setMessage("บันทึกสำเร็จ กรุณายืนยันเบอร์โทรใหม่ด้วย OTP");
      } else {
        setMessage("บันทึกสำเร็จ");
      }
      setIsEditing(false);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setAddress(initialAddress);
    setAvatarUrl(initialAvatarUrl);
    if (pendingAvatarSrc) {
      URL.revokeObjectURL(pendingAvatarSrc);
    }
    setPendingAvatarSrc("");
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setMessage("");
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pendingAvatarSrc) {
      URL.revokeObjectURL(pendingAvatarSrc);
    }

    setPendingAvatarSrc(URL.createObjectURL(file));
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
    setMessage("");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleConfirmAvatarCrop = async () => {
    if (!pendingAvatarSrc) return;

    setAvatarUploading(true);
    setMessage("");

    try {
      const croppedBlob = await createSquareAvatarBlob(pendingAvatarSrc, avatarZoom, avatarOffsetX, avatarOffsetY);
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "avatar.jpg");
      const response = await userApi.uploadAvatar(formData);
      setAvatarUrl(response.avatar_url);
      await onSaved();
      URL.revokeObjectURL(pendingAvatarSrc);
      setPendingAvatarSrc("");
      setAvatarZoom(1);
      setAvatarOffsetX(0);
      setAvatarOffsetY(0);
      setMessage("อัปเดตรูปโปรไฟล์สำเร็จ");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCloseAvatarCrop = () => {
    if (pendingAvatarSrc) {
      URL.revokeObjectURL(pendingAvatarSrc);
    }
    setPendingAvatarSrc("");
    setAvatarZoom(1);
    setAvatarOffsetX(0);
    setAvatarOffsetY(0);
  };

  const handleOTPVerified = async (data: { access_token: string }) => {
    await onVerified(data);
    setShowEmailOTP(false);
  };

  const handlePhoneOTPVerified = async (data: { access_token: string }) => {
    try {
      await onVerified(data);
      setShowPhoneOTP(false);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "ยืนยันเบอร์โทรไม่สำเร็จ");
    }
  };

  const allVerified = isEmailVerified && isPhoneVerified;

  return (
    <>
      <h2 className="mb-6 text-lg font-bold text-[#D9734E]">ข้อมูลส่วนตัว</h2>

      <div className="mb-6 rounded-xl border border-[#E6D5C3] bg-[#F9F6F0] p-4">
        <h3 className="mb-3 text-base font-bold text-[#4A3B32]">สถานะการยืนยันตัวตน</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#A89F91]">อีเมล ({email})</span>
            {isEmailVerified ? (
              <span className="text-sm font-semibold text-[#D9734E]">ยืนยันแล้ว</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowEmailOTP(true);
                  setShowPhoneOTP(false);
                  setOtpError("");
                }}
                className="text-sm font-semibold text-orange-600 hover:underline"
              >
                ยังไม่ยืนยัน - กดเพื่อยืนยัน
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-[#A89F91]">เบอร์โทรศัพท์ ({phone || "ยังไม่ได้กรอก"})</span>
            {isPhoneVerified ? (
              <span className="text-sm font-semibold text-[#D9734E]">ยืนยันแล้ว</span>
            ) : !isEmailVerified ? (
              <span className="text-sm text-[#A89F91]">รอยืนยันอีเมลก่อน</span>
            ) : !phone ? (
              <span className="text-sm text-[#A89F91]">กรุณากรอกเบอร์โทรก่อน</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowPhoneOTP(true);
                  setShowEmailOTP(false);
                  setOtpError("");
                }}
                className="text-sm font-semibold text-orange-600 hover:underline"
              >
                ยังไม่ยืนยัน - กดเพื่อยืนยัน
              </button>
            )}
          </div>
        </div>

        {!allVerified && !showEmailOTP && !showPhoneOTP && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
            กรุณายืนยันตัวตนทั้งอีเมลและเบอร์โทรศัพท์ จึงจะสามารถแชท ซื้อ หรือขายสินค้าได้
          </div>
        )}

        {showEmailOTP && !isEmailVerified && (
          <div className="mt-4 rounded-xl border border-[#DCD0C0] bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-[#D9734E]">ยืนยันอีเมลด้วย OTP</h4>
            {otpError && <FormErrorNotice message={otpError} className="mb-3" />}
            <EmailOTP email={email} onVerified={handleOTPVerified} onError={(msg) => setOtpError(msg)} />
            <button
              type="button"
              onClick={() => setShowEmailOTP(false)}
              className="mt-3 text-sm text-[#A89F91] hover:text-[#4A3B32]"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {showPhoneOTP && !isPhoneVerified && isEmailVerified && phone && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-blue-700">ยืนยันเบอร์โทรศัพท์ด้วย OTP</h4>
            {otpError && <FormErrorNotice message={otpError} className="mb-3" />}
            <PhoneOTP phone={phone} onVerified={handlePhoneOTPVerified} onError={(msg) => setOtpError(msg)} />
            <button
              type="button"
              onClick={() => setShowPhoneOTP(false)}
              className="mt-3 text-sm text-[#A89F91] hover:text-[#4A3B32]"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-[#E6D5C3] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-[#E6D5C3] bg-[#F9F6F0] text-4xl">
            {avatarUrl ? (
              <img src={resolveMediaUrl(avatarUrl)} alt="รูปโปรไฟล์" className="h-full w-full object-cover" />
            ) : (
              "👤"
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#4A3B32]">รูปโปรไฟล์</div>
            <p className="mt-1 text-sm text-[#A89F91]">กดเปลี่ยนรูปเมื่ออยู่ในโหมดแก้ไขข้อมูล</p>
          </div>
          <div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={!isEditing || avatarUploading}
              className="rounded-lg border border-[#D9734E] px-4 py-2 text-sm font-semibold text-[#D9734E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {avatarUploading ? "กำลังอัปโหลด..." : "เปลี่ยนรูปโปรไฟล์"}
            </button>
          </div>
        </div>
      </div>

      {pendingAvatarSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#4A3B32]">ครอปรูปโปรไฟล์</h3>
                <p className="mt-1 text-sm text-[#A89F91]">ปรับตำแหน่งให้พอดีก่อนยืนยันใช้เป็นรูปโปรไฟล์</p>
              </div>
              <button
                type="button"
                onClick={handleCloseAvatarCrop}
                disabled={avatarUploading}
                className="text-sm text-[#A89F91] hover:text-[#4A3B32] disabled:opacity-50"
              >
                ปิด
              </button>
            </div>

            <div className="mb-5 flex justify-center">
              <div className="relative h-64 w-64 overflow-hidden rounded-full border-4 border-[#E6D5C3] bg-[#F9F6F0]">
                <img
                  src={pendingAvatarSrc}
                  alt="ตัวอย่างรูปโปรไฟล์"
                  className="absolute left-1/2 top-1/2 h-full w-full max-w-none object-cover"
                  style={{
                    transform: `translate(calc(-50% + ${avatarOffsetX}px), calc(-50% + ${avatarOffsetY}px)) scale(${avatarZoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-[#4A3B32]">
                  <span>ซูม</span>
                  <span>{avatarZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.1"
                  value={avatarZoom}
                  onChange={(e) => setAvatarZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-[#4A3B32]">
                  <span>เลื่อนซ้าย-ขวา</span>
                  <span>{avatarOffsetX}px</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetX}
                  onChange={(e) => setAvatarOffsetX(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-[#4A3B32]">
                  <span>เลื่อนขึ้น-ลง</span>
                  <span>{avatarOffsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="1"
                  value={avatarOffsetY}
                  onChange={(e) => setAvatarOffsetY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseAvatarCrop}
                disabled={avatarUploading}
                className="rounded-lg border border-[#DCD0C0] px-5 py-2 font-semibold text-[#6E6258] disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmAvatarCrop}
                disabled={avatarUploading}
                className="rounded-lg bg-[#D9734E] px-5 py-2 font-semibold text-white disabled:opacity-50"
              >
                {avatarUploading ? "กำลังอัปโหลด..." : "ยืนยันใช้รูปนี้"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl space-y-5">
        <div>
          <Label>ชื่อผู้ใช้ (แสดงให้ผู้อื่นเห็น)</Label>
          <InputField value={username} readOnly={!isEditing} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <Label>อีเมล</Label>
          <InputField value={email} readOnly={!isEditing} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@example.com" />
          <p className="mt-1 text-xs text-[#A89F91]">หากเปลี่ยนอีเมล ระบบจะรีเซ็ตสถานะการยืนยันและต้องยืนยัน OTP ใหม่</p>
        </div>

        <div className="mt-6 border-t border-[#DCD0C0] pt-6">
          <h3 className="mb-4 text-base font-bold text-[#D9734E]">ข้อมูลการติดต่อ</h3>

          <div className="space-y-4">
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <InputField value={phone} readOnly={!isEditing} onChange={(e) => setPhone(e.target.value)} placeholder="เช่น 08x-xxx-xxxx" />
            </div>

            <div>
              <Label>ที่อยู่</Label>
              <TextareaField
                value={address}
                disabled={!isEditing}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น 123/4 ซอยสุขุมวิท 11 เขตพระนคร กรุงเทพมหานคร 10200"
                rows={3}
                textareaClassName={getFormFieldClassName({ size: "lg", resize: "none", disabled: !isEditing })}
              />
            </div>
          </div>
        </div>

        {message &&
          ((message.includes("สำเร็จ") && !message.includes("ไม่สำเร็จ")) ? (
            <FormSuccessNotice message={message} />
          ) : (
            <FormErrorNotice message={message} />
          ))}

        <div className="flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[#D9734E] px-6 py-2 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-[#DCD0C0] px-6 py-2 font-semibold text-[#6E6258] disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-lg bg-[#D9734E] px-6 py-2 font-semibold text-white"
            >
              แก้ไขข้อมูล
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function AutoReply({
  initialMessage,
  onSaved,
}: {
  initialMessage: string;
  onSaved: () => Promise<void>;
}) {
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      await userApi.updateMe({ Auto_Reply_Message: message.trim() });
      await onSaved();
      setFeedback({ type: "success", text: "บันทึกสำเร็จ" });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h2 className="mb-6 text-lg font-bold text-[#D9734E]">ข้อความตอบกลับอัตโนมัติ</h2>

      <Label>ข้อความที่ส่งอัตโนมัติเมื่อมีคนทักแชท</Label>

      <TextareaField
        textareaClassName={`${getFormFieldClassName({ size: "lg" })} h-32`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        placeholder="เช่น สวัสดีครับ ตอนนี้อาจตอบช้าเล็กน้อย แต่จะรีบกลับมาตอบให้เร็วที่สุด"
        aria-label="ข้อความตอบกลับอัตโนมัติ"
      />

      <p className="mt-2 text-xs text-[#A89F91]">{message.trim().length}/1000</p>

      {feedback?.type === "success" && <FormSuccessNotice message={feedback.text} className="mt-2" />}
      {feedback?.type === "error" && <FormErrorNotice message={feedback.text} className="mt-2" />}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-[#D9734E] px-6 py-2 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </>
  );
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition-colors"
        >
          <span className={hovered ? (star <= hovered ? "text-yellow-400" : "text-[#DCD0C0]") : star <= value ? "text-yellow-400" : "text-[#DCD0C0]"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function WriteReviewCard({ order, onSubmitted }: { order: OrderWithDetails; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      await reviewApi.create({ orderId: order.Order_ID, rating, comment: comment.trim() || undefined });
      onSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#DCD0C0] bg-[#E6D5C3] p-4">
      <div className="mb-3 flex items-center gap-3">
        {order.Image_URL && (
          <img
            src={order.Image_URL.startsWith("/") ? `${API_BASE}${order.Image_URL}` : order.Image_URL}
            alt={order.Title}
            className="h-12 w-12 shrink-0 rounded-lg border border-[#E6D5C3] object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#4A3B32]">{order.Title || "สินค้า"}</div>
          <div className="text-xs text-[#A89F91]">ผู้ขาย: {order.SellerName || "-"}</div>
        </div>
      </div>

      <div className="mb-2">
        <div className="mb-1 text-xs font-medium text-[#A89F91]">ให้คะแนน</div>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <TextareaField
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="แสดงความคิดเห็น (ไม่บังคับ)..."
        rows={2}
        textareaClassName={`${getFormFieldClassName({ size: "lg", resize: "none" })} mt-2 border-[#E6D5C3]`}
      />

      {error && <p className="mt-1 text-xs text-[#C45A5A]">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-2 rounded-lg bg-[#D9734E] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#C25B38] disabled:opacity-50"
      >
        {submitting ? "กำลังส่ง..." : "ส่งรีวิว"}
      </button>
    </div>
  );
}

function MyReview() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    Promise.all([orderApi.getMyBuyerOrders(), reviewApi.getMyReviews()])
      .then(([ordersRes, reviewsRes]) => {
        setOrders(ordersRes.data);
        setReviews(reviewsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reload]);

  const reviewedOrderIds = new Set(reviews.map((r) => r.Order_ID));
  const pendingOrders = orders.filter((o) => o.Status === "completed" && !reviewedOrderIds.has(o.Order_ID));

  return (
    <>
      <h2 className="mb-5 text-lg font-bold text-[#D9734E]">รีวิวของฉัน</h2>

      {loading ? (
        <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
      ) : (
        <>
          {pendingOrders.length > 0 && (
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base font-bold text-[#4A3B32]">รอรีวิว</span>
                <span className="rounded-full bg-[#E6D5C3] px-2 py-0.5 text-xs font-bold text-[#D9734E]">
                  {pendingOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <WriteReviewCard key={order.Order_ID} order={order} onSubmitted={() => setReload((r) => r + 1)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base font-bold text-[#4A3B32]">รีวิวที่เขียนแล้ว</span>
              <span className="rounded-full bg-[#E6D5C3] px-2 py-0.5 text-xs font-bold text-[#A89F91]">
                {reviews.length}
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.Review_ID} className="rounded-xl border border-[#E6D5C3] bg-white p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-sm font-semibold text-[#4A3B32]">{r.ProductTitle || "สินค้า"}</div>
                      <div className="text-xs text-[#A89F91]">
                        {new Date(r.Created_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="mb-1 text-sm text-yellow-400">
                      {"★".repeat(r.Rating)}
                      <span className="text-[#DCD0C0]">{"★".repeat(5 - r.Rating)}</span>
                    </div>
                    {r.Comment && <p className="text-sm text-[#A89F91]">{r.Comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[#A89F91]">ยังไม่มีรายการรีวิว</div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function ManageProfile() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.User_ID) return;

    startTransition(() => setLoading(true));
    productApi
      .getBySeller(user.User_ID)
      .then((res) => setProducts(res.data.map(toProductDisplay)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [user?.User_ID]);

  return (
    <>
      <h2 className="mb-6 text-lg font-bold text-[#D9734E]">จัดการโปรไฟล์ร้าน</h2>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-[#4A3B32]">สินค้าของฉัน ({products.length})</h3>
        <Link
          href="/products/create"
          className="rounded-lg bg-[#D9734E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#C25B38]"
        >
          + ลงขายสินค้าใหม่
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} badgeText="" />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-[#A89F91]">
          <div className="mb-3 text-4xl">📦</div>
          <p>ยังไม่มีสินค้า</p>
          <Link href="/products/create" className="mt-2 inline-block text-sm text-[#D9734E] hover:underline">
            ลงขายสินค้าชิ้นแรกของคุณ
          </Link>
        </div>
      )}
    </>
  );
}

function Account({ email }: { email: string }) {
  return (
    <>
      <h2 className="mb-6 text-lg font-bold text-[#D9734E]">การเข้าสู่ระบบ</h2>

      <div className="max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <span>Google</span>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-[#DCD0C0] px-4 py-1.5 opacity-50"
          >
            เชื่อมต่อ (เร็ว ๆ นี้)
          </button>
        </div>

        <div>
          <Label>อีเมลสำหรับเข้าสู่ระบบ</Label>
          <InputField value={email} readOnly />
        </div>

        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg border border-[#D9734E] px-4 py-2 text-[#D9734E] opacity-50"
        >
          เปลี่ยนรหัสผ่าน (เร็ว ๆ นี้)
        </button>
      </div>
    </>
  );
}
