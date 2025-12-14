import { Injectable, Inject } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import { ServiceProvider } from "../common/types/enums";
import { BaseService } from "../common/base/base-service";

@Injectable()
export class ServicesService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async saveService(
    service: BaseService,
  ): Promise<typeof schema.services.$inferSelect> {
    const metadata = service.getMetadata();

    const [saved] = await this.db
      .insert(schema.services)
      .values({
        provider:
          metadata.provider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
        name: metadata.name,
        description: metadata.description,
        imageUrl: metadata.imageUrl || null,
        version: metadata.version,
        supportedActions: metadata.supportedActions as unknown as string[],
        credentialTypes: metadata.credentialTypes as unknown as string[],
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.services.provider,
        set: {
          name: metadata.name,
          description: metadata.description,
          imageUrl: metadata.imageUrl || null,
          version: metadata.version,
          supportedActions: metadata.supportedActions as unknown as string[],
          credentialTypes: metadata.credentialTypes as unknown as string[],
          updatedAt: new Date(),
        },
      })
      .returning();

    return saved;
  }

  async getService(provider: ServiceProvider) {
    const [service] = await this.db
      .select()
      .from(schema.services)
      .where(
        eq(
          schema.services.provider,
          provider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
        ),
      )
      .limit(1);

    return service;
  }

  async getAllServices() {
    return this.db
      .select()
      .from(schema.services)
      .where(eq(schema.services.isActive, true));
  }
}
