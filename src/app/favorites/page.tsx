import React from "react";

export default function FavoritesEmptyPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-28 pb-16">
      
      <div className="w-32 h-32 relative mb-6 flex items-center justify-center">
        <div className="absolute inset-0 bg-[#F3F4F6] rounded-full"></div>
        
        <svg viewBox="0 0 24 24" fill="#121E4D" className="w-12 h-12 z-10">
          <path d="M12 21.35l-c1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        
        <div className="absolute bottom-4 left-1 text-[#3b82f6]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2H6c-1.1 0-2 .9-2 2v16h16V10l-8-8zm-2 14H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V6h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z"/>
          </svg>
        </div>
        
        <div className="absolute top-2 right-0 text-[#3b82f6]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
      </div>

      <p className="text-gray-500 text-[16px]">
        คุณยังไม่มีรายการโปรดในหมวดหมู่นี้
      </p>

    </div>
  );
}