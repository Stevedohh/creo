import path from 'node:path';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env['DATABASE_URL'] ??
  'postgresql://creo:creo@localhost:5433/creo?schema=public';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema', 'schema.prisma'),
  datasource: {
    url: databaseUrl,
  },
  migrate: {
    url: databaseUrl,
  },
});
