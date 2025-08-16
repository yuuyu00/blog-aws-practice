import { User, Prisma } from '@prisma/client'

export interface IUserRepository {
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findBySub(sub: string): Promise<User | null>
  findMany(args?: {
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<User[]>
  create(data: Prisma.UserCreateInput): Promise<User>
  update(id: number, data: Prisma.UserUpdateInput): Promise<User>
  delete(id: number): Promise<User>
}