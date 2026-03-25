"use client";

import { useEffect, useState } from "react";
import { categoryApi, type CategoryData } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import ConfirmDialog from "@/src/components/admin/ConfirmDialog";
import CategoryFormModal from "@/src/components/admin/CategoryFormModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryData | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { showError } = useError();

  const fetchCategories = () => {
    setLoading(true);
    categoryApi
      .list()
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleEdit = (cat: CategoryData) => {
    setEditTarget(cat);
    setFormOpen(true);
  };

  const handleSave = async (data: {
    category_key: string;
    name: string;
    emoji: string;
    sort_order?: number;
  }) => {
    if (editTarget) {
      await categoryApi.update(editTarget.Category_ID, data);
    } else {
      await categoryApi.create(data);
    }
    fetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoryApi.delete(deleteTarget.Category_ID);
      fetchCategories();
    } catch (err) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-kd-text-light py-16">กำลังโหลด...</div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-kd-primary">จัดการหมวดหมู่</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm bg-kd-primary text-white rounded-lg hover:bg-kd-primary-hover transition-colors"
        >
          + เพิ่มหมวดหมู่
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center text-kd-text-light py-16">ไม่มีหมวดหมู่</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-kd-border bg-kd-bg">
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light w-16">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light">
                  Emoji
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light">
                  Key
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light">
                  ชื่อ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light w-20">
                  ลำดับ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light w-20">
                  สถานะ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-kd-text-light w-36">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.Category_ID}
                  className="border-b border-kd-border hover:bg-kd-hover transition-colors"
                >
                  <td className="px-4 py-3 text-kd-text-light">
                    #{cat.Category_ID}
                  </td>
                  <td className="px-4 py-3 text-xl">{cat.emoji}</td>
                  <td className="px-4 py-3 font-mono text-xs text-kd-text-light">
                    {cat.category_key}
                  </td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-kd-text-light">{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.is_active
                          ? "bg-kd-hover text-kd-text"
                          : "bg-kd-bg text-kd-text-light"
                      }`}
                    >
                      {cat.is_active ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-xs px-3 py-1 rounded-lg bg-kd-hover text-kd-text hover:bg-kd-card transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        open={formOpen}
        category={editTarget}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบหมวดหมู่"
        message={`ต้องการลบหมวดหมู่ "${deleteTarget?.name}" หรือไม่? การลบจะไม่สามารถกู้คืนได้`}
        confirmLabel="ลบ"
        confirmColor="bg-red-600"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
