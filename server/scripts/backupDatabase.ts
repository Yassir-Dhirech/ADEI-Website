import 'dotenv/config';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

async function backupDatabase(): Promise<void> {
  const isInsideDocker = fs.existsSync('/app');
  const BACKUP_DIR = isInsideDocker
    ? path.resolve(__dirname, '../backups')
    : path.resolve(__dirname, '../../backups');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_postgres_${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbName = process.env.DB_NAME || 'adei_pg';
  const dbUser = process.env.DB_USER || 'adei_pg_user';
  const dbPassword = process.env.DB_PASSWORD || 'change_me_postgres_password';

  console.log(`📦 Démarrage de la sauvegarde de "${dbName}" vers ${filename}...`);

  const dumpCmd = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -b -v -f "${filePath}"`;
  const env = { ...process.env, PGPASSWORD: dbPassword };

  exec(dumpCmd, { env }, (err) => {
    if (err) {
      console.warn(`⚠️ Outil local pg_dump non accessible ou échoué: ${err.message}`);
      console.log('💡 Note : Dans Docker, lancez directement :');
      console.log(`   docker compose exec postgres pg_dump -U ${dbUser} -d ${dbName} > backups/${filename}`);
      return;
    }
    console.log(`✅ Sauvegarde réussie : ${filePath}`);
    purgeOldBackups(BACKUP_DIR, 30);
  });
}

function purgeOldBackups(dir: string, maxDays: number) {
  const now = Date.now();
  const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file.startsWith('backup_postgres_') && file.endsWith('.sql')) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        console.log(`🧹 Ancienne sauvegarde purgée (> ${maxDays} jours) : ${file}`);
      }
    }
  }
}

void backupDatabase();