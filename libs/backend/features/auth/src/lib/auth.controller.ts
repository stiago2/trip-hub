import { Controller, Get, Redirect, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, UserProfile } from './auth.service';
import { JwtAuthGuard } from '@org/guards';
import { CurrentUser } from './decorators/current-user.decorator';

const FRONTEND_URL = 'http://localhost:4200';

interface AuthenticatedUser {
  userId: string;
  email: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleLogin(): void {
    // Passport handles the redirect to Google
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  @Redirect()
  googleCallback(@Req() req: { user: UserProfile }): { url: string } {
    const { accessToken } = this.authService.generateJwt(req.user);
    return { url: `${FRONTEND_URL}/auth/callback?token=${accessToken}` };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserProfile> {
    return this.authService.getMe(user.userId);
  }
}
