import * as jose from "jose";
import type { Env } from "./types";

export interface AuthUser {
  sub: string;
  email?: string;
  role?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Authorization ヘッダーから JWT を検証し、ユーザー情報を返す
 */
export async function verifyJWT(
  authHeader: string | null,
  env: Env
): Promise<AuthUser | null> {
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(\S+)$/);
  if (!match) {
    console.log("match", match);
    throw new AuthError("Invalid authorization header format");
  }

  const token = match[1];

  try {
    console.log('Verifying JWT...');
    console.log('JWT Secret exists:', !!env.SUPABASE_JWT_SECRET);
    const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    console.log('JWT payload:', payload);

    const user: AuthUser = {
      sub: payload.sub as string,
      email: payload.email as string | undefined,
      role: payload.role as string | undefined,
      app_metadata: payload.app_metadata as Record<string, unknown> | undefined,
      user_metadata: payload.user_metadata as
        | Record<string, unknown>
        | undefined,
    };

    return user;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      throw new AuthError("Token has expired");
    } else if (error instanceof jose.errors.JWTInvalid) {
      throw new AuthError("Token is invalid");
    } else {
      throw new AuthError("Token verification failed");
    }
  }
}

/**
 * GraphQL リゾルバー用の認証ガード
 */
export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) {
    throw new AuthError("Authentication required");
  }
  return user;
}

/**
 * 特定のロールを要求するガード
 */
export function requireRole(
  user: AuthUser | null,
  requiredRole: string
): AuthUser {
  const authenticatedUser = requireAuth(user);

  if (authenticatedUser.role !== requiredRole) {
    throw new AuthError(`Role '${requiredRole}' required`);
  }

  return authenticatedUser;
}

