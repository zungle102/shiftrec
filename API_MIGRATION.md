# API Migration to Backend

This document describes the migration of API implementations from the Next.js frontend to the NestJS backend.

## Overview

The following API endpoints have been migrated from Next.js API routes to the NestJS backend:

1. **Signup** (`POST /auth/signup`) - User registration
2. **User Profile** (`GET /user/profile`) - Get user profile
3. **User Profile** (`PATCH /user/profile`) - Update user profile

## Backend API Endpoints

### Base URL
- Development: `http://localhost:4000`
- Production: Set via `NEXT_PUBLIC_API_URL` environment variable

### Endpoints

#### POST /auth/signup
Creates a new user account.

**Request Body:**
```json
{
  "name": "Business Name",
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "ok": true
}
```

#### GET /user/profile
Retrieves the current user's profile. Requires `x-user-email` header.

**Headers:**
- `x-user-email`: User's email address (from NextAuth session)

**Response:**
```json
{
  "name": "Business Name",
  "email": "user@example.com",
  "businessName": "Contact Person",
  "streetAddress": "123 Main St",
  "suburb": "Woodville Gardens",
  "state": "SA",
  "phoneNumber": "+61 451248244",
  "businessWebsite": "https://example.com",
  "businessABN": "12345678901"
}
```

#### PATCH /user/profile
Updates the current user's profile. Requires `x-user-email` header.

**Headers:**
- `x-user-email`: User's email address (from NextAuth session)

**Request Body:**
```json
{
  "name": "Updated Business Name",
  "businessName": "Updated Contact Person",
  "streetAddress": "456 New St",
  "suburb": "New Suburb",
  "state": "NSW",
  "phoneNumber": "+61 451248245",
  "businessWebsite": "https://newsite.com",
  "businessABN": "98765432109"
}
```

**Response:**
```json
{
  "ok": true,
  "name": "Updated Business Name",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Environment Variables

### Backend (`apps/api/.env`)
```env
MONGODB_URI=mongodb+srv://...
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
MONGODB_URI=mongodb+srv://... (still used by NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

## Authentication

Currently, the backend uses a simple header-based authentication where the user's email is passed via the `x-user-email` header. This email is extracted from the NextAuth session on the frontend.

**Note:** NextAuth authentication routes remain in the frontend (`/api/auth/[...nextauth]`) as they require Next.js-specific server-side handling.

## File Structure

### Backend
```
apps/api/src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   └── dto/
│       └── signup.dto.ts
├── user/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.module.ts
│   └── dto/
│       └── profile.dto.ts
├── database/
│   ├── database.module.ts
│   └── database.service.ts
└── config/
    └── database.config.ts
```

### Frontend
```
apps/web/src/
├── lib/
│   └── api.ts (API client)
└── app/
    ├── signup/
    │   └── page.tsx (updated to use backend)
    └── dashboard/
        └── profile/
            └── page.tsx (updated to use backend)
```

## Development

### Running the Backend
```bash
cd apps/api
pnpm install
pnpm start:dev
```

### Running the Frontend
```bash
cd apps/web
pnpm install
pnpm dev
```

## Next Steps

1. Consider implementing proper JWT authentication for the backend
2. Add rate limiting for API endpoints
3. Add request validation middleware
4. Set up API documentation with Swagger/OpenAPI
5. Add comprehensive error handling and logging

