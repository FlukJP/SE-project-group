import { cn } from "@/src/components/ui";

// Base shimmer block — all skeletons are composed from this
export function Skeleton({ className }: { className?: string }) {
    return <div className={cn("animate-pulse rounded-lg bg-white", className)} />;
}

// Matches a single ProductCard (h-44 image + p-4 content)
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-[#DCD0C0]">
            <Skeleton className="h-44 rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between mt-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-24 mt-1" />
            </div>
        </div>
    );
}

// Grid of ProductCardSkeletons (default 8, 2–4 columns)
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

// Horizontal row of category chip skeletons
export function CategoriesSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
            ))}
        </div>
    );
}

// Matches the product detail two-column layout (content only, no Navbar)
export function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left: image carousel area */}
                <div className="flex-1">
                    <Skeleton className="w-full aspect-video rounded-2xl" />
                </div>
                {/* Right: info panel */}
                <div className="flex-1 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-24 w-full" />
                    {/* Seller row */}
                    <div className="border-t border-[#DCD0C0] pt-6 flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Matches the public user profile header + tab bar + product grid
export function UserProfileSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Skeleton className="h-4 w-32 mb-4" />
            {/* Profile header card */}
            <div className="bg-white border border-[#DCD0C0] rounded-t-2xl p-6 border-b-0">
                <div className="flex items-center gap-5">
                    <Skeleton className="h-20 w-20 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
            </div>
            {/* Tab bar */}
            <div className="bg-white border border-[#DCD0C0] rounded-b-2xl flex overflow-hidden mb-6">
                <Skeleton className="flex-1 h-11 rounded-none" />
                <Skeleton className="flex-1 h-11 rounded-none" />
            </div>
            {/* Product grid preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
