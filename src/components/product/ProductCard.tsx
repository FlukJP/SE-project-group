"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ProductDisplay } from "@/src/types/ProductDisplay";
import { getPanelClassName } from "@/src/components/ui";

export function ProductCardBadge({ children }: { children: ReactNode }) {
    if (!children) return null;

    return (
        <div className="absolute top-3 left-3">
            <span className="rounded-full border border-[#DCD0C0] bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#4A3B32]">
                {children}
            </span>
        </div>
    );
}

export function ProductCardMeta({
    price,
    postedAt,
}: {
    price: ReactNode;
    postedAt?: ReactNode;
}) {
    return (
        <div className="mt-2 flex items-center justify-between">
            <div className="font-extrabold text-[#D9734E]">{price}</div>
            {postedAt ? <span className="text-[11px] text-[#A89F91]">{postedAt}</span> : null}
        </div>
    );
}

export function ProductCardLocation({
    location,
    emptyLabel = "📍 ไม่ระบุพื้นที่",
}: {
    location?: string | null;
    emptyLabel?: ReactNode;
}) {
    return (
        <div className="mt-2 truncate text-xs text-[#A89F91]">
            {location ? `📍 ${location}` : <span className="opacity-60">{emptyLabel}</span>}
        </div>
    );
}

type ProductCardProps = {
    product: ProductDisplay;
    href?: string;
    badgeText?: string;
};

// Renders a product card with an image, badge, title, price, and location
export default function ProductCard({
    product,
    href,
    badgeText = "⭐ แนะนำ",
}: ProductCardProps) {
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
                        className="object-cover transition group-hover:scale-[1.03]"
                        sizes="(max-width: 1024px) 100vw, 25vw"
                        priority={false}
                        unoptimized={isLocalImage}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center bg-[#E6D5C3] text-4xl text-[#A89F91]">
                        📷
                    </div>
                )}
                <ProductCardBadge>{badgeText}</ProductCardBadge>
            </div>

            <div className="p-4">
                <div className="line-clamp-2 font-semibold text-[#4A3B32] transition-colors group-hover:text-[#D9734E]">
                    {product.title}
                </div>

                <ProductCardMeta price={priceStr} postedAt={timeAgo} />
                <ProductCardLocation location={product.location} />
            </div>
        </Link>
    );
}
