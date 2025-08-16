import { User } from '@prisma/client'
import { IUserRepository } from '../../domain/repositories/IUserRepository'
import { NotFoundError } from '../../domain/errors/NotFoundError'
import { ValidationError } from '../../domain/errors/ValidationError'
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError'

export class UserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUser(id: number): Promise<User | null> {
    return this.userRepository.findById(id)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email)
  }

  async getUserBySub(sub: string): Promise<User | null> {
    return this.userRepository.findBySub(sub)
  }

  async getUsers(args?: {
    take?: number
    skip?: number
  }): Promise<User[]> {
    return this.userRepository.findMany({
      orderBy: { id: 'desc' },
      take: args?.take,
      skip: args?.skip
    })
  }

  async createUser(input: { email: string; name: string; sub: string }): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email)
    if (existingUser) {
      throw new ValidationError('email', 'Email already exists')
    }

    return this.userRepository.create({
      email: input.email,
      name: input.name,
      sub: input.sub
    })
  }

  async updateUser(id: number, input: { email?: string; name?: string }): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User', id.toString())
    }

    if (input.email && input.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(input.email)
      if (existingUser) {
        throw new ValidationError('email', 'Email is already in use')
      }
    }

    return this.userRepository.update(id, {
      email: input.email,
      name: input.name
    })
  }

  async deleteUser(id: number): Promise<User> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User', id.toString())
    }

    return this.userRepository.delete(id)
  }
}