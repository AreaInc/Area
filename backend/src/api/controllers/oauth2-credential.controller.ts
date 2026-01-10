import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OAuth2Service } from '../../services/oauth2/oauth2.service';
import { AuthGuard } from '../guards/auth.guard';
import { Public } from '../decorators/public.decorator';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@ApiTags('OAuth2 Credentials')
@Controller('api/oauth2-credential')
export class OAuth2CredentialController {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Get('auth')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Initiate OAuth2 authentication flow' })
  @ApiQuery({ name: 'provider', description: 'OAuth2 provider (gmail, google)', required: true })
  @ApiQuery({ name: 'redirectUrl', description: 'URL to redirect after auth', required: false })
  @ApiResponse({ status: 302, description: 'Redirects to OAuth2 provider consent screen' })
  async initiateAuth(
    @Query('provider') provider: string,
    @Query('redirectUrl') redirectUrl: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    if (!provider) {
      throw new BadRequestException('Provider is required');
    }

    const { authUrl } = await this.oauth2Service.getAuthUrl(
      provider,
      user.id,
      redirectUrl,
    );

    return res.redirect(authUrl);
  }

  @Get('callback')
  @Public()
  @ApiOperation({ summary: 'OAuth2 callback endpoint' })
  @ApiQuery({ name: 'code', description: 'Authorization code from OAuth2 provider', required: true })
  @ApiQuery({ name: 'state', description: 'State token for CSRF protection', required: true })
  @ApiResponse({ status: 200, description: 'OAuth2 flow completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired state token' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: 'Missing code or state parameter',
      });
    }

    const result = await this.oauth2Service.handleCallback(code, state);

    if (result.success) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/credentials?success=true&credentialId=${result.credentialId}`,
      );
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(
        `${frontendUrl}/credentials?success=false&error=${encodeURIComponent(result.error || 'Unknown error')}`,
      );
    }
  }

  @Delete(':credentialId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete OAuth2 credentials' })
  @ApiResponse({ status: 200, description: 'Credentials deleted successfully' })
  @ApiResponse({ status: 404, description: 'Credentials not found' })
  async deleteCredentials(
    @Param('credentialId') credentialId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !user.id) {
      throw new BadRequestException('User not authenticated');
    }

    await this.oauth2Service.deleteCredentials(user.id, parseInt(credentialId));

    return {
      success: true,
      message: 'Credentials deleted successfully',
    };
  }
}
