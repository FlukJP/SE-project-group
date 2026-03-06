import React from "react";

export default function ChatEmptyPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full w-full">
      <div className="w-32 h-32 mb-4 bg-gray-100 rounded-full flex items-center justify-center relative">
        <svg viewBox="0 0 24 24" fill="#121E4D" className="w-16 h-16">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </div>
      <p className="text-gray-600 text-lg font-medium">เริ่มพูดคุย</p>
    </div>
  );
}