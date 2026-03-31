# KMUTNB2Market

KMUTNB2Market is a second-hand marketplace platform built with Next.js, Express, MySQL, Redis, Socket.IO, and Firebase Storage. It supports product listings, real-time chat, OTP-based verification, user moderation, profile management, and an admin workflow for reports and content review.

## Features

### User Features
- Register and sign in with email and phone verification
- Edit profile information, including username, address, email, phone number, and profile image
- Re-verify email or phone with OTP whenever contact details change
- Upload and crop profile images before saving
- Create, edit, search, and manage product listings
- Upload product images to Firebase Storage
- Set product prices with up to 2 decimal places
- Start real-time chats between buyers and sellers
- Use automatic reply messages in chat
- View history for buying, selling, reviews, and recent chat activity
- Leave reviews and ratings after transactions

### Admin Features
- Review dashboard data for users, products, and reports
- Manage product categories
- Ban and unban users or products
- Open reported products and reported user profiles directly from the reports page
- Filter reports by `all`, `product`, or `user` for faster moderation

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- SWR
- Socket.IO Client

### Backend
- Express 5
- MySQL 8
- Redis
- Socket.IO
- Firebase Admin SDK
- JWT authentication
- Resend email delivery

### Tooling
- ESLint
- Vitest
- Nodemon
- ts-node

## Requirements

- Node.js 18 or later
- MySQL 8 or later
- Redis
- Firebase project with Cloud Storage enabled
- Resend account for email OTP delivery

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd SoftwareEngineerProject
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

Copy `.env.example` to `.env` or create a new `.env` file in the project root.

Example local development configuration:

```env
NODE_ENV=development
PORT=5000

CLIENT_URL=http://localhost:3000
CLIENT_URLS=http://localhost:3000,http://localhost:3001

JWT_SECRET=your-access-token-secret
JWT_ISSUER=kmutnb2market
JWT_AUDIENCE=kmutnb2market-users
JWT_EXPIRES_IN=3600
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

OTP_EXPIRY=300

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=marketplace_db
DB_SSL_CA=ca.pem

REDIS_URL=redis://127.0.0.1:6379

RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=Marketplace <onboarding@resend.dev>

FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app

NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

PRODUCT_MAX_SIZE=5
USER_MAX_SIZE=2
```

### Environment Notes

- `NEXT_PUBLIC_SOCKET_URL` is optional. If left empty, the frontend reuses `NEXT_PUBLIC_API_URL`.
- `CLIENT_URLS` lets the backend accept multiple allowed frontend origins.
- `FIREBASE_SERVICE_ACCOUNT` is the preferred server-side Firebase credential.
- `FIREBASE_STORAGE_BUCKET` should be set explicitly for reliable media uploads.
- `PRODUCT_MAX_SIZE` and `USER_MAX_SIZE` are upload limits in megabytes.
- Never commit real secrets to the repository.

## Database Setup

### 1. Create the database

```sql
CREATE DATABASE marketplace_db;
```

### 2. Run the SQL schema and migrations

Run the base schema first, then apply the migration files in the `migrations/` directory that your environment still needs.

Example:

```bash
mysql -u root -p marketplace_db < AivenDBmarket.session.sql
mysql -u root -p marketplace_db < migrations/add_unique_constraints.sql
mysql -u root -p marketplace_db < migrations/add_location_to_product.sql
mysql -u root -p marketplace_db < migrations/add_auto_reply_message_to_user.sql
```

If your database already contains some of these changes, only run the missing migrations.

## Firebase Setup

1. Create a Firebase project.
2. Enable Cloud Storage.
3. Create a service account with access to Storage.
4. Put the service account JSON into `FIREBASE_SERVICE_ACCOUNT`.
5. Set `FIREBASE_STORAGE_BUCKET` to your bucket hostname, such as `your-project.firebasestorage.app` or `your-project.appspot.com`.

Product images and profile images are stored in Firebase Storage.

## Run the App

### Start frontend and backend together

```bash
npm run dev
```

### Start them separately

```bash
npm run dev:server
npm run dev:next
```

## Available Scripts

- `npm run dev` starts the backend and frontend together
- `npm run dev:server` starts the Express backend
- `npm run dev:next` starts the Next.js frontend
- `npm run build` builds the frontend for production
- `npm start` starts the production frontend server
- `npm test` runs Vitest
- `npm run lint` runs ESLint

## Project Structure

```text
SoftwareEngineerProject/
|-- src/
|   |-- app/                # Next.js App Router pages
|   |-- components/         # Reusable React components
|   |-- config/             # Environment and service configuration
|   |-- contexts/           # React context providers
|   |-- controllers/        # Express controllers
|   |-- lib/                # Shared client/server utilities
|   |-- middleware/         # Express middleware
|   |-- models/             # Database access layer
|   |-- routes/             # API route definitions
|   |-- services/           # Business logic
|   |-- tests/              # Vitest test files
|   |-- types/              # Shared TypeScript types
|   |-- utils/              # Helper utilities
|   `-- server.ts           # Express entry point
|-- migrations/             # SQL migrations
|-- public/                 # Static assets
|-- package.json
`-- README.md
```

## Core Application Flows

### Authentication and Verification
- JWT access and refresh tokens
- Email OTP verification
- Phone OTP verification
- Re-verification required after changing email or phone number

### Product Management
- Create product listings with images, location, category, and condition
- Edit products without losing existing images
- Use seller profile phone number as the contact number for listings
- Validate prices with up to 2 decimal places

### Messaging
- Real-time buyer-seller chat through Socket.IO
- Recent chat preview in the navbar
- Unread count support
- Automatic reply message support

### Moderation
- Report products and users
- Open the target item or user profile directly from admin reports
- Filter reports by target type for faster review
- Ban and unban users or products

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

## API Routes Overview

Base URL ของ API คือ `http://localhost:5000/api`

หมายเหตุ:
- `Auth` = ต้องส่ง `Authorization: Bearer <access_token>`
- `Verified` = ผู้ใช้ต้องยืนยันตัวตนแล้ว
- `Admin` = ต้องเป็นผู้ดูแลระบบ
- endpoint อัปโหลดไฟล์ใช้ `multipart/form-data`

### System

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | ตรวจสอบสถานะของ server และ Redis |

### Authentication

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `username`, `email`, `password`, `phone` | สมัครสมาชิกและส่ง OTP ไปยืนยันอีเมล |
| POST | `/api/auth/login` | Public | `email`, `password` | เข้าสู่ระบบและรับ `access_token` พร้อม refresh token cookie |
| POST | `/api/auth/refresh-token` | Public | `refresh_token` หรือ cookie | ขอ access token ใหม่ |
| POST | `/api/auth/request-otp` | Public | `email` | ขอ OTP สำหรับยืนยันอีเมล |
| POST | `/api/auth/verify-otp` | Public | `email`, `otp` | ยืนยัน OTP อีเมลและออก token ใหม่ |
| POST | `/api/auth/request-phone-otp` | Public | `phone` | ขอ OTP สำหรับยืนยันเบอร์โทร |
| POST | `/api/auth/verify-phone-otp` | Public | `phone`, `otp` | ยืนยัน OTP เบอร์โทรและออก token ใหม่ |
| POST | `/api/auth/verify-phone-firebase` | Public | `idToken` | ยืนยันเบอร์โทรผ่าน Firebase |
| POST | `/api/auth/reset-password` | Public | `email`, `otp`, `newPassword` | รีเซ็ตรหัสผ่านด้วย OTP |
| POST | `/api/auth/logout` | Auth | - | ออกจากระบบและล้าง refresh token |
| POST | `/api/auth/change-password` | Auth | `oldPassword`, `newPassword` | เปลี่ยนรหัสผ่านของผู้ใช้ปัจจุบัน |

### Users

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/users/me` | Auth | - | ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ |
| PUT | `/api/users/me` | Auth | `Username`, `Email`, `Phone_number`, `Address`, `Auto_Reply_Message` | แก้ไขข้อมูลโปรไฟล์ |
| PUT | `/api/users/me/avatar` | Auth | file `avatar` | อัปโหลดหรือเปลี่ยนรูปโปรไฟล์ |
| GET | `/api/users/:id` | Public | path `id` | ดู public profile ของผู้ใช้ |

### Products

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/products` | Public | query `q`, `category`, `minPrice`, `maxPrice`, `page`, `limit`, `sortBy`, `sortOrder`, `province`, `district`, `excludeSeller` | ดึงรายการสินค้า พร้อมค้นหา กรอง เรียง และแบ่งหน้า |
| GET | `/api/products/seller/:sellerId` | Public | path `sellerId` | ดึงสินค้าทั้งหมดของผู้ขายรายหนึ่ง |
| GET | `/api/products/:id` | Public | path `id` | ดูรายละเอียดสินค้า |
| POST | `/api/products` | Auth + Verified | `title`, `price`, `description`, `categoryKey`, `province`, `district`, `condition`, `quantity`, files `images[]`, `coverIndex` | สร้างประกาศสินค้าใหม่ |
| PUT | `/api/products/:id` | Auth + Verified | path `id`, field ที่ต้องการแก้ไข, files `images[]` | แก้ไขข้อมูลสินค้าและรูปภาพ |
| DELETE | `/api/products/:id` | Auth + Verified | path `id` | ลบสินค้าของตนเอง |

### Categories

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/categories` | Public | - | ดึงหมวดหมู่ทั้งหมด |
| GET | `/api/categories/popular` | Public | query `limit` | ดึงหมวดหมู่ยอดนิยม |
| POST | `/api/categories` | Auth + Admin | `category_key`, `name`, `emoji`, `sort_order` | สร้างหมวดหมู่ใหม่ |
| PUT | `/api/categories/:id` | Auth + Admin | path `id` | แก้ไขหมวดหมู่ |
| DELETE | `/api/categories/:id` | Auth + Admin | path `id` | ลบหมวดหมู่แบบ soft delete |

### Chats

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/chats` | Auth + Verified | - | ดึงรายการห้องแชตของผู้ใช้ |
| GET | `/api/chats/unread` | Auth + Verified | - | ดึงจำนวนข้อความที่ยังไม่อ่าน |
| POST | `/api/chats` | Auth + Verified | `productId`, `sellerId` | ค้นหาห้องแชตเดิมหรือสร้างห้องแชตใหม่ |
| GET | `/api/chats/:chatId` | Auth + Verified | path `chatId` | ดูรายละเอียดห้องแชต |
| DELETE | `/api/chats/:chatId` | Auth + Verified | path `chatId` | ซ่อนห้องแชตของผู้ใช้ |
| GET | `/api/chats/:chatId/messages` | Auth + Verified | path `chatId`, query `page` | ดึงข้อความในห้องแชตแบบแบ่งหน้า |
| POST | `/api/chats/:chatId/messages` | Auth + Verified | path `chatId`, `content`, `type` | ส่งข้อความใหม่ในห้องแชต |
| PATCH | `/api/chats/:chatId/read` | Auth + Verified | path `chatId` | ทำเครื่องหมายว่าอ่านข้อความแล้ว |

### Orders

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/orders/buyer/my` | Auth | - | ดึงรายการคำสั่งซื้อของผู้ซื้อปัจจุบัน |
| GET | `/api/orders/seller/my` | Auth | - | ดึงรายการคำสั่งขายของผู้ขายปัจจุบัน |
| GET | `/api/orders/:orderId` | Auth | path `orderId` | ดูรายละเอียดคำสั่งซื้อ 1 รายการ |
| POST | `/api/orders` | Auth + Verified | `Product_ID`, `Quantity` | สร้างคำสั่งซื้อใหม่ |
| POST | `/api/orders/seller-record` | Auth + Verified | `Product_ID`, `Buyer_ID`, `targetStatus` | ให้ผู้ขายบันทึกการขายแทนผู้ซื้อ |
| PATCH | `/api/orders/:orderId/status` | Auth + Verified | path `orderId`, `status` = `paid` หรือ `completed` | อัปเดตสถานะคำสั่งซื้อ |
| PATCH | `/api/orders/:orderId/cancel` | Auth + Verified | path `orderId` | ยกเลิกคำสั่งซื้อและคืนสต็อก |

### Reviews

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/reviews/seller/:sellerId` | Public | path `sellerId` | ดึงรีวิวทั้งหมดของผู้ขาย |
| GET | `/api/reviews/seller/:sellerId/rating` | Public | path `sellerId` | ดึงคะแนนเฉลี่ยและจำนวนรีวิวของผู้ขาย |
| GET | `/api/reviews/my` | Auth | - | ดึงรีวิวที่ผู้ใช้ปัจจุบันเขียนไว้ |
| GET | `/api/reviews/check/:orderId` | Auth | path `orderId` | ตรวจสอบว่าคำสั่งซื้อนี้ถูกรีวิวแล้วหรือยัง |
| POST | `/api/reviews` | Auth + Verified | `orderId`, `rating`, `comment` | สร้างรีวิวหลังธุรกรรมเสร็จสิ้น |

### Reports

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/reports` | Auth + Verified | `targetId`, `reportType`, `reason` | แจ้งรายงานผู้ใช้หรือสินค้า |
| GET | `/api/reports/me` | Auth | - | ดูรายการ report ที่ผู้ใช้ปัจจุบันส่ง |

### Admin

ทุก endpoint ใต้ `/api/admin` ต้องเป็น `Auth + Admin`

| Method | Endpoint | Access | Request สำคัญ | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/stats` | Auth + Admin | - | ดึงสถิติภาพรวมสำหรับ dashboard ผู้ดูแลระบบ |
| GET | `/api/admin/users` | Auth + Admin | query `page`, `limit` | ดึงรายการผู้ใช้ทั้งหมด |
| GET | `/api/admin/users/banned` | Auth + Admin | query `page`, `limit` | ดึงรายการผู้ใช้ที่ถูกแบน |
| PATCH | `/api/admin/users/:userId/ban` | Auth + Admin | path `userId` | แบนผู้ใช้ |
| PATCH | `/api/admin/users/:userId/unban` | Auth + Admin | path `userId` | ปลดแบนผู้ใช้ |
| GET | `/api/admin/products/banned` | Auth + Admin | query `page`, `limit` | ดึงรายการสินค้าที่ถูกแบน |
| PATCH | `/api/admin/products/:productId/ban` | Auth + Admin | path `productId` | แบนสินค้า |
| PATCH | `/api/admin/products/:productId/unban` | Auth + Admin | path `productId` | ปลดแบนสินค้า |
| GET | `/api/admin/reports` | Auth + Admin | query `page`, `limit` | ดึงรายการรายงานทั้งหมด |

### Real-time Chat (Socket.IO)

- เชื่อมต่อผ่าน Socket.IO server เดียวกับ backend
- ต้องส่ง token ใน `socket.handshake.auth.token`
- event หลักที่รองรับคือ `join`, `leave`, `sendMessage`
- server จะ push event `newMessage` เมื่อมีข้อความใหม่หรือ auto-reply

## Testing

Run tests with:

```bash
npm test
```

Notes:

- The project includes a Vitest environment setup file for test-only environment variables.
- If a local machine blocks Vitest process spawning, run `tsc --noEmit` first to verify TypeScript correctness.

## Deployment

This project is commonly deployed with:

- Render for the backend
- Vercel for the frontend

### Render Backend Checklist

- Set `NODE_ENV=production`
- Configure the full server environment, including MySQL, Redis, JWT, Resend, and Firebase
- Make sure `CLIENT_URL` and `CLIENT_URLS` include your frontend domains
- Set `FIREBASE_STORAGE_BUCKET`
- Confirm `/health` returns a successful response after deploy

### Vercel Frontend Checklist

- Set `NEXT_PUBLIC_API_URL`
- Set `NEXT_PUBLIC_SOCKET_URL` if it differs from the API URL
- Set the Firebase web environment variables
- Verify login, uploads, chat, and image loading after deployment

## Security Notes

- Rotate secrets immediately if they were ever committed or shared
- Keep Firebase service account JSON only in environment variables
- Keep `.env.example` as placeholders only
- Do not expose server-only credentials to the frontend

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
