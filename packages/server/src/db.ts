import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { Env } from './types'

export type { Env } from './types'

export function createPrismaClient(db: D1Database) {
  const adapter = new PrismaD1(db)
  return new PrismaClient({ adapter })
}