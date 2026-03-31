import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleMobileWebStrategy extends PassportStrategy(Strategy, 'google-mobile-web') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env['GOOGLE_CLIENT_ID'] ?? '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] ?? '',
      callbackURL: process.env['GOOGLE_MOBILE_WEB_CALLBACK_URL'] ?? 'http://localhost:3000/api/auth/google/mobile-web/callback',
      scope: ['profile', 'email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const user = await this.authService.validateGoogleUser({
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
    done(null, user);
  }
}
