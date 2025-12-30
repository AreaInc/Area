import { Injectable, Inject } from "@nestjs/common";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import * as schema from "../db/schema";
import { BaseCredentials } from "../common/base/base-credentials";
import { ServiceProvider, CredentialType } from "../common/types/enums";
import { GmailCredentials } from "./gmail";

@Injectable()
export class CredentialsService {
  constructor(@Inject(DRIZZLE) private db: PostgresJsDatabase<typeof schema>) {}

  async saveCredentials(
    credentials: BaseCredentials,
  ): Promise<typeof schema.credentials.$inferSelect> {
    const credentialData = credentials.toJSON();

    if (credentials.id) {
      const credId = parseInt(String(credentials.id), 10);
      const [updated] = await this.db
        .update(schema.credentials)
        .set({
          name: String(credentialData.name),
          data: credentialData.data as Record<string, unknown>,
          isValid: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.credentials.id, credId))
        .returning();

      return updated;
    } else {
      const [created] = await this.db
        .insert(schema.credentials)
        .values({
          userId: String(credentialData.userId),
          serviceProvider:
            credentialData.serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
          type: credentialData.type as unknown as (typeof schema.credentialTypeEnum.enumValues)[number],
          name: String(credentialData.name),
          data: credentialData.data as Record<string, unknown>,
          isValid: true,
        })
        .returning();

      return created;
    }
  }

  async getCredentialsById(id: number): Promise<BaseCredentials | null> {
    const [credential] = await this.db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.id, id))
      .limit(1);

    if (!credential) {
      return null;
    }

    return this.mapToCredentials(credential);
  }

  async getUserCredentials(userId: string): Promise<BaseCredentials[]> {
    const results = await this.db
      .select()
      .from(schema.credentials)
      .where(eq(schema.credentials.userId, userId));

    return results.map((cred) => this.mapToCredentials(cred));
  }

  async getUserServiceCredentials(
    userId: string,
    serviceProvider: ServiceProvider,
  ): Promise<BaseCredentials[]> {
    const results = await this.db
      .select()
      .from(schema.credentials)
      .where(
        and(
          eq(schema.credentials.userId, userId),
          eq(
            schema.credentials.serviceProvider,
            serviceProvider as unknown as (typeof schema.serviceProviderEnum.enumValues)[number],
          ),
        ),
      );

    return results.map((cred) => this.mapToCredentials(cred));
  }

  async deleteCredentials(id: number): Promise<boolean> {
    const result = await this.db
      .delete(schema.credentials)
      .where(eq(schema.credentials.id, id));

    return Array.isArray(result) ? result.length > 0 : false;
  }

  private mapToCredentials(
    dbCredential: typeof schema.credentials.$inferSelect,
  ): BaseCredentials {
    const provider = dbCredential.serviceProvider as ServiceProvider;
    const type = dbCredential.type as CredentialType;

    switch (provider) {
      case ServiceProvider.GMAIL:
        return GmailCredentials.fromJSON({
          id: String(dbCredential.id),
          userId: String(dbCredential.userId),
          serviceProvider: provider,
          type,
          name: String(dbCredential.name),
          data: dbCredential.data as Record<string, unknown>,
        });
      default:
        throw new Error(`Unsupported service provider: ${provider}`);
    }
  }

  async updateValidity(id: number, isValid: boolean): Promise<void> {
    await this.db
      .update(schema.credentials)
      .set({
        isValid,
        updatedAt: new Date(),
      })
      .where(eq(schema.credentials.id, id));
  }
}
