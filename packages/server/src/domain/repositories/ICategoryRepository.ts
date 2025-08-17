import { Category, Prisma } from '@prisma/client'

export interface ICategoryRepository {
  findById(id: number): Promise<Category | null>
  findByIdWithArticles(id: number): Promise<(Category & {
    articles: { id: number; title: string }[]
  }) | null>
  findMany(args?: {
    where?: Prisma.CategoryWhereInput
    orderBy?: Prisma.CategoryOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<Category[]>
  findManyWithArticles(args?: {
    where?: Prisma.CategoryWhereInput
    orderBy?: Prisma.CategoryOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<(Category & {
    articles: { id: number; title: string }[]
  })[]>
  create(data: Prisma.CategoryCreateInput): Promise<Category>
  update(id: number, data: Prisma.CategoryUpdateInput): Promise<Category>
  delete(id: number): Promise<Category>
}