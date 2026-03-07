"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || user?.Role !== "admin")) {
      router.replace("/");
    }
  }, [isLoading, isLoggedIn, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (!isLoggedIn || user?.Role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <p className="text-red-600">ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return <>{children}</>;
}
