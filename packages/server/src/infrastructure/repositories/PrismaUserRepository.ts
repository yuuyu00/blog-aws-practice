import { PrismaClient, User, Prisma } from '@prisma/client'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id }
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    })
  }

  async findBySub(sub: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { sub }
    })
  }

  async findMany(args?: {
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<User[]> {
    return this.prisma.user.findMany(args)
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data
    })
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id }
    })
  }
}