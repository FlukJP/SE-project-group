"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/src/components/admin/DataTable";
import { adminApi } from "@/src/lib/api";
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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    adminApi
      .getReports(page)
      .then((res) => setReports(res.data))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (r: Report) => (
        <span className="text-zinc-500">#{r.Report_ID}</span>
      ),
      className: "w-16",
    },
    {
      key: "type",
      header: "ประเภท",
      render: (r: Report) => typeBadge(r.ReportType),
    },
    {
      key: "reporter",
      header: "ผู้รายงาน (ID)",
      render: (r: Report) => (
        <span className="text-zinc-600">#{r.Reporter_ID}</span>
      ),
    },
    {
      key: "target",
      header: "เป้าหมาย (ID)",
      render: (r: Report) => (
        <span className="text-zinc-600">#{r.Target_ID}</span>
      ),
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
    },
  ];

  return (
    <>
      <h2 className="text-xl font-bold text-emerald-700 mb-6">รายงาน</h2>

      <DataTable
        columns={columns}
        data={reports}
        loading={loading}
        page={page}
        onPageChange={setPage}
        emptyText="ไม่มีรายงาน"
      />
    </>
  );
}
