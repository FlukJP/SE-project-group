import React from "react";

export default function HistoryPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-32 pb-16">
      
      {/* รูปวาด (Illustration) จำลองแบบ Kaidee */}
      <div className="mb-6 relative w-40 h-40 flex items-center justify-center">
        <svg 
          width="160" 
          height="160" 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* วงกลมพื้นหลังสีเทา */}
          <circle cx="60" cy="60" r="40" fill="#F3F4F6"/>
          {/* กระดาษสีขาว */}
          <rect x="38" y="25" width="44" height="66" rx="4" fill="white" />
          {/* ขีดสีแดง 2 เส้น */}
          <rect x="45" y="35" width="14" height="5" fill="#EF4444" />
          <rect x="45" y="44" width="14" height="5" fill="#EF4444" />
          {/* กรอบสี่เหลี่ยมใส่โทรโข่ง */}
          <rect x="63" y="32" width="28" height="22" fill="white" stroke="#E5E7EB" strokeWidth="2" />
          {/* ไอคอนโทรโข่งสีน้ำเงิน */}
          <path d="M69 43 L73 39 V47 Z" fill="#121E4D"/>
          <rect x="73" y="39" width="7" height="8" fill="#121E4D"/>
          <path d="M81 39.5 Q84 43 81 46.5" stroke="#121E4D" strokeWidth="2" fill="none" strokeLinecap="round"/>
          {/* ขีดบรรทัดสีเทาด้านล่าง */}
          <rect x="45" y="56" width="30" height="5" rx="1.5" fill="#E5E7EB" />
          <rect x="45" y="66" width="30" height="5" rx="1.5" fill="#E5E7EB" />
          <rect x="45" y="76" width="30" height="5" rx="1.5" fill="#E5E7EB" />
        </svg>
      </div>

      {/* ข้อความแจ้งเตือน */}
      <p className="text-gray-500 text-[16px]">
        คุณยังไม่เคยมีประวัติการใช้บริการ
      </p>

    </div>
  );
}