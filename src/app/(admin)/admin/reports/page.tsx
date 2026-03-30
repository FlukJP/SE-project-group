"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DataTable from "@/src/components/admin/DataTable";
import ConfirmDialog from "@/src/components/admin/ConfirmDialog";
import { adminApi } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import type { Report } from "@/src/types/Report";

const typeBadge = (type: string) => {
  const isProduct = type === "product";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        isProduct
          ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isProduct ? "สินค้า" : "ผู้ใช้"}
    </span>
  );
};

const banBadge = (isBanned: boolean | number | undefined) => {
  if (isBanned) {
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
        ถูกระงับ
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-kd-hover text-kd-text">
      ปกติ
    </span>
  );
};

const getTargetHref = (report: Report) => {
  if (report.ReportType === "product" && report.Reported_Product_ID) return `/products/${report.Reported_Product_ID}`;
  if (report.ReportType === "user" && report.Reported_User_ID) return `/users/${report.Reported_User_ID}`;
  return null;
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<{
    report: Report;
    action: "ban" | "unban";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showError } = useError();

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi
      .getReports(page)
      .then((res) => { setReports(res.data); setTotal(res.pagination.total); })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async () => {
    if (!confirmTarget) return;
    const { report, action } = confirmTarget;
    setActionLoading(true);
    try {
      if (report.ReportType === "user" && report.Reported_User_ID) {
        if (action === "ban") {
          await adminApi.banUser(report.Reported_User_ID);
        } else {
          await adminApi.unbanUser(report.Reported_User_ID);
        }
      } else if (report.ReportType === "product" && report.Reported_Product_ID) {
        if (action === "ban") {
          await adminApi.banProduct(report.Reported_Product_ID);
        } else {
          await adminApi.unbanProduct(report.Reported_Product_ID);
        }
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
      render: (r: Report) => (
        <span className="text-kd-text-light">#{r.Report_ID}</span>
      ),
      className: "w-16",
    },
    {
      key: "type",
      header: "ประเภท",
      render: (r: Report) => (r.ReportType ? typeBadge(r.ReportType) : "-"),
      className: "w-20",
    },
    {
      key: "reporter",
      header: "ผู้รายงาน",
      render: (r: Report) => (
        <span className="text-kd-text-light">{r.ReporterName || `#${r.Reporter_ID}`}</span>
      ),
    },
    {
      key: "target",
      header: "เป้าหมาย",
      render: (r: Report) => {
        const href = getTargetHref(r);
        const label = r.TargetName || `#${r.Target_ID}`;

        return (
          <div className="flex items-center gap-2">
            {href ? (
              <Link
                href={href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-kd-primary hover:underline"
                title="เปิดหน้าตรวจสอบในแท็บใหม่"
              >
                {label}
              </Link>
            ) : (
              <span className="text-kd-text">{label}</span>
            )}
            {banBadge(r.TargetIsBanned)}
          </div>
        );
      },
    },
    {
      key: "reason",
      header: "เหตุผล",
      render: (r: Report) => (
        <span className="line-clamp-2 text-sm">{r.Reason}</span>
      ),
    },
    {
      key: "date",
      header: "วันที่",
      render: (r: Report) =>
        r.CreatedDate
          ? new Date(r.CreatedDate).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",
      className: "w-28",
    },
    {
      key: "actions",
      header: "จัดการ",
      render: (r: Report) => {
        if (!r.ReportType) return <span className="text-xs text-kd-text-light">-</span>;
        return r.TargetIsBanned ? (
          <button
            onClick={() => setConfirmTarget({ report: r, action: "unban" })}
            className="text-xs px-3 py-1 rounded-lg bg-kd-hover text-kd-text hover:bg-kd-card transition-colors"
          >
            ปลดระงับ
          </button>
        ) : (
          <button
            onClick={() => setConfirmTarget({ report: r, action: "ban" })}
            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            ระงับ
          </button>
        );
      },
      className: "w-24",
    },
  ];

  const targetLabel = confirmTarget
    ? confirmTarget.report.TargetName || `#${confirmTarget.report.Target_ID}`
    : "";

  return (
    <>
      <h2 className="text-xl font-bold text-kd-primary mb-6">รายงาน</h2>

      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        page={page}
        total={total}
        onPageChange={setPage}
        emptyText="ไม่มีรายงาน"
      />

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "ban" ? "ระงับเป้าหมาย" : "ปลดระงับเป้าหมาย"}
        message={`ต้องการ${confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"} "${targetLabel}" หรือไม่?`}
        confirmLabel={confirmTarget?.action === "ban" ? "ระงับ" : "ปลดระงับ"}
        confirmColor={confirmTarget?.action === "ban" ? "bg-red-600" : "bg-kd-primary"}
        loading={actionLoading}
        onConfirm={handleAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
