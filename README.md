# Synora

**Collaborative social-learning platform** for sharing educational content, including posts, documents (PDF/DOCX/PPTX), images, and videos, with a built-in **AI study assistant** powered by Google Gemini.

Synora combines document sharing, social interaction, near-real-time messaging, and a comprehensive administration console for students and collaborative learning communities.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-0C344B?style=flat-square&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-API-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

**[Live Demo](https://synora-sepia.vercel.app)**

---

## Table of Contents

- [Highlights](#highlights)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Commands](#development-commands)
- [Deployment](#deployment)
- [License](#license)

---

## Highlights

- **100+ API route files** built with the Next.js App Router
- **PostgreSQL schema with 36 Prisma models**
- **Authentication and authorization** with NextAuth.js: credentials login, role-based access control, and post-level visibility permissions
- **Streaming AI study assistant** (Google Gemini) for document summarization and explanation, with access validation, daily usage quotas, response caching, and customizable study preferences
- **Direct and group messaging** using ~2-3 second HTTP polling, compatible with free serverless hosting
- **Full admin console** for moderation, content management, reports, support requests, and audit logging
- **Bilingual UI** (Vietnamese / English) with light and dark themes

---

## Features

### Social Feed
- Create posts with rich content, images, videos, and file attachments
- Post-level visibility permissions
- Like, comment, reply, and save posts
- Edit or hide comments, with a media lightbox for images and videos
- Trending tags and suggested people

### AI Study Assistant
- Streaming responses powered by the Google Gemini API
- Document summarization and explanation from three sources: documents in the library, files attached to posts, and files uploaded directly to the assistant
- Access validation: users can only query documents they are allowed to view
- Daily usage quotas per user and a global daily cap (configurable via environment variables)
- Response caching (extracted text and document summaries) to reduce repeated API calls
- Context-aware answers: document text is truncated to a safe context size, with a short rolling chat history
- Conversation history with automatic 30-day retention
- Saved prompts (up to 20 per user) and customizable study preferences
- Model configurable through `GEMINI_MODEL`

### Messaging & Notifications
- Direct and group conversations with attachments, replies, reactions, pinning, forwarding, and message management
- Group invite links, join requests, and member role management
- Near-real-time updates through short-interval HTTP polling (~2-3 seconds)
- Notifications and online presence / activity status

### Document Library
- Upload, edit, and share learning materials (PDF, DOCX, PPTX)
- PDF preview and download support
- Browse and filter documents by subject
- Save documents to a personal collection
- Library statistics and featured documents

### Profiles & Social Graph
- Profile pages with posts, documents, images, and saved items
- Follow system and friend requests
- Privacy controls for friend requests, friends list, and messages
- User blocking and content reporting

### Search
- Search across people, posts, documents, and topics
- Accent-insensitive search for Vietnamese content

### Administration & Support
- Admin dashboard with statistics, top posts, and top reported users
- Manage users, content (posts, comments, media), groups, and library documents
- Report handling, account lock / unlock, violation tracking, and audit log
- Moderation sweep for automated account-lock handling
- Support request system with tracking codes, rate limiting, and email notifications

### Authentication & Account
- NextAuth.js with credentials provider and Prisma adapter
- Role-based access control (user / admin)
- Email-based forgot / reset password flow
- Account settings: email, password, theme, language, and account deletion requests
- Locked / banned account handling

### UI/UX
- Bilingual interface (Vietnamese / English) with next-intl
- Light and dark mode
- Responsive interface built with Tailwind CSS v4

---

## Tech Stack

| Category         | Technologies                          |
| ---------------- | ------------------------------------- |
| Framework        | Next.js 16 (App Router)               |
| Frontend         | React 19 + TypeScript                 |
| Styling          | Tailwind CSS v4 + tw-animate-css      |
| Icons            | Lucide React                          |
| Database         | PostgreSQL (Neon)                     |
| ORM              | Prisma                                |
| Authentication   | NextAuth.js + Prisma Adapter          |
| AI               | Google Gemini API                     |
| File Uploads     | UploadThing                           |
| Email            | Nodemailer                            |
| i18n             | next-intl                             |
| PDF Preview      | react-pdf                             |
| Document Parsing | unpdf, jszip                          |
| Deployment       | Vercel                                |

---

## Getting Started

### Prerequisites

- Node.js >= 20.9.0
- PostgreSQL database (local or [Neon](https://neon.tech))
- [UploadThing](https://uploadthing.com) account
- [Google AI Studio](https://aistudio.google.com) API key (for the AI assistant)
- Gmail account with an App Password (for transactional email)

### Installation

```bash
# Clone repository
git clone https://github.com/TrongPhucx05/synora.git

# Navigate into project
cd synora

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following values:

```dotenv
# Database
DATABASE_URL=
DIRECT_URL=

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=

# File upload (UploadThing)
UPLOADTHING_TOKEN=

# AI assistant (Google Gemini)
GEMINI_API_KEY=
# Optional (defaults shown)
GEMINI_MODEL=gemini-3.5-flash-lite
AI_USER_DAILY_LIMIT=10
AI_GLOBAL_DAILY_LIMIT=400

# Email (Nodemailer with Gmail)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Seed admin account (used by `npx prisma db seed`)
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_USERNAME=
```

> - Only the variables under "Optional" can be omitted; everything else is required.
> - `NEXTAUTH_SECRET` can be generated with `openssl rand -base64 32`.
> - `GMAIL_APP_PASSWORD` is a Google App Password, not your regular Gmail password.
> - `DIRECT_URL` is the direct (non-pooled) connection string, used by Prisma for schema operations.

### Database Setup

```bash
npx prisma generate
npx prisma db push

# Optional: seed the initial admin account (see SEED_ADMIN_* in .env)
npx prisma db seed
```

### Run Development Server

```bash
npm run dev
```

Application runs at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```text
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Login, register, forgot/reset password
│   ├── (site)/               # Feed, chat, library, profile, friends, search,
│   │                         #   notifications, settings, support
│   ├── admin/                # Admin panel (users, content, groups, library,
│   │                         #   reports, support requests, audit log)
│   ├── api/                  # Route handlers (REST API)
│   │   ├── account/          # Email, password, deletion, support requests
│   │   ├── admin/            # Admin endpoints
│   │   ├── ai/               # AI chat, conversations, history, prompts, settings
│   │   ├── auth/             # NextAuth, register, forgot/reset password
│   │   ├── conversations/    # Messaging, members, invites, pins, reactions
│   │   ├── library/          # Documents, stats, save, share, download
│   │   ├── posts/            # Posts, comments, likes, saves, shares
│   │   ├── profile/          # Profile data, follow, friends, saved items
│   │   ├── search/           # Global search
│   │   ├── settings/         # Privacy, theme, language, activity status
│   │   └── ...               # notifications, presence, reports, tags, users
│   ├── account-banned/       # Banned account page
│   ├── account-suspended/    # Suspended account page
│   └── join/[token]/         # Group invite link handling
│
├── components/
│   ├── account/              # Locked-account actions, support modal
│   ├── admin/                # Admin dashboard and management UI
│   ├── ai/                   # AI assistant provider, sidebar, rich text
│   ├── chat/                 # Messaging UI
│   ├── feed/                 # Feed, posts, and comments UI
│   ├── layout/               # Navbar, Sidebar, MainLayout
│   ├── library/              # Document library UI
│   ├── notifications/        # Notification components
│   ├── profile/              # User profile UI
│   ├── providers/            # Auth, theme, language, presence providers
│   ├── search/               # Search results and cards
│   ├── settings/             # Account, privacy, theme settings
│   ├── support/              # Support request UI
│   └── ui/                   # Shared UI components
│
├── lib/                      # Domain logic, utilities & configs
│   ├── admin/                # Moderation, account-lock, moderation sweep
│   ├── ai/                   # Gemini client, text extraction, memory, usage quota
│   ├── auth/                 # Auth helpers (assert-active)
│   ├── block/                # User blocking logic
│   ├── chat/                 # Chat data, hooks, types
│   ├── email/                # Email service, tokens, templates
│   ├── feed/                 # Feed hooks, types, utils
│   ├── i18n/                 # Language constants, cookies, request config
│   ├── library/              # Library data and types
│   ├── notifications/        # Notification data and hooks
│   ├── presence/             # Online presence helpers
│   ├── profile/              # Profile data and types
│   ├── search/               # Search data and unaccent helper
│   ├── settings/             # Synced settings hooks
│   ├── support/              # Support request logic, rate limit, tracking
│   ├── theme/                # Theme constants and init script
│   ├── auth.ts               # NextAuth configuration
│   ├── privacy.ts            # Privacy and visibility rules
│   └── prisma.ts             # Prisma client
│
├── generated/prisma/         # Generated Prisma client
├── messages/                 # Translations (en.json, vi.json)
└── proxy.ts                  # Request proxy (Next.js 16)
```

---

## Development Commands

```bash
# Start development server
npm run dev

# Create production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database
npx prisma db seed
```

---

## Deployment

Synora is deployed on **Vercel** with **Neon PostgreSQL**.

- Hosted on Vercel, with Neon as the managed PostgreSQL database.
- Production environment variables are configured through Vercel Project Settings.
- Database schema is synchronized using Prisma.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.