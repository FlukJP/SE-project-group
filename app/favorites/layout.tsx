"use client";

import React, { useState } from "react";
// อัปเดต Path ย้อนกลับ 2 ชั้น เพื่อให้เจอกับโฟลเดอร์ components
import Navbar from "@/components/Navbar"; 
import { CATEGORIES } from "@/components/categoriesData";

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="bg-[#F4F5F5] min-h-screen pb-10">
      
      <Navbar />

      <div className="max-w-5xl mx-auto mt-8 bg-white min-h-[600px] border border-gray-200 shadow-sm rounded-sm">
        
        <div className="px-6 py-5">
          <h1 className="text-[22px] font-bold text-[#121E4D]">
            รายการโปรด
          </h1>
        </div>

        <div className="flex gap-6 border-b border-gray-200 px-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("all")}
            className={`whitespace-nowrap pb-4 text-[16px] font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-[#121E4D] text-[#121E4D]"
                : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"
            }`}
          >
            ทั้งหมด
          </button>

          {CATEGORIES.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.key || cat.name)}
              className={`whitespace-nowrap pb-4 text-[16px] font-medium transition-colors ${
                activeTab === (cat.key || cat.name)
                  ? "border-b-2 border-[#121E4D] text-[#121E4D]"
                  : "text-gray-400 hover:text-gray-600 border-b-2 border-transparent"
              }`}
            >
              {cat.emoji && <span className="mr-2">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>

        <div>
          {children}
        </div>

      </div>
    </div>
  );
}