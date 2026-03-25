"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/src/components/admin/DataTable";
import ConfirmDialog from "@/src/components/admin/ConfirmDialog";
import { adminApi, productApi } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import type { ProductWithSeller } from "@/src/types/Product";
import { cn } from "@/src/components/ui";

type TabKey = "all" | "banned";

const statusBadge = (status: string) => {
  const styles: Record<string, string> = {
    available: "bg-kd-hover text-kd-text",
    reserved: "bg-amber-100 text-amber-700",
    sold: "bg-kd-bg text-kd-text-light",
  };
  const labels: Record<string, string> = {
    available: "มีอยู่",
    reserved: "จองแล้ว",
    sold: "ขายแล้ว",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-kd-bg text-kd-text-light"}`}>
      {labels[status] || status}
    </span>
  );
};

export default function AdminProductsPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [confirmTarget, setConfirmTarget] = useState<{
    product: ProductWithSeller;
    action: "ban" | "unban";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showError } = useError();

  const fetchData = useCallback(() => {
    setLoading(true);

    if (tab === "banned") {
      adminApi
        .getBannedProducts(page)
        .then((res) => { setProducts(res.data); setTotal(res.pagination.total); })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      const params: Record<string, string> = {
        page: String(page),
        limit: "20",
      };
      if (search.trim()) params.keyword = search.trim();
      productApi
        .list(params)
        .then((res) => { setProducts(res.data); setTotal(res.meta.total); })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }
  }, [tab, page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeTab = (newTab: TabKey) => {
    setTab(newTab);
    setPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleAction = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      if (confirmTarget.action === "ban") {
        await adminApi.banProduct(confirmTarget.product.Product_ID!);
      } else {
        await adminApi.unbanProduct(confirmTarget.product.Product_ID!);
      }
      fetchData();
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
      setConfirmTarget(null);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (p: ProductWithSeller) => (
        <span className="text-kd-text-light">#{p.Product_ID}</span>
      ),
      className: "w-16",
    },
    {
      key: "title",
      header: "ชื่อสินค้า",
      render: (p: ProductWithSeller) => (
        <span className="font-medium line-clamp-1">{p.Title}</span>
      ),
    },
    {
      key: "price",
      header: "ราคา",
      render: (p: ProductWithSeller) => (
        <span>{Number(p.Price).toLocaleString()} ฿</span>
      ),
    },
    {
      key: "seller",
      header: "ผู้ขาย",
      render: (p: ProductWithSeller) => p.SellerName,
    },
    {
      key: "status",
      header: "สถานะ",
      render: (p: ProductWithSeller) => statusBadge(p.Status),
    },
    {
      key: "actions",
      header: "จัดการ",
      render: (p: ProductWithSeller) =>
        tab === "banned" || p.Is_Banned ? (
          <button
            onClick={() => setConfirmTarget({ product: p, action: "unban" })}
            className="text-xs px-3 py-1 rounded-lg bg-kd-hover text-kd-text hover:bg-kd-card transition-colors"
          >
            ปลดระงับ
          </button>
        ) : (
          <button
            onClick={() => setConfirmTarget({ product: p, action: "ban" })}
            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            ระงับ
          </button>
        ),
      className: "w-28",
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "สินค้าทั้งหมด" },
    { key: "banned", label: "สินค้าที่ถูกระงับ" },
  ];

  return (
    <>
      <h2 className="text-xl font-bold text-kd-primary mb-6">จัดการสินค้า</h2>

      <div className="flex gap-1 border-b border-kd-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-kd-primary text-kd-primary"
                : "border-transparent text-kd-text-light hover:text-kd-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาสินค้า..."
            className="kd-input max-w-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-kd-primary text-white rounded-md hover:bg-kd-primary-hover transition-colors"
          >
            ค้นหา
          </button>
        </form>
      )}

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        page={page}
        total={total}
        onPageChange={setPage}
        emptyText={tab === "banned" ? "ไม่มีสินค้าที่ถูกระงับ" : "ไม่มีข้อมูลสินค้า"}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "ban" ? "ระงับสินค้า" : "ปลดระงับสินค้า"}
        message={`ต้องการ${confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"}สินค้า "${confirmTarget?.product.Title}" หรือไม่?`}
        confirmLabel={confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"}
        confirmColor={confirmTarget?.action === "ban" ? "bg-red-600" : "bg-kd-primary"}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
