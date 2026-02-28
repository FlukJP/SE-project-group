import { Product } from "@/types/Product";

// simple array of sample products to drive UI; IDs are strings so they map directly to route param
export const products: Product[] = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - สภาพดีมาก",
    price: 24900,
    images: [
      "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1563199157-89eae14f9eec?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=60",
    ],
    location: "กรุงเทพมหานคร",
    postedAt: "2026-03-01T10:30:00Z",
    description:
      "ขาย iPhone 14 Pro Max 256GB สีดำ สภาพใหม่ ไม่เคยตก น้ำหนักน้อย แบตเตอรี่ 100% อุปกรณ์ครบกล่อง มีใบเสร็จซื้อจาก Apple Store กทม.",
    categoryKey: "phones",
    seller: {
      id: "u1",
      name: "นาย กาแฟ",
      avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      phone: "08x-xxx-xxxx",
    },
  },
  {
    id: "2",
    title: "โต๊ะไม้สัก ขนาด 1.5 เมตร",
    price: 4500,
    images: [
      "https://images.unsplash.com/photo-1601237242693-27b9f37c5f70?auto=format&fit=crop&w=800&q=60",
      "https://images.unsplash.com/photo-1581265226046-0ebd319e5a9c?auto=format&fit=crop&w=800&q=60",
    ],
    location: "นนทบุรี",
    postedAt: "2026-02-27T14:00:00Z",
    description:
      "โต๊ะไม้สักมือสอง ใช้งานปกติ ขนาด 150x75 ซม. เหมาะสำหรับวางคอมพิวเตอร์หรือทำงานไม้ ตัวหนา แข็งแรง รอยเล็กน้อยตามการใช้งาน",
    categoryKey: "furniture",
    seller: {
      id: "u2",
      name: "นาง ส้มตำ",
      avatarUrl: "https://randomuser.me/api/portraits/women/45.jpg",
      phone: "09x-xxx-xxxx",
    },
  },
];
