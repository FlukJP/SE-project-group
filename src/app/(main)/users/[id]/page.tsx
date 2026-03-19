"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { userApi, productApi, reviewApi, type ReviewData, type SellerRatingData, API_BASE } from "@/src/lib/api";
import type { User } from "@/src/types/User";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<User | null>(null);
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [rating, setRating] = useState<SellerRatingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      userApi.getById(id),
      productApi.getBySeller(Number(id)),
      reviewApi.getReviewsForSeller(Number(id)),
      reviewApi.getSellerRating(Number(id)),
    ])
      .then(([userRes, productsRes, reviewsRes, ratingRes]) => {
        setSeller(userRes.data);
        setProducts(productsRes.data.map(toProductDisplay));
        setReviews(reviewsRes.data);
        setRating(ratingRes.data);
      })
      .catch(() => setSeller(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center text-zinc-500">
          กำลังโหลด...
        </div>
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg mb-4">ไม่พบผู้ใช้</p>
          <Link href="/" className="text-emerald-700 hover:underline">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  const safeRating = rating
    ? Math.min(5, Math.max(0, Math.round(rating.averageRating)))
    : 0;

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-4">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">
            &larr; กลับไปหน้าหลัก
          </Link>
        </div>

        {/* Seller header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex items-center gap-6 mb-8">
          <div className="h-20 w-20 rounded-full bg-zinc-200 overflow-hidden shrink-0">
            {seller.Avatar_URL ? (
              <img
                src={`${API_BASE}${seller.Avatar_URL}`}
                alt={seller.Username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="grid place-items-center h-full text-3xl">👤</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{seller.Username}</h1>
            {rating && rating.totalReviews > 0 ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400">
                  {"★".repeat(safeRating)}
                  <span className="text-zinc-300">{"★".repeat(5 - safeRating)}</span>
                </span>
                <span className="text-sm text-zinc-500">
                  {rating.averageRating.toFixed(1)} ({rating.totalReviews} รีวิว)
                </span>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 mt-1">ยังไม่มีรีวิว</p>
            )}
          </div>
        </div>

        {/* Products */}
        <h2 className="text-lg font-bold text-zinc-800 mb-4">
          สินค้าของผู้ขาย ({products.length})
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
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
                  <div className="text-sm font-bold text-emerald-700 mt-1">
                    {Number(p.price).toLocaleString()} ฿
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {p.status === "available" ? "กำลังขาย" : p.status === "reserved" ? "จอง" : "ขายแล้ว"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-400 py-12 mb-10">ยังไม่มีสินค้า</div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-zinc-800 mb-4">
              รีวิว ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.Review_ID} className="border border-zinc-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-semibold text-zinc-800">
                      {r.ReviewerName || "ผู้ซื้อ"}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {new Date(r.Created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="text-yellow-400 text-sm mb-1">
                    {"★".repeat(r.Rating)}
                    <span className="text-zinc-300">{"★".repeat(5 - r.Rating)}</span>
                  </div>
                  {r.Comment && <p className="text-sm text-zinc-600">{r.Comment}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
