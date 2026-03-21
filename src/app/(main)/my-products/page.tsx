"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { productApi, orderApi, API_BASE, type OrderWithDetails } from "@/src/lib/api";
import { ProductDisplay, toProductDisplay } from "@/src/types/ProductDisplay";
import { useError } from "@/src/contexts/ErrorContext";

type Tab = "products" | "selling" | "buying";

const STATUS_LABEL: Record<string, string> = {
  available: "กำลังขาย",
  reserved: "จอง",
  sold: "ขายแล้ว",
};

const STATUS_COLOR: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-yellow-100 text-yellow-700",
  sold: "bg-zinc-200 text-zinc-500",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "รอชำระเงิน",
  paid: "ชำระแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-500",
};

export default function MyProductsPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const { showError } = useError();
  const [activeTab, setActiveTab] = useState<Tab>("products");

  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [sellerOrders, setSellerOrders] = useState<OrderWithDetails[]>([]);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(true);
  // Bug 6 fix: separate updating state for each tab
  const [sellerOrderUpdating, setSellerOrderUpdating] = useState<number | null>(null);

  const [buyerOrders, setBuyerOrders] = useState<OrderWithDetails[]>([]);
  const [buyerOrdersLoading, setBuyerOrdersLoading] = useState(true);
  const [buyerOrderUpdating, setBuyerOrderUpdating] = useState<number | null>(null);

  // Buyer ID modal state
  const [pendingStatus, setPendingStatus] = useState<{ productId: string; newStatus: "reserved" | "sold" } | null>(null);
  const [buyerIdInput, setBuyerIdInput] = useState("");

  useEffect(() => {
    if (!user?.User_ID) return;
    productApi
      .getBySeller(user.User_ID)
      .then((res) => setProducts(res.data.map(toProductDisplay)))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, [user?.User_ID]);

  // Bug 5 fix: guard with user?.User_ID, re-run when user loads
  useEffect(() => {
    if (!user?.User_ID) return;
    orderApi
      .getMySellerOrders()
      .then((res) => setSellerOrders(res.data))
      .catch(() => setSellerOrders([]))
      .finally(() => setSellerOrdersLoading(false));

    orderApi
      .getMyBuyerOrders()
      .then((res) => setBuyerOrders(res.data))
      .catch(() => setBuyerOrders([]))
      .finally(() => setBuyerOrdersLoading(false));
  }, [user?.User_ID]);

  const handleStatusChange = async (productId: string, newStatus: string) => {
    if (newStatus === "reserved" || newStatus === "sold") {
      setBuyerIdInput("");
      setPendingStatus({ productId, newStatus: newStatus as "reserved" | "sold" });
      return;
    }
    // available — just update status directly
    setStatusUpdating(productId);
    try {
      const fd = new FormData();
      fd.append("Status", newStatus);
      await productApi.update(productId, fd);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: newStatus as ProductDisplay["status"] } : p
        )
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleBuyerIdConfirm = async () => {
    if (!pendingStatus) return;
    const buyerId = Number(buyerIdInput.trim());
    if (!buyerId || buyerId <= 0) {
      showError("กรุณาใส่ User ID ผู้ซื้อที่ถูกต้อง");
      return;
    }
    const { productId, newStatus } = pendingStatus;
    setStatusUpdating(productId);
    setPendingStatus(null);
    try {
      await orderApi.sellerRecord(Number(productId), buyerId, newStatus);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: newStatus as ProductDisplay["status"] } : p
        )
      );
      if (newStatus === "sold") {
        const res = await orderApi.getMySellerOrders();
        setSellerOrders(res.data);
        setActiveTab("selling");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("ยืนยันการลบสินค้านี้?")) return;
    setDeleting(productId);
    try {
      await productApi.deleteById(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setDeleting(null);
    }
  };

  // Bug 2 fix: seller can only do paid→completed
  const handleSellerOrderUpdate = async (orderId: number) => {
    setSellerOrderUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, "completed");
      setSellerOrders((prev) =>
        prev.map((o) => (o.Order_ID === orderId ? { ...o, Status: "completed" } : o))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSellerOrderUpdating(null);
    }
  };

  // Bug 2 fix: buyer does pending→paid
  const handleBuyerPayOrder = async (orderId: number) => {
    setBuyerOrderUpdating(orderId);
    try {
      await orderApi.updateStatus(orderId, "paid");
      setBuyerOrders((prev) =>
        prev.map((o) => (o.Order_ID === orderId ? { ...o, Status: "paid" } : o))
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBuyerOrderUpdating(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("ยืนยันการยกเลิกคำสั่งซื้อ?")) return;
    setBuyerOrderUpdating(orderId);
    try {
      await orderApi.cancel(orderId);
      setBuyerOrders((prev) =>
        prev.map((o) =>
          o.Order_ID === orderId ? { ...o, Status: "cancelled" } : o
        )
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBuyerOrderUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16 text-zinc-500">กำลังโหลด...</div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16">
          <p className="text-lg mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </>
    );
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "products", label: `สินค้าของฉัน (${products.length})` },
    { key: "selling", label: `ออเดอร์ที่ขาย (${sellerOrders.length})` },
    { key: "buying", label: `ประวัติการสั่งซื้อ (${buyerOrders.length})` },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-emerald-700">สินค้าของฉัน</h1>
              <p className="text-sm text-zinc-500 mt-0.5">{user?.Username}</p>
            </div>
            <Link
              href="/products/create"
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
            >
              + ลงขายสินค้าใหม่
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1 mb-6">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === t.key
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: My Products */}
          {activeTab === "products" && (
            <div>
              {productsLoading ? (
                <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-zinc-500 mb-4">ยังไม่มีสินค้า</p>
                  <Link
                    href="/products/create"
                    className="text-emerald-600 hover:underline text-sm"
                  >
                    ลงขายสินค้าแรกของคุณ
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                        {p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-300 text-xl">
                            📷
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${p.id}`}
                          className="text-sm font-semibold text-zinc-800 hover:text-emerald-700 truncate block"
                        >
                          {p.title}
                        </Link>
                        <div className="text-sm font-bold text-emerald-700 mt-0.5">
                          {p.price.toLocaleString()} ฿
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">{p.postedAt}</div>
                      </div>

                      {/* Status selector */}
                      <div className="shrink-0">
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-1 rounded-full mb-1 ${STATUS_COLOR[p.status]}`}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                        <select
                          title="เปลี่ยนสถานะสินค้า"
                          value={p.status}
                          disabled={statusUpdating === p.id}
                          onChange={(e) => handleStatusChange(p.id, e.target.value)}
                          className="block w-full text-xs border border-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                        >
                          <option value="available">กำลังขาย</option>
                          <option value="reserved">จอง</option>
                          <option value="sold">ขายแล้ว</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition text-center"
                        >
                          แก้ไข
                        </Link>
                        <button
                          type="button"
                          disabled={deleting === p.id}
                          onClick={() => handleDelete(p.id)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {deleting === p.id ? "กำลังลบ..." : "ลบ"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Seller Orders */}
          {activeTab === "selling" && (
            <div>
              {sellerOrdersLoading ? (
                <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
              ) : sellerOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="text-zinc-500">ยังไม่มีออเดอร์</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerOrders.map((order) => (
                    <SellerOrderCard
                      key={order.Order_ID}
                      order={order}
                      onConfirmShip={handleSellerOrderUpdate}
                      updating={sellerOrderUpdating === order.Order_ID}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Buyer Orders */}
          {activeTab === "buying" && (
            <div>
              {buyerOrdersLoading ? (
                <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
              ) : buyerOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-zinc-500">ยังไม่มีประวัติการสั่งซื้อ</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {buyerOrders.map((order) => (
                    <BuyerOrderCard
                      key={order.Order_ID}
                      order={order}
                      onPay={handleBuyerPayOrder}
                      onCancel={handleCancelOrder}
                      updating={buyerOrderUpdating === order.Order_ID}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Buyer ID Modal */}
      {pendingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-zinc-800 mb-1">
              {pendingStatus.newStatus === "sold" ? "บันทึกการขาย" : "บันทึกการจอง"}
            </h3>
            <p className="text-sm text-zinc-500 mb-4">กรุณาใส่ User ID ของผู้ซื้อ</p>
            <input
              type="number"
              min={1}
              placeholder="User ID ผู้ซื้อ"
              value={buyerIdInput}
              onChange={(e) => setBuyerIdInput(e.target.value)}
              className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPendingStatus(null)}
                className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBuyerIdConfirm}
                disabled={!buyerIdInput}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Bug 3 fix: use Created_at instead of OrderDate
function formatOrderDate(order: OrderWithDetails): string {
  const raw = order.Created_at || order.OrderDate;
  if (!raw) return "-";
  return new Date(raw).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function OrderImage({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="flex items-center justify-center h-full text-zinc-300 text-xl">📷</div>
      )}
    </div>
  );
}

function resolveImageUrl(imageUrlJson: string | undefined): string | null {
  if (!imageUrlJson) return null;
  try {
    const parsed = JSON.parse(imageUrlJson);
    const first = Array.isArray(parsed) ? parsed[0] : null;
    if (!first) return null;
    return first.startsWith("http") ? first : `${API_BASE}${first}`;
  } catch {
    return imageUrlJson.startsWith("http") ? imageUrlJson : `${API_BASE}${imageUrlJson}`;
  }
}

// Bug 2 fix: seller tab — only shows "ยืนยันส่งสินค้า" for paid orders
function SellerOrderCard({
  order,
  onConfirmShip,
  updating,
}: {
  order: OrderWithDetails;
  onConfirmShip: (id: number) => Promise<void>;
  updating: boolean;
}) {
  const imageUrl = resolveImageUrl(order.Image_URL);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
      <OrderImage imageUrl={imageUrl} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-800 truncate">
          {order.Title || `สินค้า #${order.Product_ID}`}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">ผู้ซื้อ: {order.BuyerName || "-"}</div>
        <div className="text-xs text-zinc-400 mt-0.5">
          {formatOrderDate(order)} · {order.Quantity} ชิ้น · {Number(order.Total_Price).toLocaleString()} ฿
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[order.Status]}`}>
          {ORDER_STATUS_LABEL[order.Status]}
        </span>
        {order.Status === "paid" && (
          <button
            type="button"
            disabled={updating}
            onClick={() => onConfirmShip(order.Order_ID)}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {updating ? "..." : "ยืนยันส่งสินค้า"}
          </button>
        )}
        <Link href={`/products/${order.Product_ID}`} className="text-xs text-emerald-600 hover:underline">
          ดูสินค้า
        </Link>
      </div>
    </div>
  );
}

// Bug 2 fix: buyer tab — "ยืนยันชำระเงิน" (pending→paid) + "ยกเลิก" for pending
function BuyerOrderCard({
  order,
  onPay,
  onCancel,
  updating,
}: {
  order: OrderWithDetails;
  onPay: (id: number) => Promise<void>;
  onCancel: (id: number) => Promise<void>;
  updating: boolean;
}) {
  const imageUrl = resolveImageUrl(order.Image_URL);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
      <OrderImage imageUrl={imageUrl} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-zinc-800 truncate">
          {order.Title || `สินค้า #${order.Product_ID}`}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">ผู้ขาย: {order.SellerName || "-"}</div>
        <div className="text-xs text-zinc-400 mt-0.5">
          {formatOrderDate(order)} · {order.Quantity} ชิ้น · {Number(order.Total_Price).toLocaleString()} ฿
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ORDER_STATUS_COLOR[order.Status]}`}>
          {ORDER_STATUS_LABEL[order.Status]}
        </span>
        {order.Status === "pending" && (
          <>
            <button
              type="button"
              disabled={updating}
              onClick={() => onPay(order.Order_ID)}
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updating ? "..." : "ยืนยันชำระเงิน"}
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => onCancel(order.Order_ID)}
              className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50"
            >
              {updating ? "..." : "ยกเลิก"}
            </button>
          </>
        )}
        <Link href={`/products/${order.Product_ID}`} className="text-xs text-emerald-600 hover:underline">
          ดูสินค้า
        </Link>
      </div>
    </div>
  );
}
