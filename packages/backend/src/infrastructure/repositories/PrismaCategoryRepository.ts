import { PrismaClient, Category, Prisma } from '@prisma/client'
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id }
    })
  }

  async findByIdWithArticles(id: number): Promise<(Category & {
    articles: { id: number; title: string }[]
  }) | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        articles: {
          select: { id: true, title: true }
        }
      }
    })
  }

  async findMany(args?: {
    where?: Prisma.CategoryWhereInput
    orderBy?: Prisma.CategoryOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<Category[]> {
    return this.prisma.category.findMany(args)
  }

  async findManyWithArticles(args?: {
    where?: Prisma.CategoryWhereInput
    orderBy?: Prisma.CategoryOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<(Category & {
    articles: { id: number; title: string }[]
  })[]> {
    return this.prisma.category.findMany({
      ...args,
      include: {
        articles: {
          select: { id: true, title: true }
        }
      }
    })
  }

  async create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.prisma.category.create({ data })
  }

  async update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data
    })
  }

  async delete(id: number): Promise<Category> {
    return this.prisma.category.delete({
      where: { id }
    })
  }
}