"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CreateCategory } from "@/src/data/categoriesData";
import { PROVINCES } from "@/src/data/provinces";
import ImageUploader, { UploadedImage } from "./ImageUploader";
import {
    ErrorText,
    FieldLabel,
    FormErrorNotice,
    Input,
    Select,
    TextareaField,
} from "@/src/components/ui";
import { getFormFieldClassName } from "@/src/components/ui/formFieldStyles";
import { productApi } from "@/src/lib/api";

interface CreateProductFormProps {
    defaultCategoryKey: string;
    onChangeCategory?: (key: string) => void;
    onBackToPickCategory: () => void;
    categories: CreateCategory[];
    sellerPhone: string;
}

const PRICE_INPUT_PATTERN = /^\d+(\.\d{0,2})?$/;

// Renders the full product creation form including category, title, price, images, location, and contact fields
export default function CreateProductForm({
    defaultCategoryKey,
    onChangeCategory,
    onBackToPickCategory,
    categories,
    sellerPhone,
}: CreateProductFormProps) {
    const [categoryKey, setCategoryKey] = useState(defaultCategoryKey);
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
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
    }, [defaultCategoryKey, categoryKey]);

    const provinceOptions = useMemo(() => PROVINCES.map((province) => ({ value: province.name, label: province.name })), []);
    const districtOptions = useMemo(() => {
        const matchedProvince = PROVINCES.find((item) => item.name === province);
        if (!matchedProvince) return [];
        return matchedProvince.districts.map((district) => ({ value: district, label: district }));
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
        const nextErrors: Record<string, string> = {};

        if (!categoryKey) nextErrors.category = "กรุณาเลือกหมวดหมู่";
        if (!title.trim()) nextErrors.title = "กรุณากรอกหัวข้อประกาศ";
        if (!price.trim() || !PRICE_INPUT_PATTERN.test(price) || Number.isNaN(Number(price)) || Number(price) <= 0) {
            nextErrors.price = "ระบุราคาที่ถูกต้อง";
        }
        if (!province) nextErrors.province = "เลือกจังหวัด";
        if (!district) nextErrors.district = "เลือกอำเภอ/เขต";
        if (!sellerPhone.trim()) nextErrors.phone = "กรุณาเพิ่มเบอร์โทรในโปรไฟล์ก่อนลงขายสินค้า";
        else if (!/^0\d{9}$/.test(sellerPhone.replace(/\D/g, ""))) {
            nextErrors.phone = "เบอร์โทรในโปรไฟล์ต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0";
        }
        if (images.length === 0) nextErrors.images = "เพิ่มรูปอย่างน้อย 1 รูป";

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            const firstKey = Object.keys(nextErrors)[0];
            const ref = refs[firstKey as keyof typeof refs] as React.RefObject<HTMLDivElement | null>;
            if (ref?.current) {
                ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
                ref.current.focus?.();
            }
            return false;
        }

        return true;
    };

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
            formData.append("phone", sellerPhone);
            images.forEach((image) => {
                formData.append("images", image.file);
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

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value;
        setCategoryKey(key);
        onChangeCategory?.(key);
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
            <button
                type="button"
                onClick={onBackToPickCategory}
                className="mb-2 text-sm text-[#D9734E] transition-colors hover:underline"
            >
                ← เปลี่ยนหมวดหมู่
            </button>

            <div ref={refs.category}>
                <FieldLabel>หมวดหมู่ *</FieldLabel>
                <Select aria-label="เลือกหมวดหมู่" value={categoryKey} onChange={handleCategoryChange}>
                    <option value="">-- เลือกหมวด --</option>
                    {categories.map((category) => (
                        <option key={category.key} value={category.key}>
                            {category.name}
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
                <div className="mt-1 text-right text-xs text-[#A89F91]">{title.length}/255</div>
                {errors.title && <ErrorText>{errors.title}</ErrorText>}
            </div>

            <div ref={refs.price}>
                <FieldLabel>ระบุราคาที่เหมาะสม *</FieldLabel>
                <Input
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
                <TextareaField
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    textareaClassName={getFormFieldClassName({ size: "md" })}
                    placeholder="ข้อมูลเพิ่มเติม เช่น สภาพสินค้า สี อายุการใช้งาน"
                />
                <div className="mt-1 text-right text-xs text-[#A89F91]">{description.length}/2000</div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div ref={refs.province}>
                    <FieldLabel>จังหวัด *</FieldLabel>
                    <Select
                        aria-label="เลือกจังหวัด"
                        value={province}
                        onChange={(e) => {
                            setProvince(e.target.value);
                            setDistrict("");
                        }}
                    >
                        <option value="">-- เลือกจังหวัด --</option>
                        {provinceOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    {errors.province && <ErrorText>{errors.province}</ErrorText>}
                </div>

                <div ref={refs.district}>
                    <FieldLabel>อำเภอ/เขต *</FieldLabel>
                    <Select
                        aria-label="เลือกอำเภอ/เขต"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        disabled={!province}
                    >
                        <option value="">-- เลือกอำเภอ/เขต --</option>
                        {districtOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    {errors.district && <ErrorText>{errors.district}</ErrorText>}
                </div>
            </div>

            <div ref={refs.phone}>
                <FieldLabel>เบอร์โทรศัพท์ติดต่อ *</FieldLabel>
                <Input
                    value={sellerPhone}
                    readOnly
                    className="cursor-not-allowed bg-[#F9F6F0] text-[#6E6258]"
                />
                <p className="mt-1 text-xs text-[#A89F91]">ใช้เบอร์โทรจากโปรไฟล์ผู้ขาย หากต้องการเปลี่ยนให้แก้ไขที่หน้าโปรไฟล์ก่อน</p>
                {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
            </div>

            {submitError && <FormErrorNotice message={submitError} />}

            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-indigo-900 py-3 font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-50"
            >
                {submitting ? "กำลังส่ง..." : "ต่อไป"}
            </button>
        </form>
    );
}
