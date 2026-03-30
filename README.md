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
