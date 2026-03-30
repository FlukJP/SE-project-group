"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import CategoryPicker from "@/src/components/product/CategoryPicker";
import CreateProductForm from "@/src/components/create/CreateProductForm";
import { toCreateCategory } from "@/src/data/categoriesData";
import type { CreateCategory } from "@/src/data/categoriesData";
import { useAuth } from "@/src/contexts/AuthContext";
import { categoryApi } from "@/src/lib/api";

function GateCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="container mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-2xl border border-[#E6D5C3] bg-white p-8 shadow-sm">
        <div className="mb-4 text-4xl">🛍️</div>
        <h1 className="mb-3 text-2xl font-bold text-[#4A3B32]">{title}</h1>
        <p className="mb-6 text-[#A89F91]">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="rounded-xl bg-[#D9734E] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#C25B38]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, isLoggedIn, user } = useAuth();
  const cat = searchParams.get("cat") || "";
  const [categories, setCategories] = useState<CreateCategory[]>([]);
  const isVerified = !!user?.Is_Email_Verified && !!user?.Is_Phone_Verified;
  const sellerPhone = user?.Phone_number?.trim() || "";

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
    router.push("/products/create");
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <GateCard
          title="เข้าสู่ระบบก่อนลงขายสินค้า"
          description="กรุณาเข้าสู่ระบบก่อนเริ่มสร้างประกาศใหม่ เพื่อจัดการสินค้าและติดตามข้อความจากผู้ซื้อได้สะดวก"
          actionLabel="ไปหน้าเข้าสู่ระบบ"
          onAction={() => router.push("/login")}
        />
      </>
    );
  }

  if (!isVerified) {
    return (
      <>
        <Navbar />
        <GateCard
          title="ยืนยันตัวตนก่อนลงขายสินค้า"
          description="ระบบต้องยืนยันทั้งอีเมลและเบอร์โทรก่อน จึงจะสามารถสร้างประกาศและใช้งานแชทซื้อขายได้"
          actionLabel="ไปยืนยันตัวตน"
          onAction={() => router.push("/profile?tab=profile")}
        />
      </>
    );
  }

  if (!sellerPhone) {
    return (
      <>
        <Navbar />
        <GateCard
          title="เพิ่มเบอร์โทรในโปรไฟล์ก่อนลงขายสินค้า"
          description="ระบบจะใช้เบอร์โทรจากโปรไฟล์ผู้ขายเป็นข้อมูลติดต่อในประกาศ กรุณาเพิ่มหรืออัปเดตเบอร์โทรให้เรียบร้อยก่อน"
          actionLabel="ไปแก้ไขโปรไฟล์"
          onAction={() => router.push("/profile?tab=profile")}
        />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {!cat ? (
        <CategoryPicker categories={categories} onPick={goPick} />
      ) : (
        <div className="py-10">
          <div className="container mx-auto max-w-3xl px-4">
            <h1 className="mb-2 text-2xl font-bold text-[#4A3B32]">ลงประกาศในหมวด: {cat}</h1>
            <p className="mb-6 text-sm text-[#A89F91]">
              กรอกข้อมูลสินค้าให้ครบถ้วนเพื่อให้ผู้ซื้อเห็นรายละเอียดได้ชัดเจนมากขึ้น
            </p>

            <CreateProductForm
              defaultCategoryKey={cat}
              onChangeCategory={goPick}
              onBackToPickCategory={backToPicker}
              categories={categories}
              sellerPhone={sellerPhone}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>}>
      <CreatePageContent />
    </Suspense>
  );
}
