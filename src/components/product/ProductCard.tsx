"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductDisplay } from "@/src/types/ProductDisplay";
import { getPanelClassName } from "@/src/components/ui";


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
            className={`${getPanelClassName({ radius: "2xl" })} group overflow-hidden transition-shadow hover:shadow-lg`}
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
                    <div className="flex items-center justify-center h-full bg-[#E6D5C3] text-[#A89F91] text-4xl">
                        📷
                    </div>
                )}
                {badgeText && (
                    <div className="absolute top-3 left-3">
                        <span className="text-[11px] font-semibold bg-white/95 border border-[#DCD0C0] px-2 py-1 rounded-full text-[#4A3B32]">
                            {badgeText}
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="line-clamp-2 font-semibold text-[#4A3B32] group-hover:text-[#D9734E] transition-colors">
                    {product.title}
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <div className="text-[#D9734E] font-extrabold">{priceStr}</div>
                    <span className="text-[11px] text-[#A89F91]">{timeAgo}</span>
                </div>

                <div className="mt-2 text-xs text-[#A89F91] truncate">
                    {product.location ? `📍 ${product.location}` : <span className="text-[#A89F91] opacity-60">📍 ไม่ระบุพื้นที่</span>}
                </div>
            </div>
        </Link>
    );
}
