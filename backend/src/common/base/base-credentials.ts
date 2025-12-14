import { ICredentials } from "../types/interfaces";
import { CredentialType, ServiceProvider } from "../types/enums";

export abstract class BaseCredentials implements ICredentials {
  public id?: string;
  public userId: string;
  public serviceProvider: ServiceProvider;
  public type: CredentialType;
  public name: string;
  public data: Record<string, any>;

  constructor(
    userId: string,
    serviceProvider: ServiceProvider,
    type: CredentialType,
    name: string,
    data: Record<string, any>,
    id?: string,
  ) {
    this.id = id;
    this.userId = userId;
    this.serviceProvider = serviceProvider;
    this.type = type;
    this.name = name;
    this.data = data;
  }

  abstract isValid(): Promise<boolean>;

  async refresh(): Promise<void> {}

  protected encryptData(data: Record<string, any>): Record<string, any> {
    return data;
  }

  protected decryptData(data: Record<string, any>): Record<string, any> {
    return data;
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      serviceProvider: this.serviceProvider,
      type: this.type,
      name: this.name,
      data: this.encryptData(this.data),
    };
  }
}
