import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../types/user";

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
