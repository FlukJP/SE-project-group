import React, { useState, useRef, useMemo, useEffect } from "react";
import { CREATE_CATEGORIES, CreateCategory } from "@/components/categoriesData";
import { PROVINCES } from "./provinces";
import ImageUploader, { UploadedImage } from "./ImageUploader";
import { FieldLabel, ErrorText, Input, Select } from "./ui";

interface CreateProductFormProps {
  defaultCategoryKey: string;
  onChangeCategory?: (key: string) => void;
  onBackToPickCategory: () => void;
}

export default function CreateProductForm({
  defaultCategoryKey,
  onChangeCategory,
  onBackToPickCategory,
}: CreateProductFormProps) {
  const [categoryKey, setCategoryKey] = useState(defaultCategoryKey);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // sync defaultCategoryKey into state
  useEffect(() => {
    if (defaultCategoryKey && defaultCategoryKey !== categoryKey) {
      setCategoryKey(defaultCategoryKey);
    }
  }, [defaultCategoryKey]);

  const provinceOptions = useMemo(
    () => PROVINCES.map((p) => ({ value: p.name, label: p.name })),
    []
  );

  const districtOptions = useMemo(() => {
    const p = PROVINCES.find((x) => x.name === province);
    if (!p) return [];
    return p.districts.map((d) => ({ value: d, label: d }));
  }, [province]);

  const refs = {
    category: useRef<HTMLDivElement>(null),
    title: useRef<HTMLDivElement>(null),
    price: useRef<HTMLDivElement>(null),
    province: useRef<HTMLDivElement>(null),
    district: useRef<HTMLDivElement>(null),
    phone: useRef<HTMLDivElement>(null),
    images: useRef<HTMLDivElement>(null),
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!categoryKey) newErrors.category = "กรุณาเลือกหมวดหมู่";
    if (!title.trim()) newErrors.title = "กรุณากรอกหัวข้อประกาศ";
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
      newErrors.price = "ระบุราคาที่ถูกต้อง";
    if (!province) newErrors.province = "เลือกจังหวัด";
    if (!district) newErrors.district = "เลือกอำเภอ/เขต";
    if (!phone.trim()) newErrors.phone = "ระบุเบอร์โทรศัพท์";
    if (images.length === 0) newErrors.images = "เพิ่มรูปอย่างน้อย 1 รูป";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const ref = refs[firstKey as keyof typeof refs] as any;
      if (ref && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        ref.current.focus && ref.current.focus();
      }
      return false;
    }
    return true;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      categoryKey,
      title,
      price: Number(price),
      description,
      phone,
      province,
      district,
      images,
      coverIndex,
    };
    console.log("submitting:", payload);
    alert("ส่งข้อมูลเรียบร้อย (mock)");
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setCategoryKey(key);
    onChangeCategory && onChangeCategory(key);
  };

  return (
    <form onSubmit={onSubmit} className="bg-white p-6 rounded-xl shadow-sm space-y-6">
      <button
        type="button"
        onClick={onBackToPickCategory}
        className="text-sm text-emerald-700 hover:underline mb-2"
      >
        ← เปลี่ยนหมวดหมู่
      </button>

      <div ref={refs.category}>
        <FieldLabel>หมวดหมู่ *</FieldLabel>
        <Select value={categoryKey} onChange={handleCategoryChange}>
          <option value="">-- เลือกหมวด --</option>
          {CREATE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        {errors.category && <ErrorText>{errors.category}</ErrorText>}
      </div>

      <div ref={refs.title}>
        <FieldLabel>หัวข้อสินค้าที่คุณต้องการลงขาย *</FieldLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่อสินค้า เช่น ไอโฟน X 64GB สภาพเหมือนใหม่"
        />
        {errors.title && <ErrorText>{errors.title}</ErrorText>}
      </div>

      <div ref={refs.price}>
        <FieldLabel>ระบุราคาที่เหมาะสม *</FieldLabel>
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="ระบุราคา"
        />
        {errors.price && <ErrorText>{errors.price}</ErrorText>}
      </div>

      <div>
        <FieldLabel>รูปภาพสินค้า *</FieldLabel>
        <div ref={refs.images}>
          <ImageUploader
            images={images}
            setImages={setImages}
            coverIndex={coverIndex}
            setCoverIndex={setCoverIndex}
            error={errors.images}
          />
        </div>
      </div>

      <div>
        <FieldLabel>รายละเอียดสินค้า</FieldLabel>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="w-full border border-zinc-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-200"
          placeholder="ข้อมูลเพิ่มเติม เช่น สภาพสินค้า สี อายุการใช้งาน"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={refs.province}>
          <FieldLabel>จังหวัด *</FieldLabel>
          <Select value={province} onChange={(e) => setProvince(e.target.value)}>
            <option value="">-- เลือกจังหวัด --</option>
            {provinceOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          {errors.province && <ErrorText>{errors.province}</ErrorText>}
        </div>
        <div ref={refs.district}>
          <FieldLabel>อำเภอ/เขต *</FieldLabel>
          <Select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={!province}
          >
            <option value="">-- เลือกอำเภอ/เขต --</option>
            {districtOptions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
          {errors.district && <ErrorText>{errors.district}</ErrorText>}
        </div>
      </div>

      <div ref={refs.phone}>
        <FieldLabel>เบอร์โทรศัพท์ติดต่อ *</FieldLabel>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08XXXXXXXX"
        />
        {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-3 rounded-md transition"
      >
        ต่อไป
      </button>
    </form>
  );
}
