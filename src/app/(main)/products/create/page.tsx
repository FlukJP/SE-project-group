"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";

import CategoryPicker from "@/src/components/product/CategoryPicker";
import CreateProductForm from "@/src/components/create/CreateProductForm";
import { toCreateCategory } from "@/src/data/categoriesData";
import type { CreateCategory } from "@/src/data/categoriesData";
import { categoryApi } from "@/src/lib/api";

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat") || "";
  const [categories, setCategories] = useState<CreateCategory[]>([]);

  useEffect(() => {
    categoryApi
      .list()
      .then((res) => setCategories(res.data.map(toCreateCategory)))
      .catch(() => setCategories([]));
  }, []);

  const goPick = (key: string) => {
    router.push(`/products/create?cat=${key}`);
  };

  const backToPicker = () => {
    router.push(`/products/create`);
  };

  return (
    <>
      <Navbar />

      {!cat ? (
        <CategoryPicker categories={categories} onPick={goPick} />
      ) : (
        <div className="py-10">
          <div className="container mx-auto px-4 max-w-3xl">
            <h1 className="text-2xl font-bold text-zinc-900 mb-6">
              ลงประกาศในหมวด: {cat}
            </h1>

            <CreateProductForm
              defaultCategoryKey={cat}
              onChangeCategory={goPick}
              onBackToPickCategory={backToPicker}
              categories={categories}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}
