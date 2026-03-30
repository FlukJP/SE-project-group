"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { userApi, productApi, reviewApi, authApi, orderApi, type ReviewData, type OrderWithDetails, API_BASE } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import ProductCard from "@/src/components/product/ProductCard";
import EmailOTP from "@/src/components/auth/EmailOTP";
import PhoneOTP from "@/src/components/auth/PhoneOTP";
import { FormErrorNotice, FormSuccessNotice, SidebarNavGroup, TextareaField } from "@/src/components/ui";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";
import { startTransition } from "react";

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
    <Suspense fallback={<><Navbar /><div className="text-center py-16 text-[#A89F91]">กำลังโหลด...</div></>}>
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
    startTransition(() => setActiveTab(tabFromUrl)); // ไม่ synchronous แล้ว
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
        <div className="text-center py-16 text-[#A89F91]">กำลังโหลด...</div>
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

      <main className="bg-[#F9F6F0] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-extrabold text-[#D9734E] mb-6">
            {tabTitles[activeTab]}
          </h1>

          <div className="bg-[#E6D5C3] border border-[#DCD0C0] rounded-xl p-6 flex items-center gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-[#E6D5C3] grid place-items-center text-3xl overflow-hidden">
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
              <div className="text-sm text-[#A89F91]">ชื่อผู้ใช้</div>
              <div className="text-lg font-bold text-[#4A3B32]">
                {user?.Username || "..."}
              </div>

              <div className="text-sm text-[#A89F91] mt-1">
                หมายเลขสมาชิก{" "}
                <span className="font-semibold text-[#4A3B32]">
                  {user?.User_ID || "..."}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
            <SidebarNavGroup
              items={PROFILE_NAV_ITEMS}
              activeKey={activeTab}
              onChange={changeTab}
            />

            <section className="bg-white border border-[#E6D5C3] rounded-xl p-6">
              {/* Fix #9: Use key to force remount when user data changes, preventing stale sync */}
              {activeTab === "profile" && (
                <ProfileInfo
                  key={`${user?.Username}-${user?.Phone_number}-${user?.Is_Email_Verified}-${user?.Is_Phone_Verified}-${user?.Address}`}
                  username={user?.Username || ""}
                  phone={user?.Phone_number || ""}
                  email={user?.Email || ""}
                  address={user?.Address || ""}
                  isEmailVerified={!!user?.Is_Email_Verified}
                  isPhoneVerified={!!user?.Is_Phone_Verified}
                  onSaved={refreshUser}
                  onVerified={async (data) => {
                    await setTokensAndLoadUser(data.access_token);
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
  return <label className="block text-sm font-semibold text-[#4A3B32] mb-1">{children}</label>;
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={getFormFieldClassName({ size: "lg", readOnly: props.readOnly })}
    />
  );
}

function ProfileInfo({
  username: initialUsername,
  phone: initialPhone,
  email,
  address: initialAddress,
  isEmailVerified,
  isPhoneVerified,
  onSaved,
  onVerified,
}: {
  username: string;
  phone: string;
  email: string;
  address: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  onSaved: () => Promise<void>;
  onVerified: (data: { access_token: string }) => Promise<void>;
}) {
  const [username, setUsername] = useState(initialUsername);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState(initialAddress);
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

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

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
      await userApi.updateMe({ Username: username.trim(), Phone_number: phone.trim(), Address: address.trim() });
      await onSaved();
      setMessage("บันทึกสำเร็จ");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
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
      <h2 className="text-lg font-bold text-[#D9734E] mb-6">ข้อมูลส่วนตัว</h2>

      {/* Verification Status */}
      <div className="mb-6 p-4 rounded-xl border border-[#E6D5C3] bg-[#F9F6F0]">
        <h3 className="text-base font-bold text-[#4A3B32] mb-3">สถานะการยืนยันตัวตน</h3>
        <div className="space-y-2">
          {/* Email verification */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A89F91]">อีเมล ({email})</span>
            {isEmailVerified ? (
              <span className="text-sm font-semibold text-[#D9734E]">ยืนยันแล้ว</span>
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
          <div className="mt-4 p-4 bg-white border border-[#DCD0C0] rounded-xl">
            <h4 className="text-sm font-semibold text-[#D9734E] mb-3">ยืนยันอีเมลด้วย OTP</h4>
            {otpError && <FormErrorNotice message={otpError} className="mb-3" />}
            <EmailOTP
              email={email}
              onVerified={handleOTPVerified}
              onError={(msg) => setOtpError(msg)}
            />
            <button
              type="button"
              onClick={() => setShowEmailOTP(false)}
              className="mt-3 text-sm text-[#A89F91] hover:text-[#4A3B32]"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Phone OTP form */}
        {showPhoneOTP && !isPhoneVerified && isEmailVerified && phone && (
          <div className="mt-4 p-4 bg-white border border-blue-200 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-700 mb-3">ยืนยันเบอร์โทรศัพท์ด้วย OTP</h4>
            {otpError && <FormErrorNotice message={otpError} className="mb-3" />}
            <PhoneOTP
              phone={phone}
              onVerified={handlePhoneOTPVerified}
              onError={(msg) => setOtpError(msg)}
            />
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

      <div className="space-y-5 max-w-xl">
        <div>
          <Label>ชื่อผู้ใช้ (แสดงให้ผู้อื่นเห็น)</Label>
          <InputField value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <Label>อีเมล</Label>
          <InputField value={email} readOnly className="bg-[#F9F6F0] text-[#A89F91] cursor-not-allowed" />
          <p className="text-xs text-[#A89F91] mt-1">อีเมลไม่สามารถเปลี่ยนแปลงได้</p>
        </div>

        <div className="border-t border-[#DCD0C0] pt-6 mt-6">
          <h3 className="text-base font-bold text-[#D9734E] mb-4">ข้อมูลการติดต่อ</h3>

          <div className="space-y-4">
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <InputField
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 08x-xxx-xxxx"
              />
            </div>

            <div>
              <Label>ที่อยู่</Label>
              <TextareaField
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น 123/4 ซอยสุขุมวิท 11 พระนคร กรุงเทพมหานคร 10200"
                rows={3}
                textareaClassName={getFormFieldClassName({ size: "lg", resize: "none" })}
              />
            </div>
          </div>
        </div>

        {message &&
          (message === "บันทึกสำเร็จ" ? (
            <FormSuccessNotice message={message} />
          ) : (
            <FormErrorNotice message={message} />
          ))}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-[#D9734E] text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
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
      <h2 className="text-lg font-bold text-[#D9734E] mb-6">ข้อความตอบกลับอัตโนมัติ</h2>

      <Label>ข้อความที่ส่งอัตโนมัติเมื่อมีคนทักแชท</Label>

      <TextareaField
        textareaClassName={`${getFormFieldClassName({ size: "lg" })} h-32`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label="ข้อความตอบกลับอัตโนมัติ"
      />

      {saved && <FormSuccessNotice message="บันทึกสำเร็จ" className="mt-2" />}

      <button type="button" onClick={handleSave} className="bg-[#D9734E] text-white px-6 py-2 rounded-lg font-semibold mt-4">บันทึก</button>
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
          className="text-2xl transition-colors leading-none"
        >
          <span className={(hovered ? star <= hovered : star <= value) ? "text-yellow-400" : "text-[#DCD0C0]"}>
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
    <div className="border border-[#DCD0C0] bg-[#E6D5C3] rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        {order.Image_URL && (
          <img
            src={order.Image_URL.startsWith("/") ? `${API_BASE}${order.Image_URL}` : order.Image_URL}
            alt={order.Title}
            className="w-12 h-12 object-cover rounded-lg border border-[#E6D5C3] shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="font-semibold text-[#4A3B32] text-sm truncate">{order.Title || "สินค้า"}</div>
          <div className="text-xs text-[#A89F91]">ผู้ขาย: {order.SellerName || "—"}</div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-medium text-[#A89F91] mb-1">ให้คะแนน</div>
        <StarSelector value={rating} onChange={setRating} />
      </div>

      <TextareaField
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="แสดงความคิดเห็น (ไม่บังคับ)..."
        rows={2}
        textareaClassName={`${getFormFieldClassName({ size: "lg", resize: "none" })} border-[#E6D5C3] mt-2`}
      />

      {error && <p className="text-[#C45A5A] text-xs mt-1">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-2 bg-[#D9734E] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-[#C25B38] disabled:opacity-50"
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
  const pendingOrders = orders.filter(
    (o) => o.Status === "completed" && !reviewedOrderIds.has(o.Order_ID)
  );

  return (
    <>
      <h2 className="text-lg font-bold text-[#D9734E] mb-5">รีวิวของฉัน</h2>

      {loading ? (
        <div className="text-center text-[#A89F91] py-16">กำลังโหลด...</div>
      ) : (
        <>
          {/* Pending reviews */}
          {pendingOrders.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base font-bold text-[#4A3B32]">รอรีวิว</span>
                <span className="bg-[#E6D5C3] text-[#D9734E] text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <WriteReviewCard
                    key={order.Order_ID}
                    order={order}
                    onSubmitted={() => setReload((r) => r + 1)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Written reviews */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-bold text-[#4A3B32]">รีวิวที่เขียนแล้ว</span>
              <span className="bg-[#E6D5C3] text-[#A89F91] text-xs font-bold px-2 py-0.5 rounded-full">
                {reviews.length}
              </span>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.Review_ID} className="border border-[#E6D5C3] rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold text-[#4A3B32]">{r.ProductTitle || "สินค้า"}</div>
                      <div className="text-xs text-[#A89F91]">
                        {new Date(r.Created_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="mb-1 text-yellow-400 text-sm">
                      {"★".repeat(r.Rating)}
                      <span className="text-[#DCD0C0]">{"★".repeat(5 - r.Rating)}</span>
                    </div>
                    {r.Comment && <p className="text-sm text-[#A89F91]">{r.Comment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#A89F91] py-10">ยังไม่มีรายการรีวิว</div>
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
    if (!user?.User_ID)  return;

    startTransition(() => setLoading(true));
    productApi
      .getBySeller(user.User_ID)
      .then((res) => setProducts(res.data.map(toProductDisplay)))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [user?.User_ID]);

  return (
    <>
      <h2 className="text-lg font-bold text-[#D9734E] mb-6">จัดการโปรไฟล์ร้าน</h2>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#4A3B32]">
          สินค้าของฉัน ({products.length})
        </h3>
        <Link
          href="/products/create"
          className="bg-[#D9734E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#C25B38] transition"
        >
          + ลงขายสินค้าใหม่
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-[#A89F91] py-16">กำลังโหลด...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} badgeText="" />
          ))}
        </div>
      ) : (
        <div className="text-center text-[#A89F91] py-16">
          <div className="text-4xl mb-3">📦</div>
          <p>ยังไม่มีสินค้า</p>
          <Link href="/products/create" className="text-[#D9734E] hover:underline text-sm mt-2 inline-block">
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
      <h2 className="text-lg font-bold text-[#D9734E] mb-6">การเข้าสู่ระบบ</h2>

      <div className="space-y-4 max-w-xl">
        <div className="flex items-center justify-between">
          <span>Google</span>
          <button type="button" disabled className="border border-[#DCD0C0] px-4 py-1.5 rounded-lg opacity-50 cursor-not-allowed">เชื่อมต่อ (เร็วๆ นี้)</button>
        </div>

        <div>
          <Label>อีเมลสำหรับเข้าสู่ระบบ</Label>
          <InputField value={email} readOnly />
        </div>

        <button type="button" disabled className="border border-[#D9734E] text-[#D9734E] px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">เปลี่ยนรหัสผ่าน (เร็วๆ นี้)</button>
      </div>
    </>
  );
}
