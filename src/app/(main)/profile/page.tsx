"use client";

import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  API_BASE,
  orderApi,
  productApi,
  reviewApi,
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
                <img src={`${API_BASE}${user.Avatar_URL}`} alt="" className="h-full w-full object-cover" />
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

  useEffect(() => setUsername(initialUsername), [initialUsername]);
  useEffect(() => setPhone(initialPhone), [initialPhone]);
  useEffect(() => setAddress(initialAddress), [initialAddress]);

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
      await userApi.updateMe({
        Username: username.trim(),
        Phone_number: phone.trim(),
        Address: address.trim(),
      });
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

      <div className="max-w-xl space-y-5">
        <div>
          <Label>ชื่อผู้ใช้ (แสดงให้ผู้อื่นเห็น)</Label>
          <InputField value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <Label>อีเมล</Label>
          <InputField value={email} readOnly className="cursor-not-allowed bg-[#F9F6F0] text-[#A89F91]" />
          <p className="mt-1 text-xs text-[#A89F91]">อีเมลไม่สามารถเปลี่ยนแปลงได้</p>
        </div>

        <div className="mt-6 border-t border-[#DCD0C0] pt-6">
          <h3 className="mb-4 text-base font-bold text-[#D9734E]">ข้อมูลการติดต่อ</h3>

          <div className="space-y-4">
            <div>
              <Label>เบอร์โทรศัพท์</Label>
              <InputField value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เช่น 08x-xxx-xxxx" />
            </div>

            <div>
              <Label>ที่อยู่</Label>
              <TextareaField
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น 123/4 ซอยสุขุมวิท 11 เขตพระนคร กรุงเทพมหานคร 10200"
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
          className="rounded-lg bg-[#D9734E] px-6 py-2 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
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
