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
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-yellow-400 text-base leading-none">
        {"â˜…".repeat(filled)}
        <span className="text-[#DCD0C0]">{"â˜…".repeat(5 - filled)}</span>
      </span>
      <span className="text-sm font-semibold text-[#4A3B32]">{score.toFixed(1)}</span>
      <span className="text-sm text-[#A89F91]">({total} à¸„à¸™)</span>
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
    if (!reason.trim()) { setError("à¸à¸£à¸¸à¸“à¸²à¸£à¸°à¸šà¸¸à¹€à¸«à¸•à¸¸à¸œà¸¥"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit(reason.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`${getPanelClassName({ padding: "lg", radius: "2xl", shadow: "xl", bordered: false })} w-full max-w-md`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[#C45A5A] text-xl">ðŸš©</span>
          <h2 className="text-lg font-bold text-[#4A3B32]">à¸£à¸²à¸¢à¸‡à¸²à¸™à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸™à¸µà¹‰</h2>
        </div>

        <label className="block text-sm font-medium text-[#4A3B32] mb-1">à¹€à¸«à¸•à¸¸à¸œà¸¥à¹ƒà¸™à¸à¸²à¸£à¸£à¸²à¸¢à¸‡à¸²à¸™</label>
        <TextareaField
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="à¸­à¸˜à¸´à¸šà¸²à¸¢à¹€à¸«à¸•à¸¸à¸œà¸¥à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸£à¸²à¸¢à¸‡à¸²à¸™à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸™à¸µà¹‰..."
          textareaClassName={getFormFieldClassName({ size: "xl", tone: "danger", resize: "none" })}
        />

        {error && <FormErrorNotice message={error} className="mt-2 text-xs" />}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className={`${getFormButtonClassName({ variant: "secondary", size: "md", fullWidth: true })} rounded-xl`}
          >
            à¸¢à¸à¹€à¸¥à¸´à¸
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`${getFormButtonClassName({ variant: "danger", size: "md", fullWidth: true })} rounded-xl`}
          >
            {loading ? "à¸à¸³à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡..." : "à¸ªà¹ˆà¸‡à¸£à¸²à¸¢à¸‡à¸²à¸™"}
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
    if (rating === 0) { setError("à¸à¸£à¸¸à¸“à¸²à¹€à¸¥à¸·à¸­à¸à¸”à¸²à¸§"); return; }
    setLoading(true);
    setError("");
    try {
      await onSubmit(selectedOrderId, rating, comment.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className={`${getPanelClassName({ padding: "lg", radius: "2xl", shadow: "xl", bordered: false })} w-full max-w-md`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-yellow-400 text-xl">â˜…</span>
          <h2 className="text-lg font-bold text-[#4A3B32]">à¸£à¸µà¸§à¸´à¸§à¸œà¸¹à¹‰à¸‚à¸²à¸¢</h2>
        </div>

        {orders.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#4A3B32] mb-1">à¹€à¸¥à¸·à¸­à¸à¸­à¸­à¹€à¸”à¸­à¸£à¹Œà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸£à¸µà¸§à¸´à¸§</label>
            <select
              aria-label="à¹€à¸¥à¸·à¸­à¸à¸­à¸­à¹€à¸”à¸­à¸£à¹Œà¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¸à¸²à¸£à¸£à¸µà¸§à¸´à¸§"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(Number(e.target.value))}
              className={getFormFieldClassName({ size: "xl" })}
            >
              {orders.map((o) => (
                <option key={o.Order_ID} value={o.Order_ID}>
                  {o.Title || `à¸­à¸­à¹€à¸”à¸­à¸£à¹Œ #${o.Order_ID}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="block text-sm font-medium text-[#4A3B32] mb-2">à¸„à¸°à¹à¸™à¸™</label>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-4xl leading-none transition-transform hover:scale-110"
            >
              <span className={(hoverRating || rating) >= s ? "text-yellow-400" : "text-[#DCD0C0]"}>â˜…</span>
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-[#4A3B32] mb-1">
          à¸„à¸§à¸²à¸¡à¸„à¸´à¸”à¹€à¸«à¹‡à¸™ <span className="text-[#A89F91] font-normal">(à¹„à¸¡à¹ˆà¸šà¸±à¸‡à¸„à¸±à¸š)</span>
        </label>
        <TextareaField
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="à¹à¸šà¹ˆà¸‡à¸›à¸±à¸™à¸›à¸£à¸°à¸ªà¸šà¸à¸²à¸£à¸“à¹Œà¸à¸²à¸£à¸‹à¸·à¹‰à¸­à¸‚à¸­à¸‡à¸„à¸¸à¸“..."
          textareaClassName={getFormFieldClassName({ size: "xl", resize: "none" })}
        />

        {error && <FormErrorNotice message={error} className="mt-2 text-xs" />}

        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className={`${getFormButtonClassName({ variant: "secondary", size: "md", fullWidth: true })} rounded-xl`}
          >
            à¸¢à¸à¹€à¸¥à¸´à¸
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`${getFormButtonClassName({ variant: "primary", size: "md", fullWidth: true })} rounded-xl`}
          >
            {loading ? "à¸à¸³à¸¥à¸±à¸‡à¸ªà¹ˆà¸‡..." : "à¸ªà¹ˆà¸‡à¸£à¸µà¸§à¸´à¸§"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me, isLoggedIn } = useAuth();

  // SWR data fetching
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
    orderApi.getMyBuyerOrders().then((res) => {
      const completed = res.data.filter(
        (o) => o.Seller_ID === Number(id) && o.Status === "completed"
      );
      const reviewedOrderIds = new Set(reviews.map((r) => r.Order_ID));
      setReviewableOrders(completed.filter((o) => !reviewedOrderIds.has(o.Order_ID)));
    }).catch(() => {});
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
          <p className="text-lg mb-4">à¹„à¸¡à¹ˆà¸žà¸šà¸œà¸¹à¹‰à¹ƒà¸Šà¹‰</p>
          <Link href="/" className="text-[#D9734E] hover:underline">à¸à¸¥à¸±à¸šà¹„à¸›à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸</Link>
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
      {showReport && (
        <ReportModal onClose={() => setShowReport(false)} onSubmit={handleReport} />
      )}
      {showReview && (
        <ReviewModal orders={reviewableOrders} onClose={() => setShowReview(false)} onSubmit={handleReview} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <Link href="/" className="text-sm text-[#D9734E] hover:underline">
            &larr; à¸à¸¥à¸±à¸šà¹„à¸›à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸
          </Link>
        </div>

        {/* Profile header card */}
        <div className={`${getPanelClassName({ padding: "lg", radius: "2xl" })} mb-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-full bg-[#E6D5C3] overflow-hidden shrink-0">
                {seller.Avatar_URL ? (
                  <img
                    src={`${API_BASE}${seller.Avatar_URL}`}
                    alt={seller.Username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="grid place-items-center h-full text-3xl">ðŸ‘¤</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#4A3B32]">{seller.Username}</h1>
                {rating && rating.totalReviews > 0 ? (
                  <StarDisplay score={rating.averageRating} total={rating.totalReviews} />
                ) : (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[#DCD0C0] text-base">{"â˜…".repeat(5)}</span>
                    <span className="text-sm text-[#A89F91]">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸µà¸§à¸´à¸§</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons â€” only show when logged in and not own profile */}
            {isLoggedIn && !isOwnProfile && (
              <div className="flex flex-col items-end gap-2">
                {reviewableOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className={`${getFormButtonClassName({ variant: "secondary", size: "sm" })} gap-1.5`}
                  >
                    <span className="text-sm leading-none">â˜…</span>
                    à¸£à¸µà¸§à¸´à¸§à¸œà¸¹à¹‰à¸‚à¸²à¸¢
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowReport(true)}
                  title="à¸£à¸²à¸¢à¸‡à¸²à¸™à¸œà¸¹à¹‰à¹ƒà¸Šà¹‰à¸™à¸µà¹‰"
                  disabled={reportDone}
                  className={`${getFormButtonClassName({ variant: "secondary", size: "sm" })} gap-1.5 text-[#A89F91] hover:text-[#C45A5A] hover:border-[#C45A5A]`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 01.832 1.555L13.382 10l3.45 5.445A1 1 0 0116 17H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                  </svg>
                  {reportDone ? "à¸£à¸²à¸¢à¸‡à¸²à¸™à¹à¸¥à¹‰à¸§" : "à¸£à¸²à¸¢à¸‡à¸²à¸™"}
                </button>
              </div>
            )}
          </div>

          {reportDone && (
            <FormSuccessNotice
              message="à¸ªà¹ˆà¸‡à¸£à¸²à¸¢à¸‡à¸²à¸™à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§ à¸‚à¸­à¸šà¸„à¸¸à¸“à¸—à¸µà¹ˆà¹à¸ˆà¹‰à¸‡à¹ƒà¸«à¹‰à¹€à¸£à¸²à¸—à¸£à¸²à¸š"
              className="mt-3 text-xs px-3 py-2 text-[#4A3B32]"
            />
          )}
        </div>

        {/* Tab menu */}
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


        {activeTab === "products" && (
          products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.slice(0, visibleCount).map((p) => (
                  <ProductCard key={p.id} product={p} badgeText="" />
                ))}
              </div>
              {visibleCount < products.length && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + 28)}
                    className={`${getFormButtonClassName({ variant: "primary", size: "md" })} rounded-xl`}
                  >
                    à¹‚à¸«à¸¥à¸”à¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡ ({products.length - visibleCount} à¸£à¸²à¸¢à¸à¸²à¸£)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-[#A89F91] py-16">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸ªà¸´à¸™à¸„à¹‰à¸²</div>
          )
        )}

        {/* Reviews tab */}
        {activeTab === "reviews" && (
          reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.Review_ID} className={getPanelClassName({ padding: "md", radius: "xl" })}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-[#4A3B32]">{r.ReviewerName || "à¸œà¸¹à¹‰à¸‹à¸·à¹‰à¸­"}</div>
                    <div className="text-xs text-[#A89F91]">
                      {new Date(r.Created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-yellow-400 text-sm mb-1">
                    {"â˜…".repeat(r.Rating)}
                    <span className="text-[#DCD0C0]">{"â˜…".repeat(5 - r.Rating)}</span>
                  </div>
                  {r.Comment && <p className="text-sm text-[#4A3B32]">{r.Comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#A89F91] py-16">à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸µà¸§à¸´à¸§</div>
          )
        )}
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 bg-[#D9734E] hover:bg-[#C25B38] text-white w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition"
          title="à¹€à¸¥à¸·à¹ˆà¸­à¸™à¹„à¸›à¸šà¸™à¸ªà¸¸à¸”"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </>
  );
}
