import { User } from "better-auth/types";

declare module "express" {
  interface Request {
    user?: User;
  }
}

