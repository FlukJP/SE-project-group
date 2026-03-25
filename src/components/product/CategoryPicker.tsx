import type { CreateCategory } from "@/src/data/categoriesData";

interface CategoryPickerProps {
    categories: CreateCategory[];
    onPick: (key: string) => void;
}

// Renders a list of category buttons for the user to select before creating a listing
export default function CategoryPicker({ categories, onPick }: CategoryPickerProps) {
    return (
        <main className="min-h-[calc(100vh-120px)] bg-[#F9F6F0]">
            <div className="container mx-auto px-4 py-10">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-[#4A3B32]">ลงประกาศใหม่</h1>
                    <p className="text-[#A89F91] mt-2">เลือกหมวดหมู่</p>
                </div>

                <div className="max-w-xl mx-auto mt-10 space-y-4">
                    {categories.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onPick(c.key)}
                            className="w-full bg-white hover:bg-[#E6D5C3] border border-[#DCD0C0]
                rounded-lg px-5 py-4 flex items-center justify-between transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{c.emoji}</span>
                                <span className="font-semibold text-[#4A3B32]">{c.name}</span>
                            </div>
                            <span className="text-[#A89F91] text-xl">›</span>
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}
