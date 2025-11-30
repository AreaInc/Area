import { Inject, Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from './drizzle.module.js';
import * as schema from './schema.js';

@Injectable()
export class DbService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async getAllUsers() {
    return this.db.select().from(schema.users);
  }

  async createUser(email: string, name?: string) {
    return this.db.insert(schema.users).values({ email, name }).returning();
  }
}
