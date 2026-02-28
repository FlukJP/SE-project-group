import React from "react";
import { products } from "@/mock/products";
import { Product } from "@/types/Product";
import Link from "next/link";

interface PageProps {
  params: {
    id: string;
  };
}

export default function ProductDetailPage({ params }: PageProps) {
  const product = products.find((p) => p.id === params.id);
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg">ไม่พบประกาศ</p>
        <Link href="/" className="text-emerald-700 hover:underline">
          กลับไปหน้าหลัก
        </Link>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}

// client component for interactivity (image gallery)
function ProductDetailClient({ product }: { product: Product }) {
  "use client";
  const [mainImage, setMainImage] = React.useState(product.images[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/search" className="text-sm text-emerald-700 hover:underline">
          &larr; กลับไปหน้าค้นหา
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* images */}
        <div className="flex-1">
          <div className="w-full aspect-w-4 aspect-h-3 bg-zinc-100 rounded-2xl overflow-hidden">
            <img src={mainImage} alt={product.title} className="object-cover w-full h-full" />
          </div>
          <div className="mt-4 flex gap-2">
            {product.images.map((img) => (
              <button
                key={img}
                onClick={() => setMainImage(img)}
                className={`w-20 h-20 rounded-xl overflow-hidden border ${
                  img === mainImage ? "border-emerald-600" : "border-zinc-200"
                }`}
              >
                <img src={img} alt="thumbnail" className="object-cover w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        {/* details */}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold mb-2">{product.title}</h1>
          <div className="text-sm text-zinc-500 mb-4">
            {product.categoryKey}
          </div>

          <div className="text-3xl font-bold text-emerald-700 mb-4">
            {product.price.toLocaleString()} ฿
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500 mb-6">
            <span>📍 {product.location}</span>
            <span>•</span>
            <span>{product.postedAt}</span>
          </div>

          <div className="prose max-w-none mb-6">
            <p>{product.description}</p>
          </div>

          <div className="border-t border-zinc-200 pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-zinc-200 overflow-hidden">
                {product.seller.avatarUrl ? (
                  <img src={product.seller.avatarUrl} alt={product.seller.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="grid place-items-center h-full">👤</span>
                )}
              </div>
              <div>
                <div className="font-semibold">{product.seller.name}</div>
                <div className="text-sm text-zinc-500">ผู้ใช้งาน</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700">
                แชท
              </button>
              <button className="flex-1 border border-zinc-300 px-4 py-3 rounded-lg font-semibold hover:bg-zinc-50">
                โทร
              </button>
            </div>
          </div>

          <div className="mt-6 text-xs text-zinc-500">
            <Link href="#" className="hover:underline">
              รายงานประกาศ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
