"use client";

import { SWRConfig } from "swr";
import { useError } from "@/src/contexts/ErrorContext";
import { ApiError } from "@/src/lib/apiClient";

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  const { showError } = useError();

  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        dedupingInterval: 5000,
        onError: (err) => {
          // 401 → auth flow จัดการเอง, 404 → แต่ละหน้าแสดง "ไม่พบ..." เอง
          if (err instanceof ApiError && (err.status === 401 || err.status === 404)) return;
          const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
          showError(message);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
