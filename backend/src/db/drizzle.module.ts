import { Global, Module } from "@nestjs/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export const DRIZZLE = "DRIZZLE";

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_NAME}`;

const client = postgres(connectionString);
export const db = drizzle(client, { schema });

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      useFactory: () => db,
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
