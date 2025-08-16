import { PrismaClient, Article, Prisma } from '@prisma/client'
import { IArticleRepository } from '../../domain/repositories/IArticleRepository'

export class PrismaArticleRepository implements IArticleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: number): Promise<Article | null> {
    return this.prisma.article.findUnique({
      where: { id }
    })
  }

  async findByIdWithRelations(id: number): Promise<(Article & {
    author: { id: number; name: string | null; email: string }
    categories: { id: number; name: string }[]
  }) | null> {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        categories: {
          select: { id: true, name: true }
        }
      }
    })

    if (!article) return null

    return {
      ...article,
      author: article.user,
      categories: article.categories
    }
  }

  async findMany(args?: {
    where?: Prisma.ArticleWhereInput
    orderBy?: Prisma.ArticleOrderByWithRelationInput
    take?: number
    skip?: number
    include?: Prisma.ArticleInclude
  }): Promise<Article[]> {
    return this.prisma.article.findMany(args)
  }

  async findManyWithRelations(args?: {
    where?: Prisma.ArticleWhereInput
    orderBy?: Prisma.ArticleOrderByWithRelationInput
    take?: number
    skip?: number
  }): Promise<(Article & {
    author: { id: number; name: string | null; email: string }
    categories: { id: number; name: string }[]
  })[]> {
    const articles = await this.prisma.article.findMany({
      ...args,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        categories: {
          select: { id: true, name: true }
        }
      }
    })

    return articles.map(article => ({
      ...article,
      author: article.user,
      categories: article.categories
    }))
  }

  async create(data: Prisma.ArticleCreateInput): Promise<Article> {
    return this.prisma.article.create({ data })
  }

  async update(id: number, data: Prisma.ArticleUpdateInput): Promise<Article> {
    return this.prisma.article.update({
      where: { id },
      data
    })
  }

  async delete(id: number): Promise<Article> {
    return this.prisma.article.delete({
      where: { id }
    })
  }
}