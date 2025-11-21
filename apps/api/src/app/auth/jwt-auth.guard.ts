import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'] || request.headers['Authorization'];
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.substring('Bearer '.length).trim();

    const supabaseUrl = process.env['SUPABASE_URL'];
    const supabaseJwtAudience = process.env['SUPABASE_JWT_AUD'] || 'authenticated';

    if (!supabaseUrl) {
      throw new UnauthorizedException('Auth not configured');
    }

    const jwksUrl = new URL(`/auth/v1/keys`, supabaseUrl);
    try {
      if (!this.jwks) {
        this.jwks = createRemoteJWKSet(jwksUrl);
      }
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: supabaseJwtAudience,
      });
      request.user = payload as JWTPayload & { sub?: string; email?: string };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


