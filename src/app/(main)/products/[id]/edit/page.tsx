"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/src/components/layout/Navbar";
import { useAuth } from "@/src/contexts/AuthContext";
import { productApi, categoryApi, API_BASE, type CategoryData } from "@/src/lib/api";
import { useError } from "@/src/contexts/ErrorContext";
import type { ProductWithSeller } from "@/src/types/Product";
import { PROVINCES } from "@/src/data/provinces";
import { FormSuccessNotice, TextareaField } from "@/src/components/ui";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";

const PRICE_INPUT_PATTERN = /^\d+(\.\d{0,2})?$/;

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
  const { showError } = useError();
  const sellerPhone = user?.Phone_number?.trim() || "";

  const [product, setProduct] = useState<ProductWithSeller | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [condition, setCondition] = useState("มือสอง");

  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const newFilesRef = useRef(newFiles);
  newFilesRef.current = newFiles;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    return () => {
      newFilesRef.current.forEach((file) => URL.revokeObjectURL(file.preview));
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    Promise.all([productApi.getById(id), categoryApi.list()])
      .then(([productRes, categoryRes]) => {
        const currentProduct = productRes.data;
        setProduct(currentProduct);
        setCategories(categoryRes.data);

        const parsed = parseDescription(currentProduct.Description || "");
        const modernPhoneMatch = currentProduct.Description?.match(/(?:^|\n\n)PHONE:\s*(.+?)(?:\n|$)/);

        setTitle(currentProduct.Title);
        setPrice(String(currentProduct.Price));
        setDescription(parsed.cleanDescription.replace(/\n\nPHONE:\s*[\s\S]*$/, "").trim());
        setProvince(parsed.province);
        setDistrict(parsed.district);
        setPhone(sellerPhone || parsed.phone || modernPhoneMatch?.[1]?.trim() || "");
        setCategoryKey(currentProduct.Category_Key || "");
        setCondition(currentProduct.Condition || "มือสอง");

        try {
          const images = JSON.parse(currentProduct.Image_URL);
          setExistingImagePaths(Array.isArray(images) ? images : []);
        } catch {
          setExistingImagePaths(currentProduct.Image_URL ? [currentProduct.Image_URL] : []);
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id, sellerPhone]);

  const provinceOptions = useMemo(() => PROVINCES.map((provinceItem) => ({ value: provinceItem.name, label: provinceItem.name })), []);
  const districtOptions = useMemo(() => {
    const matchedProvince = PROVINCES.find((item) => item.name === province);
    return matchedProvince ? matchedProvince.districts.map((districtItem) => ({ value: districtItem, label: districtItem })) : [];
  }, [province]);

  const removeExistingImage = (path: string) => {
    setExistingImagePaths((prev) => prev.filter((item) => item !== path));
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`ไฟล์ "${file.name}" มีขนาดเกิน 5MB`);
        return false;
      }
      return true;
    });

    const filesToAdd = validFiles.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setNewFiles((prev) => [...prev, ...filesToAdd]);
    e.target.value = "";
  };

  const removeNewFile = (preview: string) => {
    setNewFiles((prev) => {
      URL.revokeObjectURL(preview);
      return prev.filter((item) => item.preview !== preview);
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!categoryKey) nextErrors.categoryKey = "กรุณาเลือกหมวดหมู่";
    if (!title.trim()) nextErrors.title = "กรุณากรอกชื่อสินค้า";
    if (!price || !PRICE_INPUT_PATTERN.test(price) || Number.isNaN(Number(price)) || Number(price) <= 0) nextErrors.price = "ระบุราคาที่ถูกต้อง";
    if (!province) nextErrors.province = "เลือกจังหวัด";
    if (!district) nextErrors.district = "เลือกอำเภอ/เขต";
    if (!sellerPhone) {
      nextErrors.phone = "กรุณาเพิ่มเบอร์โทรในโปรไฟล์ก่อนแก้ไขสินค้า";
    } else if (!/^0\d{9}$/.test(sellerPhone.replace(/\D/g, ""))) {
      nextErrors.phone = "เบอร์โทรในโปรไฟล์ต้องเป็น 10 หลัก ขึ้นต้นด้วย 0";
    }
    if (existingImagePaths.length === 0 && newFiles.length === 0) {
      nextErrors.images = "ต้องมีรูปภาพอย่างน้อย 1 รูป";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !validate()) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("price", price);
      formData.append("description", description.trim());
      formData.append("categoryKey", categoryKey);
      formData.append("province", province);
      formData.append("district", district);
      formData.append("phone", sellerPhone);
      formData.append("condition", condition);
      formData.append("Image_URL", JSON.stringify(existingImagePaths));

      if (newFiles.length > 0) {
        newFiles.forEach((file) => formData.append("images", file.file));
      }

      await productApi.update(id, formData);
      setSubmitSuccess(true);
      setTimeout(() => router.push("/my-products"), 1500);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="py-16 text-center text-[#A89F91]">กำลังโหลด...</div>
      </>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <div className="py-16 text-center">
          <p className="mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <Link href="/login" className="text-[#D9734E] hover:underline">
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
        <div className="py-16 text-center">
          <p className="mb-4 text-lg">ไม่พบสินค้า</p>
          <Link href="/" className="text-[#D9734E] hover:underline">
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
        <div className="py-16 text-center">
          <p className="mb-4 text-lg">คุณไม่มีสิทธิ์แก้ไขสินค้านี้</p>
          <Link href="/" className="text-[#D9734E] hover:underline">
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
      <main className="min-h-screen bg-[#F9F6F0]">
        <div className="container mx-auto max-w-2xl px-4 py-8">
          <div className="mb-4">
            <Link href="/my-products" className="text-sm text-[#D9734E] hover:underline">
              &larr; กลับหน้าสินค้าของฉัน
            </Link>
          </div>

          <h1 className="mb-6 text-2xl font-extrabold text-[#D9734E]">แก้ไขสินค้า</h1>

          {submitSuccess && (
            <FormSuccessNotice
              message="บันทึกสำเร็จ กำลังกลับไปหน้าสินค้าของฉัน..."
              className="mb-6 rounded-xl px-4 py-3 font-semibold"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#E6D5C3] bg-white p-6">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">หมวดหมู่ *</label>
              <select
                title="เลือกหมวดหมู่"
                value={categoryKey}
                onChange={(e) => setCategoryKey(e.target.value)}
                className={getFormFieldClassName({ size: "lg" })}
              >
                <option value="">-- เลือกหมวด --</option>
                {categories.map((category) => (
                  <option key={category.category_key} value={category.category_key}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryKey && <p className="mt-1 text-xs text-red-600">{errors.categoryKey}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">ชื่อสินค้า *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder="ชื่อสินค้า"
                className={getFormFieldClassName({ size: "lg" })}
              />
              <div className="mt-0.5 text-right text-xs text-[#A89F91]">{title.length}/255</div>
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">ราคา (฿) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={price}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || PRICE_INPUT_PATTERN.test(value)) {
                    setPrice(value);
                  }
                }}
                placeholder="ราคา"
                className={getFormFieldClassName({ size: "lg" })}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">สภาพสินค้า</label>
              <select
                title="เลือกสภาพสินค้า"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className={getFormFieldClassName({ size: "lg" })}
              >
                <option value="มือสอง">มือสอง</option>
                <option value="มือหนึ่ง">มือหนึ่ง</option>
                <option value="ใหม่">ใหม่</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">รายละเอียดสินค้า</label>
              <TextareaField
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="รายละเอียดเพิ่มเติม"
                textareaClassName={getFormFieldClassName({ size: "lg" })}
              />
              <div className="mt-0.5 text-right text-xs text-[#A89F91]">{description.length}/2000</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="province-select" className="mb-1 block text-sm font-semibold text-[#4A3B32]">
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
                  className={getFormFieldClassName({ size: "lg" })}
                >
                  <option value="">-- เลือกจังหวัด --</option>
                  {provinceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.province && <p className="mt-1 text-xs text-red-600">{errors.province}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">อำเภอ/เขต *</label>
                <select
                  title="เลือกอำเภอ/เขต"
                  value={district}
                  disabled={!province}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={getFormFieldClassName({ size: "lg", disabled: !province })}
                >
                  <option value="">-- เลือกอำเภอ/เขต --</option>
                  {districtOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.district && <p className="mt-1 text-xs text-red-600">{errors.district}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-[#4A3B32]">เบอร์โทรศัพท์ *</label>
              <input
                value={sellerPhone}
                readOnly
                placeholder="08XXXXXXXX"
                className={getFormFieldClassName({ size: "lg", readOnly: true })}
              />
              <p className="mt-1 text-xs text-[#A89F91]">ใช้เบอร์โทรจากโปรไฟล์ผู้ขาย หากต้องการเปลี่ยนให้แก้ไขที่หน้าโปรไฟล์ก่อน</p>
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#4A3B32]">รูปภาพ ({totalImages} รูป)</label>

              <div className="mb-2 flex flex-wrap gap-2">
                {existingImagePaths.map((path) => {
                  const src = path.startsWith("http") ? path : `${API_BASE}${path}`;

                  return (
                    <div key={path} className="relative h-24 w-24 overflow-hidden rounded-lg border border-[#E6D5C3]">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(path)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-red-600 hover:bg-white"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-[#4A3B32]/70 px-1 text-[9px] text-white">
                        เดิม
                      </span>
                    </div>
                  );
                })}

                {newFiles.map((file) => (
                  <div key={file.preview} className="relative h-24 w-24 overflow-hidden rounded-lg border border-[#D9734E]">
                    <img src={file.preview} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(file.preview)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-red-600 hover:bg-white"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 rounded bg-[#D9734E] px-1 text-[9px] text-white">
                      ใหม่
                    </span>
                  </div>
                ))}

                {totalImages < 5 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[#DCD0C0] text-xs text-[#A89F91] hover:bg-[#F9F6F0]">
                    <span className="text-2xl leading-none">+</span>
                    <span>เพิ่มรูป</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileAdd} />
                  </label>
                )}
              </div>

              {newFiles.length > 0 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-600">
                  หมายเหตุ: รูปใหม่จะถูกเพิ่มร่วมกับรูปเดิมที่ยังไม่ได้ลบออก
                </p>
              )}
              {errors.images && <p className="mt-1 text-xs text-red-600">{errors.images}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || submitSuccess}
                className="flex-1 rounded-xl bg-[#D9734E] py-3 font-semibold text-white transition hover:bg-[#C25B38] disabled:opacity-50"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึก"}
              </button>
              <Link
                href="/my-products"
                className="rounded-xl border border-[#DCD0C0] px-6 py-3 text-center font-semibold text-[#4A3B32] transition hover:bg-[#F9F6F0]"
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
