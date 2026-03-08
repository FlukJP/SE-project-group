"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { productApi, categoryApi, API_BASE, type CategoryData } from "@/src/lib/api";
import type { ProductWithSeller } from "@/src/types/Product";
import { PROVINCES } from "@/src/data/provinces";

function parseDescription(description: string) {
  const locMatch = description.match(/📍\s*พื้นที่:\s*(.+?)\s*\((.+?)\)/);
  const phoneMatch = description.match(/📞\s*ติดต่อ:\s*(\S+)/);
  const clean = description
    .replace(/\n\n📍 พื้นที่:[\s\S]*$/, "")
    .replace(/📞\s*ติดต่อ:\s*\S+/g, "")
    .trim();
  return {
    cleanDescription: clean,
    province: locMatch?.[1]?.trim() || "",
    district: locMatch?.[2]?.trim() || "",
    phone: phoneMatch?.[1]?.trim() || "",
  };
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [condition, setCondition] = useState("มือสอง");

  // Image state
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const newFilesRef = useRef(newFiles);
  newFilesRef.current = newFiles;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    return () => {
      newFilesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([productApi.getById(id), categoryApi.list()])
      .then(([prodRes, catRes]) => {
        const p = prodRes.data;
        setProduct(p);
        setCategories(catRes.data);

        const parsed = parseDescription(p.Description || "");
        setTitle(p.Title);
        setPrice(String(p.Price));
        setDescription(parsed.cleanDescription);
        setProvince(parsed.province);
        setDistrict(parsed.district);
        setPhone(parsed.phone);
        setCategoryKey(p.Category_Key || "");
        setCondition(p.Condition || "มือสอง");

        // Parse image paths
        try {
          const imgs = JSON.parse(p.Image_URL);
          setExistingImagePaths(Array.isArray(imgs) ? imgs : []);
        } catch {
          setExistingImagePaths(p.Image_URL ? [p.Image_URL] : []);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const provinceOptions = useMemo(
    () => PROVINCES.map((p) => ({ value: p.name, label: p.name })),
    []
  );
  const districtOptions = useMemo(() => {
    const p = PROVINCES.find((x) => x.name === province);
    return p ? p.districts.map((d) => ({ value: d, label: d })) : [];
  }, [province]);

  const removeExistingImage = (path: string) => {
    setExistingImagePaths((prev) => prev.filter((p) => p !== path));
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`ไฟล์ "${f.name}" มีขนาดเกิน 5MB`);
        return false;
      }
      return true;
    });
    const toAdd = valid.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewFiles((prev) => [...prev, ...toAdd]);
    e.target.value = "";
  };

  const removeNewFile = (preview: string) => {
    setNewFiles((prev) => {
      URL.revokeObjectURL(preview);
      return prev.filter((f) => f.preview !== preview);
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "กรุณากรอกชื่อสินค้า";
    if (!price || isNaN(Number(price)) || Number(price) <= 0) errs.price = "ระบุราคาที่ถูกต้อง";
    if (!province) errs.province = "เลือกจังหวัด";
    if (!district) errs.district = "เลือกอำเภอ/เขต";
    if (!phone.trim()) errs.phone = "ระบุเบอร์โทรศัพท์";
    else if (!/^0\d{9}$/.test(phone.replace(/\D/g, "")))
      errs.phone = "เบอร์โทรต้องเป็น 10 หลัก ขึ้นต้นด้วย 0";
    if (existingImagePaths.length === 0 && newFiles.length === 0)
      errs.images = "ต้องมีรูปภาพอย่างน้อย 1 รูป";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("price", price);
      fd.append("description", description.trim());
      fd.append("categoryKey", categoryKey);
      fd.append("province", province);
      fd.append("district", district);
      fd.append("phone", phone.trim());
      fd.append("condition", condition);

      if (newFiles.length > 0) {
        newFiles.forEach((f) => fd.append("images", f.file));
      } else {
        // No new files — send remaining existing image paths as Image_URL
        fd.append("Image_URL", JSON.stringify(existingImagePaths));
      }

      await productApi.update(id, fd);
      setSubmitSuccess(true);
      setTimeout(() => router.push("/my-products"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
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
          <p className="mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <Link href="/login" className="text-emerald-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16">
          <p className="mb-4 text-lg">ไม่พบสินค้า</p>
          <Link href="/" className="text-emerald-700 hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  if (String(product.Seller_ID) !== String(user?.User_ID)) {
    return (
      <>
        <Navbar />
        <div className="text-center py-16">
          <p className="mb-4 text-lg">คุณไม่มีสิทธิ์แก้ไขสินค้านี้</p>
          <Link href="/" className="text-emerald-700 hover:underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </>
    );
  }

  const totalImages = existingImagePaths.length + newFiles.length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-50">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="mb-4">
            <Link href="/my-products" className="text-sm text-emerald-700 hover:underline">
              &larr; กลับหน้าสินค้าของฉัน
            </Link>
          </div>

          <h1 className="text-2xl font-extrabold text-emerald-700 mb-6">แก้ไขสินค้า</h1>

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 mb-6 font-semibold">
              บันทึกสำเร็จ กำลังกลับไปหน้าสินค้าของฉัน...
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                หมวดหมู่ *
              </label>
              <select
                title="เลือกหมวดหมู่"
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="">-- เลือกหมวด --</option>
                {categories.map((c) => (
                  <option key={c.category_key} value={c.category_key}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                ชื่อสินค้า *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder="ชื่อสินค้า"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <div className="text-xs text-zinc-400 text-right mt-0.5">{title.length}/255</div>
              {errors.title && <p className="text-red-600 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                ราคา (฿) *
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="ราคา"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                สภาพสินค้า
              </label>
              <select
                title="เลือกสภาพสินค้า"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                <option value="มือสอง">มือสอง</option>
                <option value="มือหนึ่ง">มือหนึ่ง</option>
                <option value="ใหม่">ใหม่</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                รายละเอียดสินค้า
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="รายละเอียดเพิ่มเติม"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <div className="text-xs text-zinc-400 text-right mt-0.5">
                {description.length}/2000
              </div>
            </div>

            {/* Province / District */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="province-select" className="block text-sm font-semibold text-zinc-700 mb-1">
                  จังหวัด *
                </label>
                <select
                  id="province-select"
                  title="เลือกจังหวัด"
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value);
                    setDistrict("");
                  }}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="">-- เลือกจังหวัด --</option>
                  {provinceOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="text-red-600 text-xs mt-1">{errors.province}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1">
                  อำเภอ/เขต *
                </label>
                <select
                  title="เลือกอำเภอ/เขต"
                  value={district}
                  disabled={!province}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-50"
                >
                  <option value="">-- เลือกอำเภอ/เขต --</option>
                  {districtOptions.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-red-600 text-xs mt-1">{errors.district}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">
                เบอร์โทรศัพท์ *
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08XXXXXXXX"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">
                รูปภาพ ({totalImages} รูป)
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {/* Existing images */}
                {existingImagePaths.map((path) => {
                  const src = path.startsWith("http") ? path : `${API_BASE}${path}`;
                  return (
                    <div
                      key={path}
                      className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(path)}
                        className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-red-600 text-xs font-bold hover:bg-white"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 bg-zinc-700/70 text-white text-[9px] px-1 rounded">
                        เดิม
                      </span>
                    </div>
                  );
                })}

                {/* New files */}
                {newFiles.map((f) => (
                  <div
                    key={f.preview}
                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-emerald-400"
                  >
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(f.preview)}
                      className="absolute top-1 right-1 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center text-red-600 text-xs font-bold hover:bg-white"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] px-1 rounded">
                      ใหม่
                    </span>
                  </div>
                ))}

                {/* Add button */}
                {totalImages < 5 && (
                  <label className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-500 hover:bg-zinc-50 cursor-pointer text-xs gap-1">
                    <span className="text-2xl leading-none">+</span>
                    <span>เพิ่มรูป</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileAdd}
                    />
                  </label>
                )}
              </div>

              {newFiles.length > 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  หมายเหตุ: การอัปโหลดรูปใหม่จะแทนที่รูปเดิมทั้งหมด
                </p>
              )}
              {errors.images && <p className="text-red-600 text-xs mt-1">{errors.images}</p>}
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || submitSuccess}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <Link
                href="/my-products"
                className="px-6 py-3 rounded-xl border border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-50 transition text-center"
              >
                ยกเลิก
              </Link>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
