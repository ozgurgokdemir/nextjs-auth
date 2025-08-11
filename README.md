# Next.js Authentication

A custom authentication example built with Next.js 15, demonstrating how to implement email/password authentication, OAuth providers (GitHub, Google), two-factor authentication, email verification, and password reset functionality.

## ✨ Features

- **🔐 Multi-Provider Authentication**

  - Email/password authentication with secure hashing
  - OAuth integration with GitHub and Google
  - Two-factor authentication (Email)
  - Email verification with secure tokens
  - Password reset with time-limited links

- **🛡️ Security Features**

  - Rate limiting and brute force protection
  - Secure password hashing with salt
  - Cookie-based session management
  - CSRF protection on all forms
  - Role-based access control (User/Admin)
  - Secure OAuth state validation

- **🎨 Modern UI/UX**

  - Responsive design with Tailwind CSS
  - Dark/light mode with system preference detection
  - Real-time form validation with Zod schemas
  - Toast notifications for user feedback
  - Accessible components built with shadcn/ui
  - Loading states and error handling

- **⚡ Performance**
  - Server Components for minimal client-side JavaScript
  - Server Actions for seamless form submissions
  - Server-side rendering for fast initial loads
  - Optimized database queries with Prisma ORM
  - Redis-powered session storage for instant access

## 🚀 Quick Start

### Prerequisites

- PostgreSQL database
- Redis instance (Upstash recommended)
- Resend

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd nextjs-auth
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/nextjs-auth"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
FROM_EMAIL="noreply@yourdomain.com"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_REDIRECT_URI="http://localhost:3000/api/oauth/github"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth/google"
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma db push
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🔧 Configuration

### OAuth Setup

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL to `http://localhost:3000/api/oauth/github`
4. Copy Client ID and Client Secret to your `.env`

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Set Authorized redirect URI to `http://localhost:3000/api/oauth/google`
6. Copy Client ID and Client Secret to your `.env`

### Email Setup (Resend)

1. Sign up at [Resend](https://resend.com)
2. Create an API key
3. Add your domain for sending emails
4. Update `FROM_EMAIL` in your `.env`

### Redis Setup (Upstash)

1. Sign up at [Upstash](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and Token to your `.env`

## 🔐 Authentication Flow

### Email/Password Registration

1. User fills signup form
2. Email verification code sent
3. User verifies email
4. Account activated

### OAuth Registration

1. User clicks OAuth provider
2. Redirected to provider
3. User authorizes application
4. Account created/linked automatically

### Two-Factor Authentication

1. User enables 2FA in dashboard
2. QR code generated for authenticator app
3. User scans code and enters verification
4. 2FA enabled for account

## 🛠️ Development

### Adding New OAuth Providers

1. Create provider file in `lib/auth/oauth/providers/`
2. Implement OAuth client following existing patterns
3. Add provider to `lib/auth/oauth/index.ts`
4. Create API route in `app/api/oauth/[provider]/route.ts`
5. Add UI components for the provider

## 📝 Environment Variables

| Variable                   | Description                  | Required |
| -------------------------- | ---------------------------- | -------- |
| `DATABASE_URL`             | PostgreSQL connection string | ✅       |
| `UPSTASH_REDIS_REST_URL`   | Redis REST URL               | ✅       |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token             | ✅       |
| `RESEND_API_KEY`           | Resend API key               | ✅       |
| `FROM_EMAIL`               | Sender email address         | ✅       |
| `GITHUB_CLIENT_ID`         | GitHub OAuth client ID       | ❌       |
| `GITHUB_CLIENT_SECRET`     | GitHub OAuth client secret   | ❌       |
| `GITHUB_REDIRECT_URI`      | GitHub OAuth redirect URI    | ❌       |
| `GOOGLE_CLIENT_ID`         | Google OAuth client ID       | ❌       |
| `GOOGLE_CLIENT_SECRET`     | Google OAuth client secret   | ❌       |
| `GOOGLE_REDIRECT_URI`      | Google OAuth redirect URI    | ❌       |

## 📚 Resources & Inspiration

This authentication system was built following best practices and concepts from:

- **[Lucia](https://lucia-next.pages.dev/)** - Open source project providing resources on implementing authentication with JavaScript and TypeScript
- **[The Copenhagen Book](https://thecopenhagenbook.com/)** - General guidelines on implementing auth in web applications
- **[Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)** - Official Next.js documentation on authentication patterns
