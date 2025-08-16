export class Category {
  constructor(
    public readonly id: string,
    public name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public articles?: any[]
  ) {}

  isValidName(): boolean {
    return this.name.length > 0 && this.name.length <= 100;
  }

  canBeDeleted(): boolean {
    return !this.articles || this.articles.length === 0;
  }

  toPrismaModel() {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromPrismaModel(prismaCategory: any): Category {
    return new Category(
      prismaCategory.id,
      prismaCategory.name,
      prismaCategory.createdAt,
      prismaCategory.updatedAt,
      prismaCategory.articles
    );
  }
}