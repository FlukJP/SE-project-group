"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { reportApi } from "@/src/lib/api";
import { ProductDetailSkeleton } from "@/src/components/ui/Skeleton";
import { TextareaField } from "@/src/components/ui";
import { useAuth } from "@/src/contexts/AuthContext";
import { useProduct } from "@/src/hooks/useProducts";
import { useSellerRating } from "@/src/hooks/useReviews";

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
          <span className="text-[#C45A5A] text-xl">🚩</span>
          <h2 className="text-lg font-bold text-[#4A3B32]">รายงานสินค้านี้</h2>
        </div>
        <label className="block text-sm font-medium text-[#4A3B32] mb-1">เหตุผลในการรายงาน</label>
        <TextareaField
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="อธิบายเหตุผลที่ต้องการรายงานสินค้านี้..."
          textareaClassName="w-full border border-[#DCD0C0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C45A5A]/30 focus:border-[#C45A5A] resize-none"
        />
        {error && <p className="text-[#C45A5A] text-xs mt-1">{error}</p>}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-[#DCD0C0] rounded-xl py-2 text-sm font-medium text-[#4A3B32] hover:bg-[#E6D5C3]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
            className="flex-1 bg-[#C45A5A] text-white rounded-xl py-2 text-sm font-semibold hover:bg-[#A84040] disabled:opacity-50"
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
  const [mainImage, setMainImage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState("");

  const { data: product, isLoading: loading } = useProduct(id);
  const { data: sellerRating } = useSellerRating(product?.seller.id);

  // Set first image once product data arrives
  useEffect(() => {
    if (product?.images[0]) setMainImage(product.images[0]);
  }, [product?.images[0]]);

  if (loading) {
    return (
      <>
        <Navbar />
        <ProductDetailSkeleton />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-lg mb-4">ไม่พบประกาศ</p>
          <Link href="/" className="text-[#D9734E] hover:underline">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  // Clamp star rating to 0-5
  const safeRating = sellerRating
    ? Math.min(5, Math.max(0, Math.round(sellerRating.averageRating)))
    : 0;

  const isSelfProduct = isLoggedIn && user && String(user.User_ID) === product.seller.id;
  const isVerified = !!user?.Is_Email_Verified && !!user?.Is_Phone_Verified;

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

      {showReport && (
        <ReportProductModal
          onClose={() => { setShowReport(false); setReportError(""); }}
          onSubmit={handleReport}
          error={reportError}
        />
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="text-sm text-[#D9734E] hover:underline">
            &larr; กลับไปหน้าหลัก
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="w-full aspect-video bg-[#F9F6F0] rounded-2xl overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.title}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#A89F91] text-sm">
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
                        ? "border-[#D9734E]"
                        : "border-[#DCD0C0]"
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
                className="inline-flex items-center gap-1.5 text-sm bg-[#E6D5C3] text-[#4A3B32] border border-[#DCD0C0] rounded-full px-3 py-1 mb-4 hover:bg-[#DCD0C0] transition"
              >
                <span>🏷️</span>
                {product.categoryName || product.categoryKey}
              </Link>
            )}

            <div className="text-3xl font-bold text-[#D9734E] mb-4">
              {Number(product.price ?? 0).toLocaleString()} ฿
            </div>

            <div className="flex items-center gap-4 text-xs text-[#A89F91] mb-6">
              {product.location && <span>📍 {product.location}</span>}
              {product.location && product.postedAt && <span>•</span>}
              {product.postedAt && <span>{product.postedAt}</span>}
            </div>

            {product.description && (
              <div className="prose max-w-none mb-6">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="border-t border-[#E6D5C3] pt-6">
              <Link href={`/users/${product.seller.id}`} className="flex items-center gap-4 mb-4 hover:opacity-80 transition-opacity">
                <div className="h-12 w-12 rounded-full bg-[#E6D5C3] overflow-hidden">
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
                  <div className="font-semibold hover:text-[#D9734E] transition-colors">{product.seller.name}</div>
                  <div className="text-sm text-[#A89F91]">ผู้ขาย</div>
                  {sellerRating && sellerRating.totalReviews > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-yellow-400 text-sm">
                        {"★".repeat(safeRating)}
                        <span className="text-[#DCD0C0]">
                          {"★".repeat(5 - safeRating)}
                        </span>
                      </span>
                      <span className="text-xs text-[#A89F91]">
                        {sellerRating.averageRating.toFixed(1)} ({sellerRating.totalReviews} รีวิว)
                      </span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex gap-3">
                {isSelfProduct ? (
                  <span className="flex-1 text-center bg-[#DCD0C0] text-[#A89F91] px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                    สินค้าของคุณ
                  </span>
                ) : isLoggedIn && isVerified ? (
                  <Link
                    href={`/chat?seller=${product.seller.id}&product=${product.id}`}
                    className="flex-1 text-center bg-[#D9734E] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#C25B38]"
                  >
                    แชท
                  </Link>
                ) : isLoggedIn ? (
                  <Link
                    href="/profile?tab=profile"
                    className="flex-1 text-center bg-[#D9734E] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#C25B38]"
                  >
                    ยืนยันตัวตนเพื่อแชท
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex-1 text-center bg-[#D9734E] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#C25B38]"
                  >
                    เข้าสู่ระบบเพื่อแชท
                  </Link>
                )}
                {product.seller.phone && (
                  <a
                    href={`tel:${product.seller.phone}`}
                    className="flex-1 text-center border border-[#4A3B32] text-[#4A3B32] px-4 py-3 rounded-lg font-semibold hover:bg-[#E6D5C3]"
                  >
                    โทร
                  </a>
                )}
              </div>

              {isLoggedIn && !isSelfProduct && (
                <div className="mt-3">
                  {reportDone ? (
                    <p className="text-xs text-[#4A3B32] bg-[#E6D5C3] border border-[#DCD0C0] rounded-lg px-3 py-2">
                      ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่แจ้งให้เราทราบ
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowReport(true)}
                      className="flex items-center gap-1.5 text-xs text-[#A89F91] hover:text-[#C45A5A] border border-[#DCD0C0] hover:border-[#C45A5A] rounded-lg px-3 py-1.5 transition"
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
