"use client";

import { useEffect, useState } from "react";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { reviewApi, type ReviewData } from "@/src/lib/api";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? "text-yellow-400" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  const date = new Date(review.Created_at);
  const formatted = date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-zinc-800">
          {review.ReviewerName || "ผู้ใช้"}
        </div>
        <div className="text-xs text-zinc-400">{formatted}</div>
      </div>
      <div className="mb-2">
        <StarRating rating={review.Rating} />
      </div>
      {review.ProductTitle && (
        <div className="text-xs text-zinc-500 mb-1">
          สินค้า: {review.ProductTitle}
        </div>
      )}
      {review.Comment && (
        <p className="text-sm text-zinc-600 mt-2">{review.Comment}</p>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { isLoggedIn, user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !user?.User_ID) return;
    Promise.all([
      reviewApi.getReviewsForSeller(user.User_ID).then((r) => r.data),
      reviewApi.getSellerRating(user.User_ID).then((r) => r.data),
    ])
      .then(([revs, rating]) => {
        setReviews(revs);
        setAverageRating(rating.averageRating);
        setTotalReviews(rating.totalReviews);
      })
      .catch(() => {
        setReviews([]);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn, user?.User_ID]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold text-zinc-900 mb-6">
            รีวิวและคะแนนผู้ขาย
          </h1>

          {!isLoggedIn ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
              <div className="text-4xl mb-3">⭐</div>
              <p className="text-zinc-500">กรุณาเข้าสู่ระบบเพื่อดูรีวิว</p>
            </div>
          ) : loading ? (
            <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-6 flex items-center gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-700">
                    {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                  </div>
                  <StarRating rating={Math.round(averageRating)} />
                  <div className="text-xs text-zinc-500 mt-1">
                    {Number(totalReviews).toLocaleString()} รีวิว
                  </div>
                </div>
                <div className="flex-1 text-sm text-zinc-600">
                  คะแนนเฉลี่ยจากผู้ซื้อที่รีวิวคุณในฐานะผู้ขาย
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <ReviewCard key={r.Review_ID} review={r} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
                  <div className="text-4xl mb-3">⭐</div>
                  <p className="text-zinc-600 font-medium">ยังไม่มีรีวิว</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    รีวิวจากผู้ซื้อจะปรากฏที่นี่เมื่อมีคนรีวิวคุณ
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
