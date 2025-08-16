import { Article, Prisma } from '@prisma/client'

export interface IArticleRepository {
  findById(id: number): Promise<Article | null>
  findByIdWithRelations(id: number): Promise<(Article & {
    author: { id: number; name: string | null; email: string }
    categories: { id: number; name: string }[]
  }) | null>
  findMany(args?: {
    where?: Prisma.ArticleWhereInput
    orderBy?: Prisma.ArticleOrderByWithRelationInput
    take?: number
    skip?: number
    include?: Prisma.ArticleInclude
  }): Promise<Article[]>
  findManyWithRelations(args?: {
    where?: Prisma.ArticleWhereInput
    orderBy?: Prisma.ArticleOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<(Article & {
    author: { id: number; name: string | null; email: string }
    categories: { id: number; name: string }[]
  })[]>
  create(data: Prisma.ArticleCreateInput): Promise<Article>
  update(id: number, data: Prisma.ArticleUpdateInput): Promise<Article>
  delete(id: number): Promise<Article>
}