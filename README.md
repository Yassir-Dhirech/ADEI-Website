# ADEI Website — ENSA Fès

Official full-stack platform for **ADEI** (*Association des Étudiants Ingénieurs* — ENSA Fès):
- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (`frontend/` on port `5173` in dev, `3000` in Docker)
- **Backend:** Node.js 20 + Express + Sequelize ORM + TypeScript (`server/` on port `5001`)
- **Cloud Database:** Neon Serverless PostgreSQL 16 (TLS/SSL pooled runtime + direct migration endpoint) & local PostgreSQL (`5432`)
- **Cloud Hosting:** Vercel SPA (Frontend with `/api/*` proxy rewrite) + Vercel Serverless Function (`server/api/index.ts`)
- **Object Storage:** Cloudinary (production) & local disk fallback (`uploads/` in development)
- **Compliance & Security:** Moroccan CNDP Law 09-08, HMAC-SHA256 OTP lockout, partial unique indexes, RFC 4180 CSV sanitization, and institutional immutable audit logging

---

## 🗺️ System Architecture

```
[ Client Browser ]
        │
        ├── (Dev: http://localhost:5173 / Prod: Vercel SPA)
        ▼
[ Frontend SPA (React 19 + Vite + Tailwind v4) ]
        │
        │  /api/* (HTTP/JSON + httpOnly JWT Cookie: credentials: 'include')
        ▼
[ Express API Engine (Node.js 20 + TypeScript) ]
   ├── Middleware: CORS, RateLimit, Express req.ip, Zod .strict(), Auth Cookie
   ├── Business Logic & Services (OTP HMAC-SHA256, Cloudinary Storage, Audit Log)
   └── Sequelize ORM 6 (TypeScript Models & Migrations)
        │
        ├── (Database Connection Pooling / Direct DDL)
        ▼
[ Neon Serverless PostgreSQL 16 ]
   ├── 15 Versioned Migrations (SequelizeMeta)
   ├── Partial Unique Indexes (Student & Guest Registrations)
   └── Immutable Audit Trail (audit_logs table with actor snapshots)
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (version 10 or higher)
- [Git](https://git-scm.com/)
- Access to a PostgreSQL database (local instance or cloud Neon connection string)

### 2. Configure Environment Variables
Copy the root `.env.example` into `server/.env` (and root `.env` if using Docker):

```bash
# In Bash / macOS / Linux:
cp .env.example server/.env

# In PowerShell (Windows):
Copy-Item .env.example server/.env
```

Key variables to configure in `server/.env`:
```ini
NODE_ENV=development
PORT=5001
JWT_SECRET=your_super_secret_jwt_key_at_least_32_chars
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
COOKIE_SECURE=false

# Database Configuration (Choose one):
# Option A: Direct Neon PostgreSQL connection:
DATABASE_URL=postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Option B: Local PostgreSQL:
DB_HOST=localhost
DB_PORT=5432
DB_USER=adei_pg_user
DB_PASSWORD=adei_pg_password
DB_NAME=adei_pg
DB_SSL=false

# Object Storage (Cloudinary in production, local in dev):
STORAGE_PROVIDER=local
```

### 3. Install Dependencies
```bash
# Install backend dependencies
npm --prefix server install

# Install frontend dependencies
npm --prefix frontend install
```

### 4. Database Migrations & Initial Administrator
Run all 15 versioned migrations to build the schema:
```bash
npm --prefix server run migrate
```

Initialize the administrator account using credentials defined in your `.env` (or pass `-- --reset` to force-reset an existing administrator):
```bash
npm --prefix server run create-admin
```

*(Optional)* Seed realistic campus data (articles, events, clubs, executive bureau mandates 2023–2026, partners, and feedbacks):
```bash
# Populate demo data
npm --prefix server run seed:demo

# Clear only demo data (preserves administrator, users, and filières)
npm --prefix server run seed:clear
```

### 5. Start Development Servers
Start the backend and frontend concurrently:

```bash
# Terminal 1: Backend API (runs on http://localhost:5001 with hot-reload)
npm --prefix server run dev

# Terminal 2: Frontend SPA (runs on http://localhost:5173 with Vite HMR)
npm --prefix frontend run dev
```

---

## 🐳 Containerized Setup (Docker Compose)

If you prefer running everything in isolated Docker containers:

1. **Start all services:**
   ```bash
   docker compose up --build
   ```
2. **Apply migrations inside the container:**
   ```bash
   docker compose exec api npm run migrate
   ```
3. **Initialize the administrator:**
   ```bash
   docker compose exec api npm run create-admin
   ```
4. **Seed demo data:**
   ```bash
   docker compose exec api npm run seed:demo
   ```

---

## 🔒 Security, Compliance & Governance Architecture

| Mechanism | Implementation Detail | Location |
| :--- | :--- | :--- |
| **CNDP Law 09-08 Compliance** | Mandatory personal data collection consent checkbox and explicit data processing notice for public guest registrations. | [frontend/src/pages/NewsPage.tsx](file:///c:/Users/asus/Desktop/projects/ADEI-Website/frontend/src/pages/NewsPage.tsx) |
| **OTP Brute-Force Defense** | HMAC-SHA256 salted hashing (`JWT_SECRET`), 5-minute expiration, and 5-attempt brute-force lockout counter in database. | [server/services/otp.service.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/services/otp.service.ts) |
| **Dual-Track Event RSVPs** | Partial unique PostgreSQL indexes preventing duplicate RSVPs for students and guests: `(eventId, userId) WHERE userId IS NOT NULL` and `(eventId, guestEmail) WHERE userId IS NULL`. | [server/migrations/20261126020000-event-registrations-and-organizers.js](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/migrations/20261126020000-event-registrations-and-organizers.js) |
| **CSV Formula Injection Defense** | RFC 4180 sanitizer escaping cells starting with `=`, `+`, `-`, `@`, `\t` with `'` to neutralize DDE formula execution in Excel. | [frontend/src/lib/csv.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/frontend/src/lib/csv.ts) |
| **Immutable Institutional Audit Trail** | Immutable `audit_logs` table tracking user approvals, role changes, roster exports, logins, and deletions. Server-side fail-closed execution on critical governance actions. | [server/services/audit.service.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/services/audit.service.ts) |
| **IP Trust-Proxy Isolation** | Real client IP extracted safely via Express `req.ip` behind reverse proxies without trusting spoofable raw headers. | [server/app.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/app.ts) |
| **Strict Request Validation** | Zod schemas with `.strict()` reject unknown or unauthorized properties during registration and submission. | [server/validators/schemas.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/validators/schemas.ts) |
| **Cookie Authentication** | Session token stored in `httpOnly` secure cookies (`SameSite=None; Secure` in production), immunizing tokens against XSS. | [server/middleware/auth.ts](file:///c:/Users/asus/Desktop/projects/ADEI-Website/server/middleware/auth.ts) |

---

## 🗄️ Database Migrations Lifecycle

All schema modifications are tracked as versioned, reversible migrations in `server/migrations/`.

```bash
# Run all pending migrations
npm --prefix server run migrate

# Roll back the most recent migration
npm --prefix server run migrate:undo

# Target Neon Cloud Database directly (always use the direct, non-pooled connection for migrations):
DATABASE_URL="postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require" npm --prefix server run migrate
```

### Database Backup & Disaster Recovery
Generate an encrypted, timestamped PostgreSQL dump into `./backups/`:
```bash
npm --prefix server run db:backup
```

---

## 🧪 Testing & Verification Suite

The repository includes a comprehensive automated testing suite:

```bash
# Run automated Jest integration & smoke test suite
npm --prefix server test

# Run TypeScript type check on backend
npm --prefix server run typecheck

# Build frontend production bundle with Vite
npm --prefix frontend run build
```

---

## 🌐 Service Endpoints & Ports

| Service | Environment | URL / Port | Details |
| :--- | :--- | :--- | :--- |
| **Frontend (Vite Dev)** | Local Native | `http://localhost:5173` | React 19 + Tailwind v4 HMR |
| **Frontend (Docker)** | Local Container | `http://localhost:3000` | Nginx/Vite Container |
| **Backend API** | Local Dev | `http://localhost:5001` | Express + TypeScript (`/api/*`) |
| **API Healthcheck** | Local Dev | `http://localhost:5001/health` | Returns DB connectivity & uptime |
| **Adminer UI** | Local Docker | `http://localhost:8082` | Web SQL Client |
| **PostgreSQL (Local)** | Local Docker | `localhost:5432` | Containerized PostgreSQL 16 |
| **Production Frontend** | Cloud (Vercel) | `https://adei-ensa.vercel.app` | Vercel SPA with `/api/*` rewrite |
| **Production API** | Cloud (Vercel) | `https://adei-api-phi.vercel.app` | Vercel Serverless Function |
| **Production Database** | Cloud (Neon) | Serverless PostgreSQL 16 | Connection pooling + SSL |
