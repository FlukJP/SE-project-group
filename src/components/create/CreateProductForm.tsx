"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateCategory } from "@/src/data/categoriesData";
import { PROVINCES } from "@/src/data/provinces";
import ImageUploader, { UploadedImage } from "./ImageUploader";
import { FieldLabel, ErrorText, Input, Select } from "@/src/components/ui";
import { productApi } from "@/src/lib/api";

interface CreateProductFormProps {
    defaultCategoryKey: string;
    onChangeCategory?: (key: string) => void;
    onBackToPickCategory: () => void;
    categories: CreateCategory[];
}

// Renders the full product creation form including category, title, price, images, location, and contact fields
export default function CreateProductForm({
    defaultCategoryKey,
    onChangeCategory,
    onBackToPickCategory,
    categories,
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
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (defaultCategoryKey && defaultCategoryKey !== categoryKey) {
            setCategoryKey(defaultCategoryKey);
        }
        // Only react to prop changes, not internal categoryKey changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Validates all form fields and scrolls to the first error if any exist
    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!categoryKey) newErrors.category = "กรุณาเลือกหมวดหมู่";
        if (!title.trim()) newErrors.title = "กรุณากรอกหัวข้อประกาศ";
        if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0)
            newErrors.price = "ระบุราคาที่ถูกต้อง";
        if (!province) newErrors.province = "เลือกจังหวัด";
        if (!district) newErrors.district = "เลือกอำเภอ/เขต";
        if (!phone.trim()) newErrors.phone = "ระบุเบอร์โทรศัพท์";
        else if (!/^0\d{9}$/.test(phone.replace(/\D/g, "")))
            newErrors.phone = "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0";
        if (images.length === 0) newErrors.images = "เพิ่มรูปอย่างน้อย 1 รูป";

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            const firstKey = Object.keys(newErrors)[0];
            const ref = refs[firstKey as keyof typeof refs] as React.RefObject<HTMLDivElement | null>;
            if (ref && ref.current) {
                ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
                ref.current.focus && ref.current.focus();
            }
            return false;
        }
        return true;
    };

    // Validates and submits the product form data as multipart/form-data, then redirects on success
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        if (!validate()) return;
        setSubmitting(true);
        setSubmitError("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("categoryKey", categoryKey);
            formData.append("province", province);
            formData.append("district", district);
            formData.append("phone", phone);
            images.forEach((img) => {
                formData.append("images", img.file);
            });
            formData.append("coverIndex", String(coverIndex));

            await productApi.create(formData);
            router.push("/");
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setSubmitting(false);
        }
    };

    // Syncs the selected category key to local state and notifies the parent
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
                    {categories.map((c) => (
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
                    maxLength={255}
                    placeholder="ชื่อสินค้า เช่น ไอโฟน X 64GB สภาพเหมือนใหม่"
                />
                <div className="text-xs text-zinc-400 text-right mt-1">{title.length}/255</div>
                {errors.title && <ErrorText>{errors.title}</ErrorText>}
            </div>

            <div ref={refs.price}>
                <FieldLabel>ระบุราคาที่เหมาะสม *</FieldLabel>
                <Input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d+(\.\d{0,2})?$/.test(val)) {
                            setPrice(val);
                        }
                    }}
                    placeholder="ระบุราคา (บาท)"
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
                    maxLength={2000}
                    rows={5}
                    className="w-full border border-zinc-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-indigo-200"
                    placeholder="ข้อมูลเพิ่มเติม เช่น สภาพสินค้า สี อายุการใช้งาน"
                />
                <div className="text-xs text-zinc-400 text-right mt-1">{description.length}/2000</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div ref={refs.province}>
                    <FieldLabel>จังหวัด *</FieldLabel>
                    <Select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict(""); }}>
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

            {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
                    {submitError}
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-3 rounded-md transition disabled:opacity-50"
            >
                {submitting ? "กำลังส่ง..." : "ต่อไป"}
            </button>
        </form>
    );
}
