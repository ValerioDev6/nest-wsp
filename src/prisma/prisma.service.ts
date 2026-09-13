import { Injectable } from '@nestjs/common';
import { resolve } from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
// import { PrismaClient } from '@prisma/client';

/**
 * El CLI de Prisma resuelve las rutas relativas de SQLite contra el directorio
 * del schema (prisma/), mientras que el adapter de better-sqlite3 las resuelve
 * contra el directorio de trabajo. Para que ambos apunten al mismo archivo
 * (prisma/dev.db), normalizamos la URL relativa contra la carpeta prisma/.
 */
function resolveDatabaseUrl(raw: string): string {
  const url = raw.startsWith('file:') ? raw : `file:${raw}`;
  const rest = url.slice('file:'.length);
  if (rest.startsWith('/')) {
    return url;
  }
  const filename = rest.replace(/^\.\//, '');
  return `file:${resolve(process.cwd(), 'prisma', filename)}`;
}

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaBetterSqlite3({
      url: resolveDatabaseUrl(process.env.DATABASE_URL ?? 'file:./dev.db'),
    });
    super({ adapter });
  }
}