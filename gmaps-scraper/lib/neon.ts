import { neon } from '@neondatabase/serverless';
import path from 'path';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Charger .env.local si DATABASE_URL manque (cas: run depuis dossier parent type dropifi)
if (!process.env.DATABASE_URL && typeof window === 'undefined') {
  const candidates = [
    path.resolve(process.cwd(), 'gmaps-scraper', '.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      config({ path: p });
      if (process.env.DATABASE_URL) break;
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('DATABASE_URL missing; Neon DB disabled');
}

export const sql = databaseUrl ? neon(databaseUrl) : null;
