"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/src/components/admin/DataTable";
import ConfirmDialog from "@/src/components/admin/ConfirmDialog";
import { adminApi } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import type { User } from "@/src/types/User";
import { cn } from "@/src/components/ui";

type TabKey = "all" | "banned";

const roleBadge = (role: string) => {
  const styles: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    customer: "bg-zinc-100 text-zinc-700",
  };
  const labels: Record<string, string> = {
    admin: "แอดมิน",
    customer: "ลูกค้า",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.customer}`}>
      {labels[role] || role}
    </span>
  );
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [confirmTarget, setConfirmTarget] = useState<{
    user: User;
    action: "ban" | "unban";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showError } = useError();

  const fetchData = useCallback(() => {
    setLoading(true);
    const fetcher =
      tab === "banned"
        ? adminApi.getBannedUsers(page)
        : adminApi.getUsers(page);

    fetcher
      .then((res) => { setUsers(res.data); setTotal(res.pagination.total); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [tab, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeTab = (newTab: TabKey) => {
    setTab(newTab);
    setPage(1);
  };

  const handleAction = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      if (confirmTarget.action === "ban") {
        await adminApi.banUser(confirmTarget.user.User_ID!);
      } else {
        await adminApi.unbanUser(confirmTarget.user.User_ID!);
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
      render: (u: User) => <span className="text-zinc-500">#{u.User_ID}</span>,
      className: "w-16",
    },
    {
      key: "username",
      header: "ชื่อผู้ใช้",
      render: (u: User) => <span className="font-medium">{u.Username}</span>,
    },
    {
      key: "email",
      header: "อีเมล",
      render: (u: User) => u.Email,
    },
    {
      key: "role",
      header: "บทบาท",
      render: (u: User) => roleBadge(u.Role),
    },
    {
      key: "actions",
      header: "จัดการ",
      render: (u: User) => {
        if (u.Role === "admin") {
          return <span className="text-xs text-zinc-400">-</span>;
        }
        return tab === "banned" || u.Is_Banned ? (
          <button
            onClick={() => setConfirmTarget({ user: u, action: "unban" })}
            className="text-xs px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            ปลดระงับ
          </button>
        ) : (
          <button
            onClick={() => setConfirmTarget({ user: u, action: "ban" })}
            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            ระงับ
          </button>
        );
      },
      className: "w-28",
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: "ผู้ใช้ทั้งหมด" },
    { key: "banned", label: "ผู้ใช้ที่ถูกระงับ" },
  ];

  return (
    <>
      <h2 className="text-xl font-bold text-emerald-700 mb-6">จัดการผู้ใช้</h2>

      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        page={page}
        total={total}
        onPageChange={setPage}
        emptyText={tab === "banned" ? "ไม่มีผู้ใช้ที่ถูกระงับ" : "ไม่มีข้อมูลผู้ใช้"}
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "ban" ? "ระงับผู้ใช้" : "ปลดระงับผู้ใช้"}
        message={`ต้องการ${confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"}ผู้ใช้ "${confirmTarget?.user.Username}" หรือไม่?`}
        confirmLabel={confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"}
        confirmColor={confirmTarget?.action === "ban" ? "bg-red-600" : "bg-emerald-600"}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
