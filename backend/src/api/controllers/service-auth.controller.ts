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
      // We need to ensure this matches exactly what's registered in Google Console
      // For localhost, it's often http://localhost:8080/api/auth/gmail/callback
      `${process.env.API_URL || "http://localhost:8080"}/api/auth/${provider}/callback`,
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
    ];

    const url = oauth2Client.generateAuthUrl({
      // 'offline' is crucial for receiving a refresh_token
      access_type: "offline",
      scope: scopes,
      // Pass userId in state (could be signed/encrypted in production)
      state: String(user.id),
      // Force prompt to ensure we get a refresh token even if previously authorized
      prompt: "consent",
    });

    return res.redirect(url);
  }

  @Get(":provider/callback")
  @ApiOperation({ summary: "Handle OAuth callback" })
  async callback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") state: string, // contains userId
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

      // In a production app, we should verify the 'state' matches the authenticated user
      // or retrieve the user from the session if cookies are working.
      // Here we trust 'state' contains the userId for simplicity of the MVP.
      const userId = state;

      if (!userId) {
        throw new HttpException("Invalid state (missing userId)", HttpStatus.BAD_REQUEST);
      }

      const credentials = new GmailCredentials(userId, "Gmail Account", {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || "", // Might be empty if not prompt=consent
        tokenType: tokens.token_type || "Bearer",
        expiresAt: tokens.expiry_date ?? undefined,
        scope: tokens.scope,
      });

      await this.credentialsService.saveCredentials(credentials);

      // Redirect back to the frontend dashboard
      // Assuming frontend is at port 8081
      return res.redirect("http://localhost:8081/dashboard/services/gmail?success=true");

    } catch (error) {
      console.error("OAuth error:", error);
      return res.redirect("http://localhost:8081/dashboard/services/gmail?error=auth_failed");
    }
  }
}
