"use client";

import React from "react";
// ไม่ต้องใช้ Link และ usePathname แล้ว เพราะเราเอาแท็บสลับหน้าออก
import Navbar from "@/components/Navbar"; 

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#F4F5F5] min-h-screen pb-10">
      
      {/* วาง Navbar ไว้ด้านบนสุด */}
      <Navbar />

      <div className="max-w-5xl mx-auto mt-8 bg-white min-h-[600px] border border-gray-200 shadow-sm rounded-sm">
        
        {/* เปลี่ยนจากแท็บเมนู เป็นแค่หัวข้อ Header ธรรมดา */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-[18px] font-bold text-[#121E4D]">
            Kaidee History
          </h1>
        </div>

        {/* พื้นที่แสดงเนื้อหาตรงกลาง (รูปโทรโข่งจากไฟล์ page.tsx จะมาแสดงตรงนี้) */}
        <div>
          {children}
        </div>

      </div>
    </div>
  );
}