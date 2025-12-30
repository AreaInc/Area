import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";
import { google } from "googleapis";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../guards/auth.guard";
import { CurrentUser } from "../decorators/user.decorator";
import type { AuthUser } from "../types/user";
import { CredentialsService } from "../../services/credentials-service";
import { ServiceProvider } from "../../common/types/enums";
import { GmailCredentials } from "../../services/gmail";

@ApiTags("Service Authentication")
@Controller("api/auth")
export class ServiceAuthController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get(":provider/authorize")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Start OAuth flow for a service provider" })
  async authorize(
    @Param("provider") provider: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    if (provider !== ServiceProvider.GMAIL) {
      throw new HttpException("Provider not supported", HttpStatus.BAD_REQUEST);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_URL || "http://localhost:8080"}/api/auth/${provider}/callback`,
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      state: String(user.id),
      prompt: "consent",
    });

    return res.redirect(url);
  }

  @Get(":provider/callback")
  @ApiOperation({ summary: "Handle OAuth callback" })
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new HttpException("No code provided", HttpStatus.BAD_REQUEST);
    }

    if (provider !== ServiceProvider.GMAIL) {
      throw new HttpException("Provider not supported", HttpStatus.BAD_REQUEST);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.API_URL || "http://localhost:8080"}/api/auth/${provider}/callback`,
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);

      const userId = state;

      if (!userId) {
        throw new HttpException(
          "Invalid state (missing userId)",
          HttpStatus.BAD_REQUEST,
        );
      }

      const credentials = new GmailCredentials(userId, "Gmail Account", {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || "",
        tokenType: tokens.token_type || "Bearer",
        expiresAt: tokens.expiry_date ?? undefined,
        scope: tokens.scope,
      });

      await this.credentialsService.saveCredentials(credentials);

      return res.redirect(
        "http://localhost:8081/dashboard/services/gmail?success=true",
      );
    } catch (error) {
      console.error("OAuth error:", error);
      return res.redirect(
        "http://localhost:8081/dashboard/services/gmail?error=auth_failed",
      );
    }
  }
}
