"use client";

import Navbar from "@/src/components/layout/Navbar";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F4F5F5] min-h-screen pb-10">

      <Navbar />

      <div className="max-w-5xl mx-auto mt-8 bg-white min-h-[600px] border border-gray-200 shadow-sm rounded-sm">

        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-[18px] font-bold text-[#121E4D]">
            Kaidee History
          </h1>
        </div>

        <div>
          {children}
        </div>

      </div>
    </div>
  );
}
