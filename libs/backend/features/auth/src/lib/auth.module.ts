import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleMobileStrategy } from './strategies/google-mobile.strategy';
import { GoogleMobileWebStrategy } from './strategies/google-mobile-web.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'changeme',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleMobileStrategy, GoogleMobileWebStrategy],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
