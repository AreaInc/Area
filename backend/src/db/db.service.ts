import { Inject, Injectable } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "./drizzle.module";
import * as schema from "./schema";

@Injectable()
export class DbService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getAllUsers() {
    return this.db.select().from(schema.user);
  }

  async createUser(
    email: string,
    name: string,
    emailVerified: boolean = false,
  ) {
    return this.db
      .insert(schema.user)
      .values({
        id: crypto.randomUUID(),
        email,
        name,
        emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  }
}
