# Drizzle ORM Setup

## Usage

### In Services

Inject the `DbService` or use the `DRIZZLE` token directly:

```typescript
import { Injectable } from '@nestjs/common';
import { DbService } from './db/db.service';

@Injectable()
export class YourService {
  constructor(private dbService: DbService) {}

  async getUsers() {
    return this.dbService.getAllUsers();
  }
}
```

Or inject Drizzle directly:

```typescript
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from './db/drizzle.module';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './db/schema';

@Injectable()
export class YourService {
  constructor(
    @Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>,
  ) {}
}
```

## Database Commands

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes directly (dev only)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

## Schema

Define your tables in `src/db/schema.ts` using Drizzle's schema builder.
