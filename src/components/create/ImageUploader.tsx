"use client";

import { useRef, useEffect, type Dispatch, type SetStateAction, type ChangeEvent } from "react";
import { cn } from "@/src/components/ui";

export interface UploadedImage {
    file: File;
    url: string;
}

interface ImageUploaderProps {
    images: UploadedImage[];
    setImages: Dispatch<SetStateAction<UploadedImage[]>>;
    coverIndex: number;
    setCoverIndex: (n: number) => void;
    error?: string;
    max?: number;
}

// Renders an image picker with preview thumbnails, cover selection, and removal; enforces file size and count limits
export default function ImageUploader({
    images,
    setImages,
    coverIndex,
    setCoverIndex,
    error,
    max = 18,
}: ImageUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const imagesRef = useRef(images);
    imagesRef.current = images;

    // Only revoke all URLs on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url));
        };
    }, []);

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    // Validates selected files against size and count limits, then appends them to the image list
    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const arr = Array.from(files);
        const valid = arr.filter((file) => {
            if (file.size > MAX_FILE_SIZE) {
                alert(`ไฟล์ "${file.name}" มีขนาดเกิน 5MB`);
                return false;
            }
            return true;
        });
        const toAdd = valid.slice(0, max - images.length).map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...toAdd]);
        e.target.value = "";
    };

    // Removes an image by index and adjusts the cover index to remain valid
    const removeImage = (idx: number) => {
        setImages((prev) => {
            const removed = prev[idx];
            URL.revokeObjectURL(removed.url);
            const next = prev.filter((_, i) => i !== idx);
            if (next.length === 0) {
                setCoverIndex(0);
            } else if (coverIndex >= next.length) {
                setCoverIndex(next.length - 1);
            } else if (idx < coverIndex) {
                setCoverIndex(coverIndex - 1);
            }
            return next;
        });
    };

    // Triggers the hidden file input to open the file picker dialog
    const openFilePicker = () => {
        inputRef.current?.click();
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                    <div
                        key={img.url}
                        className={cn(
                            "relative w-24 h-24 rounded-lg overflow-hidden border",
                            idx === coverIndex ? "border-emerald-600" : "border-zinc-200"
                        )}
                    >
                        <img
                            src={img.url}
                            alt="preview"
                            className="object-cover w-full h-full"
                            onClick={() => setCoverIndex(idx)}
                        />
                        <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-xs text-red-600"
                        >
                            ×
                        </button>
                        {idx === coverIndex && (
                            <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[10px] px-1 rounded">
                                ปก
                            </span>
                        )}
                    </div>
                ))}
                {images.length < max && (
                    <button
                        type="button"
                        onClick={openFilePicker}
                        className="w-24 h-24 flex items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 hover:bg-zinc-100"
                    >
                        +
                    </button>
                )}
            </div>
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            <input
                type="file"
                accept="image/*"
                multiple
                ref={inputRef}
                className="hidden"
                onChange={onFileChange}
                aria-label="อัปโหลดรูปภาพ"
            />
        </div>
    );
}
