export interface Credential {
  id: number;
  name: string;
  serviceProvider: string;
  credentialType: string;
  isValid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCredentialDto {
  name: string;
  provider: string;
  clientId: string;
  clientSecret: string;
}
