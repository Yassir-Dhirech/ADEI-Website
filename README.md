# ADEI Website — ENSA Fès

Full-stack web platform for **ADEI** (*Association des Étudiants Ingénieurs* — ENSA Fès):
- **Frontend v2 (Active Modern Rebuild):** Vite 8 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui + Framer Motion (`/frontend-v2` on port `3001`)
- **Frontend Legacy (Preserved for review):** React 19 (CRA) (`/frontend` on port `3000`)
- **Backend:** Node.js 20 + Express + Sequelize ORM + TypeScript (`/server` on port `5001`)
- **Databases:** PostgreSQL 16 (active primary) + MySQL 8.0 (standby) + Adminer UI (`:8082`)

---

## Getting Started (Docker Compose)

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose v2)
- [Git](https://git-scm.com/)

### 2. Configure Environment Variables
Copy the root template into a local `.env` file (never commit `.env`):

```bash
cp .env.example .env
```
*(In PowerShell: `Copy-Item .env.example .env`)* — edit any passwords or `JWT_SECRET` you want for local dev.

### 3. Start All Services
```bash
docker compose up --build
```
Or run in the background:
```bash
docker compose up -d --build
```

### 4. Database Migrations & Administrator Account
Apply all versioned database migrations (schema baseline, redesign, roles, academic hierarchy, and bureau mandates):

```bash
docker compose exec api npm run migrate
```

Admin accounts are never created automatically. To initialize or update your administrator account with the credentials defined in `.env`:

```bash
docker compose exec api npm run create-admin
```
*(Add `-- --reset` to force-reset an existing administrator's password: `docker compose exec api npm run create-admin -- --reset`)*

### 5. Demo Data (Mock Data for Testing)
Populate the database with realistic campus data (articles, events, clubs, executive bureau mandates 2023–2026, partners, and feedbacks):

```bash
# Seed realistic demo data
docker compose exec api npm run seed:demo

# Clear only the demo data (preserves admin, users, and filières)
docker compose exec api npm run seed:clear
```

### 6. Automated Database Backup (PostgreSQL)
Create an encrypted, timestamped SQL backup into `./backups/` and purge backups older than 30 days:

```bash
docker compose exec api npm run db:backup
```
*(Or directly via postgres: `docker compose exec postgres pg_dump -U adei_pg_user -d adei_pg > backups/manual_backup.sql`)*

### 7. Restore a MySQL Dump from `./backups` (Legacy / Rollback)
1. Place your `.sql` backup file inside the `./backups/` directory (for example `backups/adei_backup.sql`). It is automatically mounted inside the MySQL container at `/backups/`.
2. Run the restore command using the credentials from your `.env`:

**Bash / macOS / Linux:**
```bash
docker compose exec -T mysql mysql -u adei_user -p"your_mysql_password" adei_db < ./backups/adei_backup.sql
```

**PowerShell (Windows):**
```powershell
Get-Content .\backups\adei_backup.sql -Raw | docker compose exec -T mysql mysql -u adei_user -p"your_mysql_password" adei_db
```

*(Alternatively, run directly inside the container using the `/backups` mount: `docker compose exec mysql sh -c 'mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /backups/adei_backup.sql'`)*

### 8. Running Automated Tests (Jest + Supertest)
Tests run against a dedicated isolated PostgreSQL database (`adei_test`) protected by a safety guard so development data (`adei_pg`) is never touched.

1. Create the test database once (first-time setup):
```bash
docker compose exec postgres psql -U adei_pg_user -d adei_pg -c "CREATE DATABASE adei_test;"
```

2. Run the automated test suite:
```bash
docker compose exec api npm test
```

### 9. Production Deployment & CI/CD

- **GitHub Actions (`.github/workflows/ci.yml`):** Automatically triggers on push and pull requests to run TypeScript checks (`tsc`), execute database migrations on a clean PostgreSQL 16 container, run all 26 Jest smoke tests, and compile the Vite frontend production bundle.
- **SPA Routing (`frontend-v2/vercel.json`):** Configured with catch-all rewrites (`/(.*) -> /index.html`) to prevent 404 errors on deep links and browser refreshes in production.
- **Cloud Object Storage (`server/services/storage.service.ts`):** Supports local disk storage in development (`STORAGE_PROVIDER=local`) and automatic cloud object storage via Cloudinary or S3/R2 in production (`STORAGE_PROVIDER=cloudinary` with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- **Managed PostgreSQL:** Supports direct connection strings (`DATABASE_URL=postgres://...`) and TLS/SSL enforcement (`DB_SSL=true`) for Neon, Supabase, Railway, or AWS RDS.

### 10. Local Service URLs

| Service | URL / Connection | Notes |
| :--- | :--- | :--- |
| **Frontend v2 (Modern SPA)** | http://localhost:3001 | Vite 8 + React 19 + Tailwind v4 + shadcn/ui (`npm --prefix frontend-v2 run dev`) |
| **Frontend Legacy (CRA)** | http://localhost:3000 | Original CRA frontend (preserved for review) |
| **Backend API** | http://localhost:5001 | TypeScript + tsx watch (`/api/*`) |
| **API Healthcheck** | http://localhost:5001/health | Returns DB connectivity & uptime |
| **Adminer (DB UI)** | http://localhost:8082 | Web SQL client for MySQL & PostgreSQL |
| **MySQL (Host port)** | `localhost:3307` | System: `MySQL` · Server inside Adminer: `mysql` |
| **PostgreSQL (Host port)** | `localhost:5432` | System: `PostgreSQL` · Server inside Adminer: `postgres` |