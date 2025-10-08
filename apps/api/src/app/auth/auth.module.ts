import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { backendConfig } from '@challenge/data/backend';
import { BackendSupabaseService } from '../supabase/supabase.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: backendConfig.jwt.secret,
      signOptions: { expiresIn: backendConfig.jwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, BackendSupabaseService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
