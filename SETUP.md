# Quick Setup Guide

## Issue with Corepack/Pnpm

If you're encountering corepack signature errors, try one of these solutions:

### Option 1: Disable Corepack
```powershell
corepack disable
npm install -g pnpm@latest
```

### Option 2: Use npm instead (temporary)
Update `package.json` to use npm workspaces temporarily:
- Change `"workspaces"` to work with npm
- Install with `npm install`
- Note: This is a temporary workaround

### Option 3: Manual Installation
Install dependencies in each workspace manually:
```powershell
cd apps/web
npm install
cd ../api
npm install
cd ../../packages/shared
npm install
```

## Setup Steps (Once pnpm works)

1. **Environment is set up** ✓
   - `.env` file created with MongoDB URI and NEXTAUTH_SECRET

2. **Install dependencies:**
   ```powershell
   pnpm install
   ```

3. **Create database indexes:**
   ```powershell
   pnpm db:index
   ```

4. **Seed database (optional):**
   ```powershell
   pnpm db:seed
   ```
   Creates test user: `test@example.com` / `testpassword123`

5. **Start development servers:**
   ```powershell
   pnpm dev
   ```

## Alternative: Manual Database Setup

If you can't run the scripts yet, you can manually create indexes in MongoDB Atlas:
1. Go to MongoDB Atlas → Collections
2. Select the `shiftrec` database
3. Create index on `users` collection: `{ email: 1 }` (unique)
4. Create index on `accounts` collection: `{ providerId: 1, providerAccountId: 1 }` (unique)

## Test the Setup

Once everything is running:
- Web app: http://localhost:3000
- API: http://localhost:4000/health
- Sign up a new user or use the seeded test account

