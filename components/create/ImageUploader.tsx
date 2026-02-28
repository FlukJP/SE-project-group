import React, { useRef, useEffect } from "react";
import { cn } from "./ui";

export interface UploadedImage {
  file: File;
  url: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  setImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  coverIndex: number;
  setCoverIndex: (n: number) => void;
  error?: string;
  max?: number;
}

export default function ImageUploader({
  images,
  setImages,
  coverIndex,
  setCoverIndex,
  error,
  max = 18,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // revoke URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [images]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files);
    const toAdd = arr.slice(0, max - images.length).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev: UploadedImage[]) => [...prev, ...toAdd]);
    // clear input so same file can be selected again
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev: UploadedImage[]) => {
      const removed = prev[idx];
      URL.revokeObjectURL(removed.url);
      const next = prev.filter((_: UploadedImage, i: number) => i !== idx);
      if (coverIndex >= next.length) {
        setCoverIndex(next.length - 1);
      }
      return next;
    });
  };

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
      />
    </div>
  );
}
