import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Configuración del CLI de Prisma (migraciones, seed y generación del cliente).
// La API no usa este archivo: se conecta con PrismaService y DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
