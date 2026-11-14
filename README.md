# ADEI Website — ENSA Fès

Full-stack web platform for **ADEI** (*Association des Étudiants Ingénieurs* — ENSA Fès):
- **Frontend:** React 19 + React Router 7 + Framer Motion (`/frontend`)
- **Backend:** Node.js 20 + Express + Sequelize REST API (`/server`)
- **Databases:** MySQL 8.0 (active) + PostgreSQL 16 (staged for Phase 3 migration) + Adminer

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
### 4. Create an Admin Account
Admin accounts are never created automatically. To create your first administrator, ensure `ADMIN_USERNAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (minimum 12 characters) are set in your `.env`, then run:

```bash
docker compose exec api node scripts/createAdmin.js
```

### 5. Restore a MySQL Dump from `./backups`
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

### 6. Local Service URLs

| Service | URL / Connection | Notes |
| :--- | :--- | :--- |
| **Frontend (React)** | http://localhost:3000 | CRA dev server with hot reload |
| **Backend API** | http://localhost:5001 | Nodemon hot reload |
| **API Healthcheck** | http://localhost:5001/health | Returns DB connectivity & uptime |
| **Adminer (DB UI)** | http://localhost:8082 | Supports both MySQL & PostgreSQL |
| **MySQL (Host port)** | `localhost:3307` | System: `MySQL` · Server inside Adminer: `mysql` |
| **PostgreSQL (Host port)** | `localhost:5432` | System: `PostgreSQL` · Server inside Adminer: `postgres` |