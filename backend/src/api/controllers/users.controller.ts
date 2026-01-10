import { Controller, Delete, UseGuards, Req } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "../guards/auth.guard";
import { db } from "../../db/drizzle.module";
import {
  user,
  session,
  account,
  workflows,
  credentials,
  workflowExecutions,
  actionExecutions,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { Request } from "express";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("api/users")
@UseGuards(AuthGuard)
export class UsersController {
  @Delete("me")
  @ApiOperation({ summary: "Delete current user account" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  async deleteMe(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user.id;

    await db
      .delete(workflowExecutions)
      .where(eq(workflowExecutions.userId, userId));
    await db
      .delete(actionExecutions)
      .where(eq(actionExecutions.userId, userId));
    await db.delete(credentials).where(eq(credentials.userId, userId));
    await db.delete(workflows).where(eq(workflows.userId, userId));

    await db.delete(session).where(eq(session.userId, userId));
    await db.delete(account).where(eq(account.userId, userId));

    await db.delete(user).where(eq(user.id, userId));

    return { success: true };
  }
}
