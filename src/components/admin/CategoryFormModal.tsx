"use client";

import { useState, useEffect } from "react";
import type { CategoryData } from "@/src/lib/api";

interface CategoryFormModalProps {
  open: boolean;
  category: CategoryData | null;
  onSave: (data: {
    category_key: string;
    name: string;
    emoji: string;
    sort_order?: number;
  }) => Promise<void>;
  onClose: () => void;
}

export default function CategoryFormModal({ open, category, onSave, onClose }: CategoryFormModalProps) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!category;

  useEffect(() => {
    if (category) {
      setKey(category.category_key);
      setName(category.name);
      setEmoji(category.emoji);
      setSortOrder(category.sort_order);
    } else {
      setKey("");
      setName("");
      setEmoji("");
      setSortOrder(0);
    }
    setError("");
  }, [category, open]);

  const handleSubmit = async () => {
    if (!key.trim() || !name.trim() || !emoji.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        category_key: key.trim(),
        name: name.trim(),
        emoji: emoji.trim(),
        sort_order: sortOrder,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-emerald-700 mb-4">
          {isEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium text-sm mb-1">Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="เช่น cars, phones"
              className="kd-input"
            />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">ชื่อหมวดหมู่</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น รถยนต์, โทรศัพท์"
              className="kd-input"
            />
          </div>
          <div>
            <label className="block font-medium text-sm mb-1">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="เช่น 🚗, 📱"
              className="kd-input"
            />
          </div>
          <div>
            <label htmlFor="sort-order" className="block font-medium text-sm mb-1">ลำดับ</label>
            <input
              id="sort-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="0"
              className="kd-input"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-emerald-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "กำลังบันทึก..." : isEdit ? "บันทึก" : "เพิ่ม"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
