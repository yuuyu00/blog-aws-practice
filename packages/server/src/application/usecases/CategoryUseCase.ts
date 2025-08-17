import { Category } from '@prisma/client'
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import { CreateCategoryInput, UpdateCategoryInput } from '../../gqlTypes'
import { NotFoundError } from '../../domain/errors/NotFoundError'
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError'

export class CategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async getCategory(id: number) {
    return this.categoryRepository.findByIdWithArticles(id)
  }

  async getCategories(args?: {
    take?: number
    skip?: number
  }) {
    return this.categoryRepository.findManyWithArticles({
      orderBy: { name: 'asc' },
      take: args?.take,
      skip: args?.skip
    })
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    return this.categoryRepository.create({
      name: input.name
    })
  }

  async updateCategory(id: number, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.categoryRepository.findById(id)
    if (!category) {
      throw new NotFoundError('Category', id.toString())
    }

    return this.categoryRepository.update(id, {
      name: input.name || undefined
    })
  }

  async deleteCategory(id: number): Promise<Category> {
    const category = await this.categoryRepository.findByIdWithArticles(id)
    if (!category) {
      throw new NotFoundError('Category', id.toString())
    }

    if (category.articles.length > 0) {
      throw new BusinessRuleViolationError('Cannot delete category with associated articles')
    }

    return this.categoryRepository.delete(id)
  }
}