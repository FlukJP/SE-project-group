"use client";

import React, { useState } from "react";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State สำหรับแท็บแชท
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="flex h-[calc(100vh-80px)] max-w-6xl mx-auto my-6 border border-gray-200 rounded-md overflow-hidden bg-white shadow-sm">
      
      {/* ----------------- ฝั่งซ้าย: รายการแชท (Sidebar) ----------------- */}
      <div className="w-1/3 min-w-[300px] border-r border-gray-200 flex flex-col bg-white">
        
        {/* แถบ Tabs */}
        <div className="flex border-b border-gray-200 text-sm font-medium text-gray-500">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-[#121E4D] text-[#121E4D] font-bold"
                : "hover:bg-gray-50"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setActiveTab("buyer")}
            className={`flex-1 py-3 transition-colors ${
              activeTab === "buyer"
                ? "border-b-2 border-[#121E4D] text-[#121E4D] font-bold"
                : "hover:bg-gray-50"
            }`}
          >
            แชทกับผู้ซื้อ
          </button>
          <button
            onClick={() => setActiveTab("seller")}
            className={`flex-1 py-3 transition-colors ${
              activeTab === "seller"
                ? "border-b-2 border-[#121E4D] text-[#121E4D] font-bold"
                : "hover:bg-gray-50"
            }`}
          >
            แชทกับผู้ขาย
          </button>
        </div>

        {/* กล่องข้อความแจ้งเตือนความปลอดภัย */}
        <div className="bg-[#FFF8CC] p-3 text-[11px] text-gray-700 flex items-start gap-2 border-b border-gray-200">
          <div className="bg-[#121E4D] text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0 mt-0.5">
            !
          </div>
          <p>
            เว็บไซต์ไม่มีบริการเป็นตัวกลางรับชำระเงินในการซื้อขาย โดยการซื้อขายสินค้าจะเป็นการตกลงกันเองระหว่างผู้ขายและผู้ซื้อ โปรดระวังการให้ข้อมูลส่วนตัวเพื่อความปลอดภัยของคุณ
          </p>
        </div>

        {/* พื้นที่แสดงรายการแชท */}
        <div className="flex-1 overflow-y-auto bg-[#F4F5F5] p-2">
          {/* อนาคตสามารถนำ Component รายชื่อคนคุยมาใส่ตรงนี้ได้ */}
        </div>

        {/* ปุ่มแก้ไขด้านล่าง */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <button className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            แก้ไข
          </button>
        </div>
      </div>

      {/* ----------------- ฝั่งขวา: พื้นที่แสดงเนื้อหา (Children) ----------------- */}
      <div className="flex-1 bg-[#FAFAFA] flex flex-col">
        {children}
      </div>

    </div>
  );
}