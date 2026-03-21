"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { productApi, reviewApi, reportApi, type SellerRatingData } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import { useAuth } from "@/src/contexts/AuthContext";

function ReportProductModal({
  onClose,
  onSubmit,
  error,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  error: string;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onSubmit(reason.trim());
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-500 text-xl">🚩</span>
          <h2 className="text-lg font-bold text-zinc-800">รายงานสินค้านี้</h2>
        </div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">เหตุผลในการรายงาน</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="อธิบายเหตุผลที่ต้องการรายงานสินค้านี้..."
          className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-zinc-300 rounded-xl py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoggedIn } = useAuth();
  const [product, setProduct] = useState<ProductDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState("");
  const [sellerRating, setSellerRating] = useState<SellerRatingData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    cancelledRef.current = false;

    productApi
      .getById(id)
      .then((res) => {
        if (cancelledRef.current) return;
        const display = toProductDisplay(res.data);
        setProduct(display);
        setMainImage(display.images[0] || "");
        reviewApi.getSellerRating(Number(display.seller.id))
          .then((r) => {
            if (!cancelledRef.current) setSellerRating(r.data);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelledRef.current) setProduct(null);
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });

    return () => {
      cancelledRef.current = true;
    };
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

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg mb-4">ไม่พบประกาศ</p>
          <Link href="/" className="text-emerald-700 hover:underline">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  // P-7: Clamp star rating to 0-5
  const safeRating = sellerRating
    ? Math.min(5, Math.max(0, Math.round(sellerRating.averageRating)))
    : 0;

  // P-1: Determine if chat button should be shown / disabled
  const isSelfProduct = isLoggedIn && user && String(user.User_ID) === product.seller.id;

  const handleReport = async (reason: string) => {
    setReportError("");
    try {
      await reportApi.create({ targetId: Number(id), reportType: "product", reason });
      setShowReport(false);
      setReportDone(true);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <>
      <Navbar />

      {/* Report Modal */}
      {showReport && (
        <ReportProductModal
          onClose={() => { setShowReport(false); setReportError(""); }}
          onSubmit={handleReport}
          error={reportError}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="text-sm text-emerald-700 hover:underline">
            &larr; กลับไปหน้าหลัก
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="w-full aspect-video bg-zinc-100 rounded-2xl overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-2">
                {product.images.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border ${
                      img === mainImage
                        ? "border-emerald-600"
                        : "border-zinc-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt="thumbnail"
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-extrabold mb-2">{product.title}</h1>
            {product.categoryKey && (
              <Link
                href={`/search?cat=${product.categoryKey}`}
                className="inline-flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 mb-4 hover:bg-emerald-100 transition"
              >
                <span>🏷️</span>
                {product.categoryName || product.categoryKey}
              </Link>
            )}

            <div className="text-3xl font-bold text-emerald-700 mb-4">
              {Number(product.price ?? 0).toLocaleString()} ฿
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6">
              {product.location && <span>📍 {product.location}</span>}
              {product.location && product.postedAt && <span>•</span>}
              {product.postedAt && <span>{product.postedAt}</span>}
            </div>

            {product.description && (
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="border-t border-zinc-200 pt-6">
              <Link href={`/users/${product.seller.id}`} className="flex items-center gap-4 mb-4 hover:opacity-80 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-zinc-200 overflow-hidden">
                  {product.seller.avatarUrl ? (
                    <img
                      src={product.seller.avatarUrl}
                      alt={product.seller.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="grid place-items-center h-full">👤</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold hover:text-emerald-700 transition-colors">{product.seller.name}</div>
                  <div className="text-sm text-zinc-500">ผู้ขาย</div>
                  {sellerRating && sellerRating.totalReviews > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-yellow-400 text-sm">
                        {"★".repeat(safeRating)}
                        <span className="text-zinc-300">
                          {"★".repeat(5 - safeRating)}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-500">
                        {sellerRating.averageRating.toFixed(1)} ({sellerRating.totalReviews} รีวิว)
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex gap-3">
                {isSelfProduct ? (
                  <span className="flex-1 text-center bg-zinc-300 text-zinc-500 px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                    สินค้าของคุณ
                  </span>
                ) : isLoggedIn ? (
                  <Link
                    href={`/chat?seller=${product.seller.id}&product=${product.id}`}
                    className="flex-1 text-center bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    แชท
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex-1 text-center bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    เข้าสู่ระบบเพื่อแชท
                  </Link>
                )}
                {product.seller.phone && (
                  <a
                    href={`tel:${product.seller.phone}`}
                    className="flex-1 text-center border border-zinc-300 px-4 py-3 rounded-lg font-semibold hover:bg-zinc-50"
                  >
                    โทร
                  </a>
                )}
              </div>

              {/* Report product button */}
              {isLoggedIn && !isSelfProduct && (
                <div className="mt-3">
                  {reportDone ? (
                    <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งให้เราทราบ
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReport(true)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 border border-zinc-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 01.832 1.555L13.382 10l3.45 5.445A1 1 0 0116 17H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
                      </svg>
                      รายงานสินค้านี้
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
