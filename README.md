# Kaidee-like — ตลาดมือสองออนไลน์

แพลตฟอร์มซื้อขายสินค้ามือสองและของใหม่แบบออนไลน์ พัฒนาด้วย Next.js และ Express.js รองรับการค้นหาง่าย ราคาโดนใจ และการสนทนาแบบเรียลไทม์

## 🚀 ฟีเจอร์หลัก

### ผู้ใช้งานทั่วไป
- **🔐 ระบบสมัครสมาชิกและเข้าสู่ระบบ** - ยืนยันตัวตนผ่านอีเมลและเบอร์โทรศัพท์
- **📱 โปรไฟล์ผู้ใช้** - จัดการข้อมูลส่วนตัว รูปภาพ และประวัติการซื้อขาย
- **📦 ลงประกาศสินค้า** - อัปโหลดรูปภาพ กำหนดราคา และรายละเอียดสินค้า
- **🔍 ค้นหาสินค้า** - ค้นหาตามชื่อ หมวดหมู่ และจังหวัด
- **💬 แชทแบบเรียลไทม์** - สนทนากับผู้ขายโดยตรงผ่าน Socket.IO
- **⭐ ระบบรีวิวและคะแนน** - ให้คะแนนและรีวิวผู้ซื้อ/ขาย
- **📋 การจัดการคำสั่งซื้อ** - ติดตามสถานะการสั่งซื้อและการทำรายการ

### ผู้ดูแลระบบ
- **👥 จัดการผู้ใช้** - ดูรายชื่อ แบน และจัดการสิทธิ์ผู้ใช้
- **📊 แดชบอร์ด** - สถิติการใช้งานและข้อมูลสำคัญ
- **🏷️ จัดการหมวดหมู่** - เพิ่ม แก้ไข และลบหมวดหมู่สินค้า
- **🚨 ระบบรายงาน** - ตรวจสอบรายงานผู้ใช้และสินค้าที่ไม่เหมาะสม

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- **Next.js 16** - React Framework พร้อม SSR และ App Router
- **TypeScript** - Type Safety สำหรับการพัฒนา
- **TailwindCSS** - CSS Framework สำหรับการออกแบบที่ทันสมัย
- **Socket.IO Client** - การสื่อสารแบบเรียลไทม์

### Backend
- **Express.js** - Web Server Framework
- **Socket.IO** - Real-time communication server
- **MySQL** - ฐานข้อมูลหลัก
- **Redis** - Caching และ Session Management
- **Firebase** - Authentication และ File Storage
- **JWT** - Token-based Authentication

### Development Tools
- **ESLint** - Code Linting
- **Vitest** - Unit Testing
- **Nodemon** - Auto-reload สำหรับ Development

## 📋 ความต้องการพื้นฐาน

- **Node.js** 18.0 หรือสูงกว่า
- **MySQL** 8.0 หรือสูงกว่า
- **Redis** 6.0 หรือสูงกว่า (ถ้าต้องการ caching)
- **Firebase Project** (สำหรับ Authentication และ Storage)

## 🚀 การติดตั้ง

### 1. Clone Repository
```bash
git clone <repository-url>
cd SoftwareEngineerProject
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์รากของโปรเจกต์:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=marketplace_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_ISSUER=your_app_name
JWT_AUDIENCE=your_app_users

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_DATABASE_URL=your_firebase_database_url

# Client Configuration
CLIENT_URL=http://localhost:3000,http://localhost:3001

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. ตั้งค่าฐานข้อมูล MySQL

สร้างฐานข้อมูล:
```sql
CREATE DATABASE marketplace_db;
```

รัน Migration files:
```bash
# รัน migration files ในโฟลเดอร์ migrations/
mysql -u root -p marketplace_db < migrations/add_unique_constraints.sql
mysql -u root -p marketplace_db < migrations/add_location_to_product.sql
```

### 5. ตั้งค่า Firebase

1. สร้างโปรเจกต์ใน [Firebase Console](https://console.firebase.google.com/)
2. เปิดใช้งาน Authentication และ Cloud Storage
3. ดาวน์โหลด Service Account Key และวางใน `firebase-service-account.json`
4. ตั้งค่า Firebase SDK ในโปรเจกต์

### 6. รัน Development Servers

เริ่มทั้ง Frontend และ Backend พร้อมกัน:
```bash
npm run dev
```

หรือรันแยกกัน:

```bash
# Backend Server (Port 5000)
npm run dev:server

# Frontend Server (Port 3000)
npm run dev:next
```

## 📁 โครงสร้างโปรเจกต์

```
SoftwareEngineerProject/
├── src/
│   ├── app/                    # Next.js App Router (Frontend)
│   │   ├── (admin)/           # Admin pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (main)/            # Main application pages
│   │   ├── globals.css        # Global styles
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   ├── controllers/           # Express controllers
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── services/             # Business logic services
│   ├── middleware/           # Express middleware
│   ├── contexts/             # React contexts
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── server.ts             # Express server entry point
├── migrations/               # Database migration files
├── public/                   # Static files
└── package.json             # Project dependencies
```

## 🧪 การทดสอบ

รัน Unit Tests:
```bash
npm test
```

## 📦 การ Build สำหรับ Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🔧 สคริปต์ที่มีใช้

- `npm run dev` - เริ่มทั้ง frontend และ backend ในโหมด development
- `npm run dev:server` - เริ่มเฉพาะ backend server
- `npm run dev:next` - เริ่มเฉพาะ frontend server
- `npm run build` - Build frontend สำหรับ production
- `npm start` - เริ่ม production server
- `npm test` - รัน tests
- `npm run lint` - รัน ESLint

## 🌐 การเข้าถึงแอปพลิเคชัน

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Documentation**: [http://localhost:5000/api](http://localhost:5000/api)

## 📝 API Endpoints หลัก

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - ดูรายการสินค้า
- `GET /api/products/:id` - ดูรายละเอียดสินค้า
- `POST /api/products` - สร้างประกาศสินค้าใหม่
- `PUT /api/products/:id` - แก้ไขสินค้า
- `DELETE /api/products/:id` - ลบสินค้า

### Users
- `GET /api/users/profile` - ดูโปรไฟล์
- `PUT /api/users/profile` - แก้ไขโปรไฟล์
- `GET /api/users/:id/products` - ดูสินค้าของผู้ใช้

### Chat
- `GET /api/chat` - ดูรายการแชท
- `POST /api/chat` - สร้างแชทใหม่
- `GET /api/chat/:id/messages` - ดูข้อความในแชท

## 🤝 การมีส่วนร่วม

1. Fork โปรเจกต์
2. สร้าง feature branch (`git checkout -b feature/amazing-feature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add amazing feature'`)
4. Push ไปยัง branch (`git push origin feature/amazing-feature`)
5. เปิด Pull Request

## 📄 License

โปรเจกต์นี้ใช้สัญญาอนุญาต MIT - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)
