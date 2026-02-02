import type { NextConfig } from 'next';
import path from 'path';
import { config } from 'dotenv';

// Charger .env.local en priorité (Next.js le fait aussi, mais ceci garantit le chargement)
config({ path: path.resolve(process.cwd(), '.env.local') });

const nextConfig: NextConfig = {};

export default nextConfig;
