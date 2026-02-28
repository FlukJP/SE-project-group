"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CREATE_CATEGORIES } from "@/components/categoriesData";

type ProvinceData = { name: string; districts: string[] };

const PROVINCES: ProvinceData[] = [
  { name: "กรุงเทพมหานคร", districts: ["บางเขน", "จตุจักร", "ลาดพร้าว", "บางนา", "ปทุมวัน", "ห้วยขวาง"] },
  { name: "นนทบุรี", districts: ["เมืองนนทบุรี", "ปากเกร็ด", "บางใหญ่", "บางบัวทอง"] },
  { name: "ปทุมธานี", districts: ["เมืองปทุมธานี", "คลองหลวง", "ธัญบุรี", "ลำลูกกา"] },
  { name: "เชียงใหม่", districts: ["เมืองเชียงใหม่", "สันทราย", "หางดง", "แม่ริม"] },
  { name: "ชลบุรี", districts: ["เมืองชลบุรี", "ศรีราชา", "บางละมุง", "พนัสนิคม"] },
  { name: "ขอนแก่น", districts: ["เมืองขอนแก่น", "ชุมแพ", "น้ำพอง", "บ้านไผ่"] },
];

type ImgItem = { file: File; url: string };

type Errors = Partial<{
  title: string;
  category: string;
  price: string;
  images: string;
  province: string;
  district: string;
  phone: string;
}>;

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function FieldLabel({
  children,
  required,
  hint,
  extra,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-zinc-800">
        {children} {required && <span className="text-red-500">*</span>}
      </div>
      {hint && <div className="text-xs text-zinc-500">{hint}</div>}
      {extra}
    </div>
  );
}

function ErrorText({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="text-xs text-red-600 mt-1">{msg}</div>;
}

function Input({
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  hasError?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      type={type}
      className={cn(
        "w-full rounded-md border px-4 py-3 text-sm outline-none transition",
        hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-200"
          : "border-zinc-300 focus:ring-2 focus:ring-indigo-200"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
  disabled,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  hasError?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full rounded-md border px-4 py-3 text-sm outline-none transition bg-white",
        disabled ? "opacity-70 cursor-not-allowed" : "",
        hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-200"
          : "border-zinc-300 focus:ring-2 focus:ring-indigo-200"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catFromUrl = searchParams.get("cat") || "";

  // =========================
  // Mode 1: เลือกหมวด
  // =========================
  const goPick = (cat: string) => router.push(`/products/create?cat=${cat}`);
  const resetCat = () => router.push(`/products/create`);

  // Form values
  const [categoryKey, setCategoryKey] = useState(catFromUrl);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(""); // เก็บเป็น string เพื่อให้พิมพ์ง่าย
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [phone, setPhone] = useState("");

  // Images
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImgItem[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);

  // Sync category from URL (ถ้าผู้ใช้เลือกหมวดใหม่)
  useEffect(() => {
    setCategoryKey(catFromUrl);
    // รีเซ็ต error ที่เกี่ยวกับ category
    setErrors((e) => ({ ...e, category: undefined }));
  }, [catFromUrl]);

  const categoryOptions = useMemo(
    () => CREATE_CATEGORIES.map((c) => ({ value: c.key, label: `${c.emoji} ${c.name}` })),
    []
  );

  const provinceOptions = useMemo(
    () => PROVINCES.map((p) => ({ value: p.name, label: p.name })),
    []
  );

  const districtOptions = useMemo(() => {
    const p = PROVINCES.find((x) => x.name === province);
    return (p?.districts || []).map((d) => ({ value: d, label: d }));
  }, [province]);

  // Reset district when province changes
  useEffect(() => {
    setDistrict("");
  }, [province]);

  const pickFiles = () => fileInputRef.current?.click();

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return;

    const newOnes: ImgItem[] = [];
    const remaining = Math.max(0, 18 - images.length);

    for (let i = 0; i < files.length && newOnes.length < remaining; i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(f);
      newOnes.push({ file: f, url });
    }

    if (newOnes.length === 0) return;

    setImages((prev) => {
      const merged = [...prev, ...newOnes];
      return merged;
    });

    // clear input so selecting same file again works
    if (fileInputRef.current) fileInputRef.current.value = "";

    // clear image error if any
    setErrors((e) => ({ ...e, images: undefined }));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);

      const next = prev.filter((_, i) => i !== idx);

      // adjust coverIndex
      setCoverIndex((ci) => {
        if (next.length === 0) return 0;
        if (idx === ci) return 0;
        if (idx < ci) return Math.max(0, ci - 1);
        return ci;
      });

      return next;
    });
  };

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((it) => URL.revokeObjectURL(it.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPriceForDisplay = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return "";
    // add commas
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const validate = (): boolean => {
    const e: Errors = {};

    // category
    if (!categoryKey) e.category = "กรุณาเลือกหมวดหมู่";

    // title
    const t = title.trim();
    if (!t) e.title = "กรุณากรอกหัวข้อสินค้า";
    else if (t.length < 10) e.title = "หัวข้อควรมีอย่างน้อย 10 ตัวอักษร";
    else if (/[&*#^]/.test(t)) e.title = "ไม่ควรใส่อักขระพิเศษ เช่น & * # ^";

    // price
    const digits = price.replace(/[^\d]/g, "");
    if (!digits) e.price = "กรุณาระบุราคา";
    else {
      const n = Number(digits);
      if (!Number.isFinite(n) || n <= 0) e.price = "ราคาต้องเป็นตัวเลขมากกว่า 0";
    }

    // images
    if (images.length < 1) e.images = "กรุณาใส่รูปภาพอย่างน้อย 1 รูป (สูงสุด 18 รูป)";

    // location
    if (!province) e.province = "กรุณาเลือกจังหวัด";
    if (!district) e.district = "กรุณาเลือกอำเภอ";

    // phone
    const p = phone.replace(/\s|-/g, "");
    if (!p) e.phone = "กรุณากรอกเบอร์โทรศัพท์";
    else if (!/^0\d{9}$/.test(p)) e.phone = "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก (ขึ้นต้นด้วย 0)";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!validate()) {
      // scroll to first error-ish
      const first = document.querySelector("[data-error='true']");
      if (first instanceof HTMLElement) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // payload ที่เพื่อนเอาไปเสียบ DB ได้ง่าย
    const payload = {
      title: title.trim(),
      categoryKey,
      price: Number(price.replace(/[^\d]/g, "")),
      description: description.trim(),
      location: { province, district },
      phone: phone.replace(/\s|-/g, ""),
      images: images.map((it) => it.file), // ตอนนี้เป็น File[] (UI-only)
      coverIndex,
    };

    console.log("CREATE_PRODUCT_PAYLOAD", payload);
    alert("✅ ผ่าน validation แล้ว (ตอนนี้ยังเป็น UI-only)\nดู payload ได้ใน console");
  };

  const selectedCategoryLabel = useMemo(() => {
    const found = CREATE_CATEGORIES.find((c) => c.key === categoryKey);
    return found ? `${found.emoji} ${found.name}` : "";
  }, [categoryKey]);

  // =========================
  // MODE 1: ยังไม่เลือกหมวด
  // =========================
  if (!catFromUrl) {
    return (
      <main className="min-h-[calc(100vh-120px)] bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900">ลงประกาศใหม่</h1>
            <p className="text-zinc-600 mt-2">เลือกหมวดหมู่</p>
          </div>

          <div className="max-w-xl mx-auto mt-10 space-y-4">
            {CREATE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => goPick(c.key)}
                className="w-full bg-zinc-100 hover:bg-zinc-200 border border-zinc-200
                           rounded-lg px-5 py-4 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{c.emoji}</span>
                  <span className="font-semibold text-indigo-900">{c.name}</span>
                </div>
                <span className="text-zinc-400 text-xl">›</span>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // =========================
  // MODE 2: ฟอร์ม (เหมือน Kaidee)
  // =========================
  return (
    <main className="min-h-screen bg-zinc-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <div className="text-sm text-zinc-500">
            ลงประกาศใหม่ <span className="mx-2">/</span> <span className="text-zinc-800">{selectedCategoryLabel || catFromUrl}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2">ลงประกาศใหม่</h1>
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-zinc-200 rounded-xl">
          <div className="p-6 md:p-8 space-y-8">
            {/* row: title */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel required hint="ไม่ควรใส่อักขระพิเศษ เช่น & * # ^">
                หัวข้อสินค้าที่คุณต้องการลงขาย
              </FieldLabel>

              <div data-error={touched && !!errors.title ? "true" : "false"}>
                <Input
                  value={title}
                  onChange={setTitle}
                  placeholder="ชื่อสินค้า เช่น ไอโฟน X 64GB สภาพเหมือนใหม่"
                  hasError={touched && !!errors.title}
                />
                <ErrorText msg={touched ? errors.title : undefined} />
              </div>
            </div>

            {/* row: category */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel
                required
                hint="เลือกหมวดหมู่ให้ตรงกับสินค้า"
                extra={
                  <button
                    type="button"
                    onClick={resetCat}
                    className="text-xs font-semibold text-indigo-700 hover:underline mt-1"
                  >
                    กลับไปเลือกหมวดหมู่อื่น
                  </button>
                }
              >
                เลือกหมวดหมู่ให้ตรงกับสินค้า
              </FieldLabel>

              <div data-error={touched && !!errors.category ? "true" : "false"}>
                <Select
                  value={categoryKey}
                  onChange={(v) => {
                    setCategoryKey(v);
                    // sync URL ถ้าผู้ใช้เปลี่ยนใน dropdown
                    router.push(`/products/create?cat=${v}`);
                  }}
                  placeholder="เลือกหมวดหมู่"
                  options={categoryOptions}
                  hasError={touched && !!errors.category}
                />
                <ErrorText msg={touched ? errors.category : undefined} />
              </div>
            </div>

            {/* row: price */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel required hint="ระบุราคาเต็มของสินค้า/บริการ">
                ระบุราคาที่เหมาะสม
              </FieldLabel>

              <div data-error={touched && !!errors.price ? "true" : "false"}>
                <Input
                  value={formatPriceForDisplay(price)}
                  onChange={(v) => setPrice(v.replace(/[^\d]/g, ""))}
                  placeholder="ระบุราคา เช่น 15000"
                  inputMode="numeric"
                  hasError={touched && !!errors.price}
                />
                <ErrorText msg={touched ? errors.price : undefined} />
              </div>
            </div>

            {/* row: images */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel required hint="ใส่รูปได้สูงสุด 18 รูป">
                รูปภาพสินค้า
              </FieldLabel>

              <div data-error={touched && !!errors.images ? "true" : "false"}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onFilesSelected(e.target.files)}
                />

                <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold text-zinc-900">อัปโหลดรูปภาพ</div>
                      <div className="text-sm text-zinc-500 mt-1">
                        แนะนำให้ใช้รูปชัดเจน สว่าง และเห็นสินค้าชัด ๆ
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={pickFiles}
                      className="px-4 py-2 rounded-md bg-indigo-900 hover:bg-indigo-800 text-white font-semibold text-sm"
                    >
                      คลิกเลือกรูปภาพ
                    </button>
                  </div>

                  <div className="text-xs text-zinc-500 mt-3">
                    ใส่รูปได้สูงสุด <span className="font-semibold text-zinc-800">18</span> รูป
                    <span className="mx-2">•</span>
                    ตอนนี้เลือกแล้ว <span className="font-semibold text-zinc-800">{images.length}</span> รูป
                  </div>

                  {images.length > 0 && (
                    <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {images.map((it, idx) => (
                        <div key={it.url} className="relative group">
                          <button
                            type="button"
                            onClick={() => setCoverIndex(idx)}
                            className={cn(
                              "w-full aspect-square rounded-md overflow-hidden border bg-zinc-100",
                              idx === coverIndex ? "border-indigo-600 ring-2 ring-indigo-200" : "border-zinc-200"
                            )}
                            title={idx === coverIndex ? "รูปหน้าปก" : "ตั้งเป็นรูปหน้าปก"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.url} alt={`img-${idx}`} className="h-full w-full object-cover" />
                          </button>

                          {/* cover badge */}
                          {idx === coverIndex && (
                            <div className="absolute left-1 top-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-semibold">
                              หน้าปก
                            </div>
                          )}

                          {/* remove */}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-white border border-zinc-200
                                       grid place-items-center text-zinc-600 shadow-sm opacity-0 group-hover:opacity-100 transition"
                            title="ลบรูป"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ErrorText msg={touched ? errors.images : undefined} />
              </div>
            </div>

            {/* row: description */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel hint="ข้อมูลเพิ่มเติม เช่น สภาพสินค้า สี อายุการใช้งาน ระยะประกัน">
                รายละเอียดสินค้า
              </FieldLabel>

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-zinc-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="ข้อมูลเพิ่มเติม เช่น สภาพสินค้า สี อายุการใช้งาน ระยะประกัน"
                />
                <div className="text-xs text-zinc-500 mt-1 text-right">{Math.min(description.length, 2000)}/2000</div>
              </div>
            </div>

            {/* row: location */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel required hint="เลือกจังหวัดและอำเภอเพื่อความสะดวกในการค้นหา">
                ระบุพื้นที่ของสินค้า
              </FieldLabel>

              <div className="grid sm:grid-cols-2 gap-3" data-error={touched && (!!errors.province || !!errors.district) ? "true" : "false"}>
                <div>
                  <Select
                    value={province}
                    onChange={setProvince}
                    placeholder="เลือกจังหวัด"
                    options={provinceOptions}
                    hasError={touched && !!errors.province}
                  />
                  <ErrorText msg={touched ? errors.province : undefined} />
                </div>

                <div>
                  <Select
                    value={district}
                    onChange={setDistrict}
                    placeholder={province ? "เลือกอำเภอ" : "เลือกจังหวัดก่อน"}
                    options={districtOptions}
                    disabled={!province}
                    hasError={touched && !!errors.district}
                  />
                  <ErrorText msg={touched ? errors.district : undefined} />
                </div>
              </div>
            </div>

            {/* row: phone */}
            <div className="grid md:grid-cols-[280px_1fr] gap-4 md:gap-8">
              <FieldLabel
                required
                hint="กรุณาใส่เบอร์ที่คุณใช้สมัครสมาชิก เพื่อความปลอดภัยในการใช้งาน"
              >
                เบอร์โทรศัพท์ติดต่อ
              </FieldLabel>

              <div data-error={touched && !!errors.phone ? "true" : "false"}>
                <Input
                  value={phone}
                  onChange={setPhone}
                  placeholder="มือถือ เช่น 08XXXXXXXX"
                  inputMode="numeric"
                  hasError={touched && !!errors.phone}
                />
                <ErrorText msg={touched ? errors.phone : undefined} />
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-zinc-200 p-5 md:p-6 bg-zinc-50 rounded-b-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-xs text-zinc-500">
                คลิกปุ่ม <span className="font-semibold text-zinc-700">“ต่อไป”</span> เพื่อยอมรับ{" "}
                <span className="text-indigo-700 font-semibold">ข้อกำหนดและเงื่อนไข</span>
              </div>

              <button
                type="submit"
                className="md:w-52 w-full py-3 rounded-md bg-indigo-900 hover:bg-indigo-800 text-white font-semibold transition"
              >
                ต่อไป
              </button>
            </div>
          </div>
        </form>

        {/* small helper */}
        <div className="text-xs text-zinc-500 mt-4">
          * ตอนนี้เป็น UI-only ยังไม่ส่งขึ้นฐานข้อมูล (เพื่อนคุณจะเอาไปเชื่อม DB ต่อได้)
        </div>
      </div>
    </main>
  );
}