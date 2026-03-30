"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import {
  chatApi,
  orderApi,
  reviewApi,
  type OrderWithDetails,
  type ReviewData,
} from "@/src/lib/api";
import type { ChatRoomWithPartner } from "@/src/types/Chat";
import { getFormButtonClassName, getPanelClassName } from "@/src/components/ui";

type HistoryData = {
  buyerOrders: OrderWithDetails[];
  sellerOrders: OrderWithDetails[];
  reviews: ReviewData[];
  chats: ChatRoomWithPartner[];
};

const ORDER_STATUS_LABEL: Record<OrderWithDetails["Status"], string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

function formatDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ActivityCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className={getPanelClassName({ padding: "md", radius: "xl" })}>
      <div className="text-sm text-[#A89F91]">{title}</div>
      <div className="mt-2 text-3xl font-extrabold text-[#4A3B32]">{value}</div>
      <div className="mt-1 text-xs text-[#A89F91]">{subtitle}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold text-[#4A3B32]">{title}</h2>
        <p className="text-sm text-[#A89F91]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#E6D5C3] bg-[#F9F6F0] px-4 py-6 text-center text-[#A89F91]">
      {message}
    </div>
  );
}

export default function HistoryPage() {
  const { isLoading, isLoggedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<HistoryData>({
    buyerOrders: [],
    sellerOrders: [],
    reviews: [],
    chats: [],
  });

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      orderApi.getMyBuyerOrders(),
      orderApi.getMySellerOrders(),
      reviewApi.getMyReviews(),
      chatApi.getRooms(),
    ])
      .then(([buyerOrders, sellerOrders, reviews, chats]) => {
        if (cancelled) return;
        setData({
          buyerOrders: buyerOrders.data,
          sellerOrders: sellerOrders.data,
          reviews: reviews.data,
          chats: chats.data,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "โหลดประวัติการใช้งานไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const recentBuyerOrders = useMemo(() => [...data.buyerOrders].slice(0, 5), [data.buyerOrders]);
  const recentSellerOrders = useMemo(() => [...data.sellerOrders].slice(0, 5), [data.sellerOrders]);
  const recentReviews = useMemo(() => [...data.reviews].slice(0, 5), [data.reviews]);
  const recentChats = useMemo(() => [...data.chats].slice(0, 5), [data.chats]);

  if (isLoading || loading) {
    return <div className="py-16 text-center text-[#A89F91]">กำลังโหลดประวัติการใช้งาน...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-[#4A3B32]">เข้าสู่ระบบก่อนดูประวัติการใช้งาน</h2>
        <p className="mt-2 text-[#A89F91]">
          เมื่อเข้าสู่ระบบแล้ว คุณจะเห็นประวัติการซื้อขาย รีวิว และแชทล่าสุดได้จากหน้านี้
        </p>
        <div className="mt-6">
          <Link href="/login" className={getFormButtonClassName({ variant: "primary", size: "md" })}>
            ไปหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="text-lg font-semibold text-[#4A3B32]">โหลดประวัติการใช้งานไม่สำเร็จ</div>
        <p className="mt-2 text-[#A89F91]">{error}</p>
      </div>
    );
  }

  const hasAnyActivity =
    data.buyerOrders.length > 0 ||
    data.sellerOrders.length > 0 ||
    data.reviews.length > 0 ||
    data.chats.length > 0;

  if (!hasAnyActivity) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-[#F9F6F0] text-4xl">🕘</div>
        <h2 className="text-2xl font-bold text-[#4A3B32]">ยังไม่มีประวัติการใช้งาน</h2>
        <p className="mt-2 max-w-md text-[#A89F91]">
          เมื่อคุณเริ่มซื้อ ขาย รีวิว หรือแชทกับผู้ใช้อื่น กิจกรรมล่าสุดจะมาแสดงที่หน้านี้
        </p>
        <div className="mt-6">
          <Link href="/" className={getFormButtonClassName({ variant: "primary", size: "md" })}>
            กลับไปดูสินค้า
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-6 py-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActivityCard title="คำสั่งซื้อของฉัน" value={data.buyerOrders.length} subtitle="รายการที่คุณเป็นผู้ซื้อ" />
        <ActivityCard title="ออเดอร์ที่ขาย" value={data.sellerOrders.length} subtitle="รายการที่คุณเป็นผู้ขาย" />
        <ActivityCard title="รีวิวที่เขียนแล้ว" value={data.reviews.length} subtitle="รีวิวจากบัญชีของคุณ" />
        <ActivityCard title="ห้องแชท" value={data.chats.length} subtitle="บทสนทนาที่มีในระบบ" />
      </div>

      <Section title="คำสั่งซื้อล่าสุด" subtitle="อัปเดตจากรายการที่คุณซื้อไว้ล่าสุด">
        {recentBuyerOrders.length > 0 ? (
          <div className="space-y-3">
            {recentBuyerOrders.map((order) => (
              <div
                key={`buyer-${order.Order_ID}`}
                className={`${getPanelClassName({ padding: "md", radius: "xl" })} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#4A3B32]">{order.Title || `สินค้า #${order.Product_ID}`}</div>
                  <div className="mt-1 text-sm text-[#A89F91]">
                    ผู้ขาย: {order.SellerName || "-"} · {formatDate(order.Created_at || order.OrderDate)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-[#D9734E]">{Number(order.Total_Price).toLocaleString()} ฿</div>
                  <div className="mt-1 text-xs text-[#A89F91]">{ORDER_STATUS_LABEL[order.Status]}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox message="ยังไม่มีคำสั่งซื้อ" />
        )}
      </Section>

      <Section title="การขายล่าสุด" subtitle="รายการล่าสุดจากฝั่งที่คุณเป็นผู้ขาย">
        {recentSellerOrders.length > 0 ? (
          <div className="space-y-3">
            {recentSellerOrders.map((order) => (
              <div
                key={`seller-${order.Order_ID}`}
                className={`${getPanelClassName({ padding: "md", radius: "xl" })} flex items-center justify-between gap-4`}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#4A3B32]">{order.Title || `สินค้า #${order.Product_ID}`}</div>
                  <div className="mt-1 text-sm text-[#A89F91]">
                    ผู้ซื้อ: {order.BuyerName || "-"} · {formatDate(order.Created_at || order.OrderDate)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold text-[#D9734E]">{Number(order.Total_Price).toLocaleString()} ฿</div>
                  <div className="mt-1 text-xs text-[#A89F91]">{ORDER_STATUS_LABEL[order.Status]}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox message="ยังไม่มีประวัติการขาย" />
        )}
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title="รีวิวล่าสุด" subtitle="รีวิวที่คุณเคยเขียนไว้ล่าสุด">
          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div key={review.Review_ID} className={getPanelClassName({ padding: "md", radius: "xl" })}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-[#4A3B32]">{review.ProductTitle || `ออเดอร์ #${review.Order_ID}`}</div>
                    <div className="text-xs text-[#A89F91]">{formatDate(review.Created_at)}</div>
                  </div>
                  <div className="mt-2 text-sm text-yellow-500">{"★".repeat(review.Rating)}{"☆".repeat(5 - review.Rating)}</div>
                  {review.Comment && <p className="mt-2 text-sm text-[#A89F91]">{review.Comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <EmptyBox message="ยังไม่มีรีวิวที่เคยเขียน" />
          )}
        </Section>

        <Section title="แชทล่าสุด" subtitle="ห้องสนทนาที่มีการใช้งานล่าสุด">
          {recentChats.length > 0 ? (
            <div className="space-y-3">
              {recentChats.map((room) => (
                <Link
                  key={room.Chat_ID}
                  href={`/chat/${room.Chat_ID}`}
                  className={`${getPanelClassName({ padding: "md", radius: "xl" })} block transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[#4A3B32]">{room.PartnerName || "คู่สนทนา"}</div>
                      <div className="mt-1 truncate text-sm text-[#A89F91]">
                        {room.LastMessage || room.ProductTitle || "เปิดห้องแชทแล้ว"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs text-[#A89F91]">{formatDate(String(room.LastMessageTime || room.Created_At || ""))}</div>
                      {!!room.UnreadCount && room.UnreadCount > 0 && (
                        <div className="mt-1 text-xs font-semibold text-[#D9734E]">{room.UnreadCount} ข้อความใหม่</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyBox message="ยังไม่มีประวัติการแชท" />
          )}
        </Section>
      </div>
    </div>
  );
}
