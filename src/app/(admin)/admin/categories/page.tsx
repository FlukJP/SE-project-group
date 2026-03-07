"use client";

import { useEffect, useState } from "react";
import { categoryApi, type CategoryData } from "@/src/lib/api";
import ConfirmDialog from "@/src/components/admin/ConfirmDialog";
import CategoryFormModal from "@/src/components/admin/CategoryFormModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryData | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-zinc-500 py-16">กำลังโหลด...</div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-emerald-700">จัดการหมวดหมู่</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          + เพิ่มหมวดหมู่
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center text-zinc-500 py-16">ไม่มีหมวดหมู่</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 w-16">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">
                  Emoji
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">
                  Key
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600">
                  ชื่อ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 w-20">
                  ลำดับ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 w-20">
                  สถานะ
                </th>
                <th className="text-left px-4 py-3 font-semibold text-zinc-600 w-36">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.Category_ID}
                  className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 py-3 text-zinc-500">
                    #{cat.Category_ID}
                  </td>
                  <td className="px-4 py-3 text-xl">{cat.emoji}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-600">
                    {cat.category_key}
                  </td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{cat.sort_order}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {cat.is_active ? "เปิด" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
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
