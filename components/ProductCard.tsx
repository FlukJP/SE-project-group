import React from "react";
import Link from "next/link";
import Image from "next/image";

export type Product = {
  id: number;
  title: string;
  price: string;
  img: string;
  location: string;
  timeAgo: string;
};

export default function ProductCard({
  product,
  href,
  badgeText = "⭐ แนะนำ",
}: {
  product: Product;
  href?: string;
  badgeText?: string;
}) {
  const to = href ?? `/products/${product.id}`;

  return (
    <Link
      href={to}
      className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:shadow-lg transition"
    >
      <div className="relative h-44">
        <Image
          src={product.img}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-[1.03] transition"
          sizes="(max-width: 1024px) 100vw, 25vw"
          priority={product.id <= 4}
        />
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-semibold bg-white/95 border border-zinc-200 px-2 py-1 rounded-full">
            {badgeText}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="line-clamp-2 font-semibold text-zinc-900 group-hover:text-emerald-700">
          {product.title}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-emerald-700 font-extrabold">{product.price}</div>
          <span className="text-[11px] text-zinc-500">{product.timeAgo}</span>
        </div>

        <div className="mt-2 text-xs text-zinc-500">📍 {product.location}</div>
      </div>
    </Link>
  );
}