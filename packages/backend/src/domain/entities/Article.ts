export class Article {
  constructor(
    public readonly id: string,
    public title: string,
    public content: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public categories?: any[]
  ) {}

  canBeEditedBy(userId: number): boolean {
    return this.userId === userId.toString();
  }

  canBeDeletedBy(userId: number): boolean {
    return this.userId === userId.toString();
  }

  isValidTitle(): boolean {
    return this.title.length > 0 && this.title.length <= 255;
  }

  isValidContent(): boolean {
    return this.content.length > 0;
  }

  toPrismaModel() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromPrismaModel(prismaArticle: any): Article {
    return new Article(
      prismaArticle.id,
      prismaArticle.title,
      prismaArticle.content,
      prismaArticle.userId,
      prismaArticle.createdAt,
      prismaArticle.updatedAt,
      prismaArticle.categories
    );
  }
}