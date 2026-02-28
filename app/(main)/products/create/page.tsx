"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Profile from "@/components/Profile";

import CategoryPicker from "@/components/create/CategoryPicker";
import CreateProductForm from "@/components/create/CreateProductForm";
import { CREATE_CATEGORIES } from "@/components/categoriesData";

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat") || "";

  const [showProfile, setShowProfile] = useState(false);

  const goPick = (key: string) => {
    router.push(`/products/create?cat=${key}`);
  };

  const backToPicker = () => {
    router.push(`/products/create`);
  };

  return (
    <>
      {/* ✅ Navbar ต้องอยู่บนสุด */}
      <Navbar isLoggedIn onProfileClick={() => setShowProfile(true)} />

      {/* ✅ เนื้อหาหน้า */}
      {!cat ? (
        <CategoryPicker categories={CREATE_CATEGORIES} onPick={goPick} />
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
            />
          </div>
        </div>
      )}

      {/* ✅ Profile popup */}
      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </>
  );
}