export class User {
  constructor(
    public readonly id: string,
    public readonly sub: string,
    public email: string,
    public name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isValidName(): boolean {
    return this.name.length > 0 && this.name.length <= 100;
  }

  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  toPrismaModel() {
    return {
      id: this.id,
      sub: this.sub,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static fromPrismaModel(prismaUser: any): User {
    return new User(
      prismaUser.id,
      prismaUser.sub,
      prismaUser.email,
      prismaUser.name,
      prismaUser.createdAt,
      prismaUser.updatedAt
    );
  }
}