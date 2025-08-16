import { PrismaClient } from '@prisma/client'
import { PrismaUserRepository } from './repositories/PrismaUserRepository'
import { PrismaArticleRepository } from './repositories/PrismaArticleRepository'
import { PrismaCategoryRepository } from './repositories/PrismaCategoryRepository'
import { UserUseCase } from '../application/usecases/UserUseCase'
import { ArticleUseCase } from '../application/usecases/ArticleUseCase'
import { CategoryUseCase } from '../application/usecases/CategoryUseCase'

export interface Container {
  useCases: {
    user: UserUseCase
    article: ArticleUseCase
    category: CategoryUseCase
  }
}

export function createContainer(prisma: PrismaClient): Container {
  const userRepository = new PrismaUserRepository(prisma)
  const articleRepository = new PrismaArticleRepository(prisma)
  const categoryRepository = new PrismaCategoryRepository(prisma)

  const userUseCase = new UserUseCase(userRepository)
  const articleUseCase = new ArticleUseCase(
    articleRepository,
    userRepository,
    categoryRepository
  )
  const categoryUseCase = new CategoryUseCase(categoryRepository)

  return {
    useCases: {
      user: userUseCase,
      article: articleUseCase,
      category: categoryUseCase
    }
  }
}