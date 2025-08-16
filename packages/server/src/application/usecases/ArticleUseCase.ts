import { Article } from '@prisma/client'
import { IArticleRepository } from '../../domain/repositories/IArticleRepository'
import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import { CreateArticleInput, UpdateArticleInput } from '../../gqlTypes'
import { NotFoundError, UnauthorizedError, ValidationError } from '../../domain/errors'
import { Article as ArticleEntity } from '../../domain/entities'

export class ArticleUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly userRepository: IUserRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async getArticle(id: number) {
    return this.articleRepository.findByIdWithRelations(id)
  }

  async getArticles(args?: {
    take?: number
    skip?: number
  }) {
    return this.articleRepository.findManyWithRelations({
      orderBy: { id: 'desc' },
      take: args?.take,
      skip: args?.skip
    })
  }

  async getArticlesByAuthor(authorId: number) {
    return this.articleRepository.findManyWithRelations({
      where: { userId: authorId },
      orderBy: { id: 'desc' }
    })
  }

  async createArticle(input: CreateArticleInput, authorId: number): Promise<Article> {
    const author = await this.userRepository.findById(authorId)
    if (!author) {
      throw new NotFoundError('Author', authorId.toString())
    }

    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('title', 'Title is required')
    }
    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('content', 'Content is required')
    }

    if (input.categoryIds && input.categoryIds.length > 0) {
      const categories = await Promise.all(
        input.categoryIds.map(id => this.categoryRepository.findById(id))
      )
      
      const notFoundIds = input.categoryIds.filter(
        (id, index) => !categories[index]
      )
      
      if (notFoundIds.length > 0) {
        throw new NotFoundError(`Categories`, notFoundIds.join(', '))
      }
    }

    return this.articleRepository.create({
      title: input.title,
      content: input.content,
      user: {
        connect: { id: authorId }
      },
      categories: input.categoryIds ? {
        connect: input.categoryIds.map(id => ({ id }))
      } : undefined
    })
  }

  async updateArticle(id: number, input: UpdateArticleInput, userId: number): Promise<Article> {
    const article = await this.articleRepository.findByIdWithRelations(id)
    if (!article) {
      throw new NotFoundError('Article', id.toString())
    }

    const articleEntity = ArticleEntity.fromPrismaModel(article)
    if (!articleEntity.canBeEditedBy(userId)) {
      throw new UnauthorizedError('update', 'article')
    }

    if (input.title !== undefined && input.title !== null && input.title.trim().length === 0) {
      throw new ValidationError('title', 'Title cannot be empty')
    }
    if (input.content !== undefined && input.content !== null && input.content.trim().length === 0) {
      throw new ValidationError('content', 'Content cannot be empty')
    }

    if (input.categoryIds !== undefined && input.categoryIds !== null) {
      if (input.categoryIds.length > 0) {
        const categories = await Promise.all(
          input.categoryIds.map(categoryId => this.categoryRepository.findById(categoryId))
        )
        
        const notFoundIds = input.categoryIds.filter(
          (categoryId, index) => !categories[index]
        )
        
        if (notFoundIds.length > 0) {
          throw new NotFoundError('Categories', notFoundIds.join(', '))
        }
      }
    }

    return this.articleRepository.update(id, {
      title: input.title || undefined,
      content: input.content || undefined,
      categories: input.categoryIds !== undefined && input.categoryIds !== null ? {
        set: input.categoryIds.map(categoryId => ({ id: categoryId }))
      } : undefined
    })
  }

  async deleteArticle(id: number, userId: number): Promise<Article> {
    const article = await this.articleRepository.findByIdWithRelations(id)
    if (!article) {
      throw new NotFoundError('Article', id.toString())
    }

    const articleEntity = ArticleEntity.fromPrismaModel(article)
    if (!articleEntity.canBeDeletedBy(userId)) {
      throw new UnauthorizedError('delete', 'article')
    }

    return this.articleRepository.delete(id)
  }
}