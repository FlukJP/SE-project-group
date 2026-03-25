"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductDisplay } from "@/src/types/ProductDisplay";


// Renders a product card with an image, badge, title, price, and location
export default function ProductCard({
    product,
    href,
    badgeText = "⭐ แนะนำ",
}: {
    product: ProductDisplay;
    href?: string;
    badgeText?: string;
}) {
    const to = href ?? `/products/${product.id}`;
    const image = product.images[0] || "";
    const timeAgo = product.postedAt;
    const priceStr = `${Number(product.price ?? 0).toLocaleString()} ฿`;
    const [imgError, setImgError] = useState(false);
    // Disable Next.js image optimization for localhost images that the CDN cannot reach
    const isLocalImage = image.startsWith("http://localhost") || image.startsWith("http://127.");

    return (
        <Link
            href={to}
            className="group bg-white rounded-2xl overflow-hidden border border-kd-border hover:shadow-lg transition-colors"
        >
            <div className="relative h-44">
                {image && !imgError ? (
                    <Image
                        src={image}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        priority={false}
                        unoptimized={isLocalImage}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-kd-bg text-kd-text-light text-4xl">
                        📷
                    </div>
                )}
                {badgeText && (
                    <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-semibold bg-white/95 border border-kd-border px-2 py-1 rounded-full text-kd-text">
                            {badgeText}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="line-clamp-2 font-semibold text-kd-text group-hover:text-kd-primary transition-colors">
                    {product.title}
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div className="text-kd-primary font-extrabold">{priceStr}</div>
                    <span className="text-[11px] text-kd-text-light">{timeAgo}</span>
                </div>

                <div className="mt-2 text-xs text-kd-text-light truncate">
                    {product.location ? `📍 ${product.location}` : <span className="text-kd-text-light opacity-60">📍 ไม่ระบุพื้นที่</span>}
                </div>
            </div>
        </Link>
    );
}
