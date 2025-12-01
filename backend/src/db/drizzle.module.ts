import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export const DRIZZLE = 'DRIZZLE';

const connectionString = `postgresql://${process.env.POSTGRES_USER || 'area_user'}:${process.env.POSTGRES_PASSWORD || 'area_password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_NAME || 'area'}`;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => db
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
