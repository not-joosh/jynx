import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] || 'thisismyverysecretsecretkeyHAHAHA',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateToken(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
