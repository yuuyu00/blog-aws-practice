import type { PrismaClient } from '@prisma/client';
import type { AuthUser } from './auth';
import type { Container } from './infrastructure/container';

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_JWT_SECRET: string;
  GRAPHQL_INTROSPECTION?: string;
  GRAPHQL_PLAYGROUND?: string;
  CORS_ORIGIN?: string;
  [key: string]: unknown;
}

export interface GraphQLContext {
  prisma: PrismaClient;
  user: AuthUser | null;
  env: Env;
  container: Container;
}