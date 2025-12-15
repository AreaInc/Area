export interface User {
  id: string;
  email: string;
  name: string; // Full name or Display name
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}
