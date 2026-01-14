import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Req,
  Res,
  Body,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { OAuth2Service } from "../../services/oauth2/oauth2.service";
import { AuthGuard } from "../guards/auth.guard";
import { Public } from "../decorators/public.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  DeleteCredentialsResponseDto,
  CreateCredentialDto,
  CredentialResponseDto,
} from "../dtos";

@ApiTags("OAuth2 Credentials")
@Controller("api/oauth2-credential")
export class OAuth2CredentialController {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List all credentials for the current user",
    description:
      "Returns a list of all OAuth2 credentials belonging to the authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "List of credentials",
    type: [CredentialResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async listCredentials(@Req() req: Request) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.oauth2Service.listCredentials(user.id);
  }

  @Get("auth")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Initiate OAuth2 authentication flow",
    description:
      "Initiates the OAuth2 authentication flow by redirecting the user to the OAuth2 provider's consent screen. After authorization, the user will be redirected to the callback endpoint. The state parameter is automatically generated for CSRF protection. Requires a credentialId to use user-provided OAuth2 client credentials.",
  })
  @ApiQuery({
    name: "credentialId",
    description: "Credential ID to use for OAuth2 flow",
    required: true,
    example: 123,
  })
  @ApiQuery({
    name: "redirectUrl",
    description:
      "Optional URL to redirect to after successful authentication. If not provided, uses the default frontend URL.",
    required: false,
    example: "http://localhost:3000/credentials",
  })
  @ApiResponse({
    status: 302,
    description: "Redirects to OAuth2 provider consent screen",
  })
  @ApiResponse({
    status: 400,
    description: "Credential ID is required or user not authenticated",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async initiateAuth(
    @Query("credentialId") credentialId: string,
    @Query("redirectUrl") redirectUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    if (!credentialId) {
      throw new BadRequestException("Credential ID is required");
    }

    const parsedCredentialId = parseInt(credentialId, 10);
    if (isNaN(parsedCredentialId)) {
      throw new BadRequestException("Invalid credential ID format");
    }

    const { authUrl } = await this.oauth2Service.getAuthUrl(
      user.id,
      parsedCredentialId,
      redirectUrl,
    );

    return res.redirect(authUrl);
  }

  @Get("callback")
  @Public()
  @ApiOperation({
    summary: "OAuth2 callback endpoint",
    description:
      "Handles the OAuth2 callback from the provider. Exchanges the authorization code for access and refresh tokens, encrypts and stores them in the database, then redirects to the frontend with success/error status. This endpoint is public and does not require authentication.",
  })
  @ApiQuery({
    name: "code",
    description:
      "Authorization code received from OAuth2 provider after user consent",
    required: true,
    example: "4/0AeanS...",
  })
  @ApiQuery({
    name: "state",
    description:
      "State token for CSRF protection. Must match the state token generated during the auth initiation.",
    required: true,
    example: "random-state-token-123",
  })
  @ApiResponse({
    status: 302,
    description:
      "Redirects to frontend with success status and credential ID, or error message if failed",
  })
  @ApiResponse({
    status: 400,
    description:
      "Missing code or state parameter, or invalid/expired state token",
  })
  async handleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: "Missing code or state parameter",
      });
    }

    const result = await this.oauth2Service.handleCallback(code, state);

    if (result.success) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/credentials?success=true&credentialId=${result.credentialId}`,
      );
    } else {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/credentials?success=false&error=${encodeURIComponent(result.error || "Unknown error")}`,
      );
    }
  }

  @Get(":credentialId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get OAuth2 callback URL",
    description:
      "Returns the OAuth2 callback URL that should be configured in the OAuth provider's console.",
  })
  @ApiParam({
    name: "credentialId",
    description: "Credential ID",
    type: Number,
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: "Credential details",
    type: CredentialResponseDto,
  })
  @ApiResponse({ status: 404, description: "Credential not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCredential(
    @Param("credentialId") credentialId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    const parsedCredentialId = parseInt(credentialId, 10);
    if (isNaN(parsedCredentialId)) {
      throw new BadRequestException("Invalid credential ID format");
    }

    return this.oauth2Service.getCredential(user.id, parsedCredentialId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create new OAuth2 credential with client ID and secret",
    description:
      "Creates a new OAuth2 credential entry with user-provided client ID and client secret. This credential can then be used to initiate the OAuth flow and connect to the service. The callback URL for OAuth configuration is: " +
      (process.env.OAUTH_CALLBACK_URL ||
        "http://localhost:8080/api/oauth2-credential/callback"),
  })
  @ApiBody({ type: CreateCredentialDto })
  @ApiResponse({
    status: 201,
    description: "Credential created successfully",
    type: CredentialResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request - missing required fields",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createCredential(
    @Body() dto: CreateCredentialDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    return this.oauth2Service.createCredential(user.id, dto);
  }

  @Delete(":credentialId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Delete OAuth2 credentials",
    description:
      "Permanently deletes OAuth2 credentials for the authenticated user. Only credentials belonging to the user can be deleted.",
  })
  @ApiParam({
    name: "credentialId",
    description: "Credential ID to delete",
    type: Number,
    example: 123,
  })
  @ApiResponse({
    status: 200,
    description: "Credentials deleted successfully",
    type: DeleteCredentialsResponseDto,
  })
  @ApiResponse({ status: 404, description: "Credentials not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async deleteCredentials(
    @Param("credentialId") credentialId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException("User not authenticated");
    }

    const parsedCredentialId = parseInt(credentialId, 10);
    if (isNaN(parsedCredentialId)) {
      throw new BadRequestException("Invalid credential ID format");
    }

    await this.oauth2Service.deleteCredentials(user.id, parsedCredentialId);

    return {
      success: true,
      message: "Credentials deleted successfully",
    };
  }
}
