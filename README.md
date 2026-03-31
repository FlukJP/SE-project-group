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

The base URL for the API is `http://localhost:5000/api`

**Notes:**
- `Auth` = Requires sending `Authorization: Bearer <access_token>`
- `Verified` = User must be verified
- `Admin` = Must be an administrator
- File upload endpoints use `multipart/form-data`

### System

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Check the status of the server and Redis |

### Authentication

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | `username`, `email`, `password`, `phone` | Register a new user and send email verification OTP |
| POST | `/api/auth/login` | Public | `email`, `password` | Log in and receive `access_token` with refresh token cookie |
| POST | `/api/auth/refresh-token` | Public | `refresh_token` or cookie | Request a new access token |
| POST | `/api/auth/request-otp` | Public | `email` | Request an OTP for email verification |
| POST | `/api/auth/verify-otp` | Public | `email`, `otp` | Verify email OTP and issue a new token |
| POST | `/api/auth/request-phone-otp` | Public | `phone` | Request an OTP for phone verification |
| POST | `/api/auth/verify-phone-otp` | Public | `phone`, `otp` | Verify phone OTP and issue a new token |
| POST | `/api/auth/verify-phone-firebase` | Public | `idToken` | Verify phone number via Firebase |
| POST | `/api/auth/reset-password` | Public | `email`, `otp`, `newPassword` | Reset password using OTP |
| POST | `/api/auth/logout` | Auth | - | Log out and clear refresh token |
| POST | `/api/auth/change-password` | Auth | `oldPassword`, `newPassword` | Change the current user's password |

### Users

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/users/me` | Auth | - | Get the logged-in user's profile data |
| PUT | `/api/users/me` | Auth | `Username`, `Email`, `Phone_number`, `Address`, `Auto_Reply_Message` | Update profile information |
| PUT | `/api/users/me/avatar` | Auth | file `avatar` | Upload or change profile picture |
| GET | `/api/users/:id` | Public | path `id` | View a user's public profile |

### Products

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/products` | Public | query `q`, `category`, `minPrice`, `maxPrice`, `page`, `limit`, `sortBy`, `sortOrder`, `province`, `district`, `excludeSeller` | Get a list of products with search, filter, sort, and pagination |
| GET | `/api/products/seller/:sellerId` | Public | path `sellerId` | Get all products from a specific seller |
| GET | `/api/products/:id` | Public | path `id` | View product details |
| POST | `/api/products` | Auth + Verified | `title`, `price`, `description`, `categoryKey`, `province`, `district`, `condition`, `quantity`, files `images[]`, `coverIndex` | Create a new product listing |
| PUT | `/api/products/:id` | Auth + Verified | path `id`, specific fields to update, files `images[]` | Update product details and images |
| DELETE | `/api/products/:id` | Auth + Verified | path `id` | Delete own product |

### Categories

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/categories` | Public | - | Get all categories |
| GET | `/api/categories/popular` | Public | query `limit` | Get popular categories |
| POST | `/api/categories` | Auth + Admin | `category_key`, `name`, `emoji`, `sort_order` | Create a new category |
| PUT | `/api/categories/:id` | Auth + Admin | path `id` | Edit a category |
| DELETE | `/api/categories/:id` | Auth + Admin | path `id` | Soft delete a category |

### Chats

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/chats` | Auth + Verified | - | Get the user's chat room list |
| GET | `/api/chats/unread` | Auth + Verified | - | Get the number of unread messages |
| POST | `/api/chats` | Auth + Verified | `productId`, `sellerId` | Find an existing chat room or create a new one |
| GET | `/api/chats/:chatId` | Auth + Verified | path `chatId` | View chat room details |
| DELETE | `/api/chats/:chatId` | Auth + Verified | path `chatId` | Hide a chat room for the user |
| GET | `/api/chats/:chatId/messages` | Auth + Verified | path `chatId`, query `page` | Get paginated messages in a chat room |
| POST | `/api/chats/:chatId/messages` | Auth + Verified | path `chatId`, `content`, `type` | Send a new message in a chat room |
| PATCH | `/api/chats/:chatId/read` | Auth + Verified | path `chatId` | Mark messages as read |

### Orders

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/orders/buyer/my` | Auth | - | Get the current buyer's order list |
| GET | `/api/orders/seller/my` | Auth | - | Get the current seller's order list |
| GET | `/api/orders/:orderId` | Auth | path `orderId` | View details of a specific order |
| POST | `/api/orders` | Auth + Verified | `Product_ID`, `Quantity` | Create a new order |
| POST | `/api/orders/seller-record` | Auth + Verified | `Product_ID`, `Buyer_ID`, `targetStatus` | Allow seller to record a sale on behalf of a buyer |
| PATCH | `/api/orders/:orderId/status` | Auth + Verified | path `orderId`, `status` = `paid` or `completed` | Update order status |
| PATCH | `/api/orders/:orderId/cancel` | Auth + Verified | path `orderId` | Cancel an order and restore stock |

### Reviews

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/reviews/seller/:sellerId` | Public | path `sellerId` | Get all reviews for a seller |
| GET | `/api/reviews/seller/:sellerId/rating` | Public | path `sellerId` | Get the average rating and total review count for a seller |
| GET | `/api/reviews/my` | Auth | - | Get reviews written by the current user |
| GET | `/api/reviews/check/:orderId` | Auth | path `orderId` | Check if this order has already been reviewed |
| POST | `/api/reviews` | Auth + Verified | `orderId`, `rating`, `comment` | Create a review after a transaction is completed |

### Reports

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| POST | `/api/reports` | Auth + Verified | `targetId`, `reportType`, `reason` | Submit a report for a user or product |
| GET | `/api/reports/me` | Auth | - | View reports submitted by the current user |

### Admin

All endpoints under `/api/admin` require `Auth + Admin` access.

| Method | Endpoint | Access | Key Request Data | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/stats` | Auth + Admin | - | Get overall statistics for the admin dashboard |
| GET | `/api/admin/users` | Auth + Admin | query `page`, `limit` | Get a list of all users |
| GET | `/api/admin/users/banned` | Auth + Admin | query `page`, `limit` | Get a list of banned users |
| PATCH | `/api/admin/users/:userId/ban` | Auth + Admin | path `userId` | Ban a user |
| PATCH | `/api/admin/users/:userId/unban` | Auth + Admin | path `userId` | Unban a user |
| GET | `/api/admin/products/banned` | Auth + Admin | query `page`, `limit` | Get a list of banned products |
| PATCH | `/api/admin/products/:productId/ban` | Auth + Admin | path `productId` | Ban a product |
| PATCH | `/api/admin/products/:productId/unban` | Auth + Admin | path `productId` | Unban a product |
| GET | `/api/admin/reports` | Auth + Admin | query `page`, `limit` | Get a list of all reports |

### Real-time Chat (Socket.IO)

- Connect via the same Socket.IO server as the backend
- Must send token in `socket.handshake.auth.token`
- Main supported events are `join`, `leave`, `sendMessage`
- The server will push a `newMessage` event when there is a new message or auto-reply

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
- **Backend:** [Render](https://render.com/)
- **Frontend:** [Vercel](https://vercel.com/)

### Render Backend Checklist

Before deploying the backend, ensure you have completed the following steps:
- [ ] Set `NODE_ENV=production`
- [ ] Configure the full server environment variables (MySQL, Redis, JWT, Resend, and Firebase Service Account)
- [ ] Make sure `CLIENT_URL` and `CLIENT_URLS` include your production frontend domains
- [ ] Set `FIREBASE_STORAGE_BUCKET` explicitly
- [ ] Confirm `https://your-backend-url.onrender.com/api/health` returns a successful response after deployment

### Vercel Frontend Checklist

Before deploying the frontend, ensure you have configured the following:
- [ ] Set `NEXT_PUBLIC_API_URL` to your production backend URL
- [ ] Set `NEXT_PUBLIC_SOCKET_URL` (if it differs from the API URL)
- [ ] Set all Firebase web environment variables (`NEXT_PUBLIC_FIREBASE_*`)
- [ ] Post-deployment verification: Test user login, profile image uploads, real-time chat, and product image loading

## Security Notes

- Rotate secrets immediately if they were ever committed or shared
- Keep Firebase service account JSON only in environment variables
- Keep `.env.example` as placeholders only
- Do not expose server-only credentials to the frontend

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.