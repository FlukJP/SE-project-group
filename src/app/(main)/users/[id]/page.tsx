"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { reviewApi, reportApi, orderApi, API_BASE } from "@/src/lib/api";
import { UserProfileSkeleton } from "@/src/components/ui/Skeleton";
import {
  FormErrorNotice,
  FormSuccessNotice,
  TabButtonGroup,
  TextareaField,
  getFormButtonClassName,
  getPanelClassName,
} from "@/src/components/ui";
import type { OrderWithDetails } from "@/src/types/Order";
import { useAuth } from "@/src/contexts/AuthContext";
import ProductCard from "@/src/components/product/ProductCard";
import { useUser } from "@/src/hooks/useUsers";
import { useProductsBySeller } from "@/src/hooks/useProducts";
import { useSellerReviews, useSellerRating } from "@/src/hooks/useReviews";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";

type Tab = "products" | "reviews";

function StarDisplay({ score, total }: { score: number; total: number }) {
  const filled = Math.round(score);

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span className="text-base leading-none text-yellow-400">
        {"★".repeat(filled)}
        <span className="text-[#DCD0C0]">{"★".repeat(5 - filled)}</span>
      </span>
      <span className="text-sm font-semibold text-[#4A3B32]">{score.toFixed(1)}</span>
      <span className="text-sm text-[#A89F91]">({total} คน)</span>
    </div>
  );
}

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("กรุณาระบุเหตุผล");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit(reason.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`${getPanelClassName({
          padding: "lg",
          radius: "2xl",
          shadow: "xl",
          bordered: false,
        })} w-full max-w-md`}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl text-[#C45A5A]">🚩</span>
          <h2 className="text-lg font-bold text-[#4A3B32]">รายงานผู้ใช้นี้</h2>
        </div>

        <label className="mb-1 block text-sm font-medium text-[#4A3B32]">เหตุผลในการรายงาน</label>
        <TextareaField
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="อธิบายเหตุผลที่ต้องการรายงานผู้ใช้นี้..."
          textareaClassName={getFormFieldClassName({ size: "xl", tone: "danger", resize: "none" })}
        />

        {error && <FormErrorNotice message={error} className="mt-2 text-xs" />}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`${getFormButtonClassName({ variant: "secondary", size: "md", fullWidth: true })} rounded-xl`}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`${getFormButtonClassName({ variant: "danger", size: "md", fullWidth: true })} rounded-xl`}
          >
            {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  orders,
  onClose,
  onSubmit,
}: {
  orders: OrderWithDetails[];
  onClose: () => void;
  onSubmit: (orderId: number, rating: number, comment: string) => Promise<void>;
}) {
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.Order_ID ?? 0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("กรุณาเลือกดาว");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit(selectedOrderId, rating, comment.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`${getPanelClassName({
          padding: "lg",
          radius: "2xl",
          shadow: "xl",
          bordered: false,
        })} w-full max-w-md`}
      >
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xl text-yellow-400">★</span>
          <h2 className="text-lg font-bold text-[#4A3B32]">รีวิวผู้ขาย</h2>
        </div>

        {orders.length > 1 && (
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-[#4A3B32]">
              เลือกออเดอร์ที่ต้องการรีวิว
            </label>
            <select
              aria-label="เลือกออเดอร์ที่ต้องการรีวิว"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
              className={getFormFieldClassName({ size: "xl" })}
            >
              {orders.map((order) => (
                <option key={order.Order_ID} value={order.Order_ID}>
                  {order.Title || `ออเดอร์ #${order.Order_ID}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="mb-2 block text-sm font-medium text-[#4A3B32]">คะแนน</label>
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl leading-none transition-transform hover:scale-110"
            >
              <span className={(hoverRating || rating) >= star ? "text-yellow-400" : "text-[#DCD0C0]"}>
                ★
              </span>
            </button>
          ))}
        </div>

        <label className="mb-1 block text-sm font-medium text-[#4A3B32]">
          ความคิดเห็น <span className="font-normal text-[#A89F91]">(ไม่บังคับ)</span>
        </label>
        <TextareaField
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="แบ่งปันประสบการณ์การซื้อของคุณ..."
          textareaClassName={getFormFieldClassName({ size: "xl", resize: "none" })}
        />

        {error && <FormErrorNotice message={error} className="mt-2 text-xs" />}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={`${getFormButtonClassName({ variant: "secondary", size: "md", fullWidth: true })} rounded-xl`}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`${getFormButtonClassName({ variant: "primary", size: "md", fullWidth: true })} rounded-xl`}
          >
            {loading ? "กำลังส่ง..." : "ส่งรีวิว"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me, isLoggedIn } = useAuth();

  const { data: seller, isLoading: loading } = useUser(id);
  const { data: products = [] } = useProductsBySeller(id);
  const { data: reviews = [], mutate: mutateReviews } = useSellerReviews(id);
  const { data: rating, mutate: mutateRating } = useSellerRating(id);

  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [visibleCount, setVisibleCount] = useState(28);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [reviewableOrders, setReviewableOrders] = useState<OrderWithDetails[]>([]);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !id || !me || me.User_ID === Number(id)) return;

    orderApi
      .getMyBuyerOrders()
      .then((res) => {
        const completed = res.data.filter((order) => order.Seller_ID === Number(id) && order.Status === "completed");
        const reviewedOrderIds = new Set(reviews.map((review) => review.Order_ID));
        setReviewableOrders(completed.filter((order) => !reviewedOrderIds.has(order.Order_ID)));
      })
      .catch(() => {});
  }, [isLoggedIn, id, me, reviews]);

  if (loading) {
    return (
      <>
        <Navbar />
        <UserProfileSkeleton />
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="mb-4 text-lg">ไม่พบผู้ใช้</p>
          <Link href="/" className="text-[#D9734E] hover:underline">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  const isOwnProfile = isLoggedIn && me?.User_ID === Number(id);

  const handleReport = async (reason: string) => {
    await reportApi.create({ targetId: Number(id), reportType: "user", reason });
    setShowReport(false);
    setReportDone(true);
  };

  const handleReview = async (orderId: number, ratingValue: number, comment: string) => {
    await reviewApi.create({ orderId, rating: ratingValue, comment: comment || undefined });
    await Promise.all([mutateReviews(), mutateRating()]);
    setShowReview(false);
  };

  return (
    <>
      <Navbar />
      {showReport && <ReportModal onClose={() => setShowReport(false)} onSubmit={handleReport} />}
      {showReview && (
        <ReviewModal orders={reviewableOrders} onClose={() => setShowReview(false)} onSubmit={handleReview} />
      )}

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="text-sm text-[#D9734E] hover:underline">
            &larr; กลับไปหน้าหลัก
          </Link>
        </div>

        <div className={`${getPanelClassName({ padding: "lg", radius: "2xl" })} mb-4`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#E6D5C3]">
                {seller.Avatar_URL ? (
                  <img
                    src={`${API_BASE}${seller.Avatar_URL}`}
                    alt={seller.Username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-3xl">👤</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4A3B32]">{seller.Username}</h1>
                {rating && rating.totalReviews > 0 ? (
                  <StarDisplay score={rating.averageRating} total={rating.totalReviews} />
                ) : (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-base text-[#DCD0C0]">{"★".repeat(5)}</span>
                    <span className="text-sm text-[#A89F91]">ยังไม่มีรีวิว</span>
                  </div>
                )}
              </div>
            </div>

            {isLoggedIn && !isOwnProfile && (
              <div className="flex flex-col items-end gap-2">
                {reviewableOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className={`${getFormButtonClassName({ variant: "secondary", size: "sm" })} gap-1.5`}
                  >
                    <span className="text-sm leading-none">★</span>
                    รีวิวผู้ขาย
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  title="รายงานผู้ใช้นี้"
                  disabled={reportDone}
                  className={`${getFormButtonClassName({
                    variant: "secondary",
                    size: "sm",
                  })} gap-1.5 text-[#A89F91] hover:border-[#C45A5A] hover:text-[#C45A5A]`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 01.832 1.555L13.382 10l3.45 5.445A1 1 0 0116 17H4a1 1 0 01-1-1V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {reportDone ? "รายงานแล้ว" : "รายงาน"}
                </button>
              </div>
            )}
          </div>

          {reportDone && (
            <FormSuccessNotice
              message="ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งให้เราทราบ"
              className="mt-3 px-3 py-2 text-xs text-[#4A3B32]"
            />
          )}
        </div>

        <TabButtonGroup
          items={[
            { key: "products", label: `สินค้า (${products.length})` },
            { key: "reviews", label: `รีวิว (${reviews.length})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          size="lg"
          className="mb-6"
        />

        {activeTab === "products" &&
          (products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {products.slice(0, visibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} badgeText="" />
                ))}
              </div>
              {visibleCount < products.length && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 28)}
                    className={`${getFormButtonClassName({ variant: "primary", size: "md" })} rounded-xl`}
                  >
                    โหลดเพิ่มเติม ({products.length - visibleCount} รายการ)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-[#A89F91]">ยังไม่มีสินค้า</div>
          ))}

        {activeTab === "reviews" &&
          (reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.Review_ID} className={getPanelClassName({ padding: "md", radius: "xl" })}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-sm font-semibold text-[#4A3B32]">{review.ReviewerName || "ผู้ซื้อ"}</div>
                    <div className="text-xs text-[#A89F91]">
                      {new Date(review.Created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="mb-1 text-sm text-yellow-400">
                    {"★".repeat(review.Rating)}
                    <span className="text-[#DCD0C0]">{"★".repeat(5 - review.Rating)}</span>
                  </div>
                  {review.Comment && <p className="text-sm text-[#4A3B32]">{review.Comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-[#A89F91]">ยังไม่มีรีวิว</div>
          ))}
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#D9734E] text-white shadow-lg transition hover:bg-[#C25B38]"
          title="เลื่อนไปบนสุด"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </>
  );
}
