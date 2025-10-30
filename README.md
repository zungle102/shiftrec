## ShiftRec Monorepo

A full-stack monorepo with user authentication, built with Next.js, NestJS, and MongoDB.

### Structure

- **apps/web**: Next.js (React, TypeScript, Tailwind CSS, NextAuth)
- **apps/api**: NestJS (TypeScript)
- **packages/shared**: Zod schemas, shared types/constants
- **packages/ui**: Shared UI primitives (optional)

### Getting Started

1. **Install pnpm** (if not installed):
   ```bash
   npm i -g pnpm
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   - Copy `apps/web/ENV.EXAMPLE` to `apps/web/.env`
   - Fill in:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
     - `NEXTAUTH_URL`: `http://localhost:3000` for local dev
     - OAuth providers (optional): Google/GitHub client IDs and secrets

4. **Create database indexes**:
   ```bash
   pnpm db:index
   ```

5. **Seed database (optional)**:
   ```bash
   pnpm db:seed
   ```
   Creates test user: `test@example.com` / `testpassword123`

6. **Run development servers**:
   ```bash
   pnpm dev
   ```
   - Web app: http://localhost:3000
   - API: http://localhost:4000

### Authentication

The app supports multiple authentication methods:

- **Credentials**: Email/password signup and signin
- **Google OAuth**: Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- **GitHub OAuth**: Configure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

OAuth setup:
- **Google**: https://console.cloud.google.com/apis/credentials
- **GitHub**: https://github.com/settings/developers

Callback URLs:
- Google: `http://localhost:3000/api/auth/callback/google` (dev)
- GitHub: `http://localhost:3000/api/auth/callback/github` (dev)

### Deployment

#### Vercel (Next.js Web App)

1. **Connect repository** to Vercel
2. **Configure project**:
   - Framework Preset: **Next.js**
   - Root Directory: `apps/web`
   - Build Command: `pnpm install && pnpm --filter @shiftrec/web build`
   - Output Directory: `.next` (auto-detected)
   - Install Command: `pnpm install`

3. **Set environment variables**:
   ```
   MONGODB_URI=your_mongodb_uri
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

4. **Update OAuth callback URLs**:
   - Google: `https://your-app.vercel.app/api/auth/callback/google`
   - GitHub: `https://your-app.vercel.app/api/auth/callback/github`

5. **Deploy**: Push to main branch or trigger manual deployment

#### DigitalOcean App Platform (NestJS API)

1. **Create new app** in DigitalOcean
2. **Connect repository**
3. **Configure build**:
   - Build Command: `pnpm install && pnpm --filter @shiftrec/api build`
   - Run Command: `node dist/main.js`
   - Environment: Node.js
   - Root Directory: `apps/api`

4. **Set environment variables**:
   ```
   PORT=8080
   NODE_ENV=production
   ```

5. **Add health check**: `/health` endpoint

6. **Deploy**: Connect your repo and deploy

### Scripts

- `pnpm dev` - Run web and API in development mode
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all apps and packages
- `pnpm format` - Format code with Prettier
- `pnpm db:index` - Create MongoDB indexes (unique email, etc.)
- `pnpm db:seed` - Seed database with test user

### Pre-commit Hooks

Husky and lint-staged are configured to:
- Run ESLint and auto-fix issues
- Format code with Prettier

Hooks run automatically on `git commit`. Install hooks after cloning:
```bash
pnpm prepare
```

