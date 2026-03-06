import SectionHeader from "@/src/components/layout/SectionHeader";
import ProductCard from "@/src/components/product/ProductCard";
import { Product } from "@/src/types/Product";

interface FeaturedSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllHref?: string;
  badgeText?: string;
}

export default function FeaturedSection({
  title,
  subtitle,
  products,
  viewAllHref = "/search",
  badgeText = "⭐ แนะนำ",
}: FeaturedSectionProps) {
  return (
    <section>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} badgeText={badgeText} />
        ))}
      </div>
    </section>
  );
}
