import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { DRIZZLE } from "../../db/drizzle.module";
import * as schema from "../../db/schema";
import { services } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ServiceProvider } from "../../common/types/enums";

@Injectable()
export class ServicesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
  ) {}

  async getAllServices() {
    return this.db.select().from(services).where(eq(services.isActive, true));
  }

  async getService(provider: ServiceProvider | string) {
    const [service] = await this.db
      .select()
      .from(services)
      .where(eq(services.provider, provider as any))
      .limit(1);

    return service || null;
  }

  async getServiceById(id: number) {
    const [service] = await this.db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);

    if (!service) {
      throw new NotFoundException(`Service with id ${id} not found`);
    }

    return service;
  }
}
