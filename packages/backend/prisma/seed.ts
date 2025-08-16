import { PrismaClient } from "@prisma/client";

// シード実行用のヘルパー
async function main() {
  // 注意: シードスクリプトではD1を直接使用できないため、
  // SQLiteやリモートD1経由での実行が必要です
  const prisma = new PrismaClient();

  try {
    // カテゴリーの作成
    const techCategory = await prisma.category.create({
      data: {
        name: "Technology",
      },
    });

    const scienceCategory = await prisma.category.create({
      data: {
        name: "Science",
      },
    });

    const businessCategory = await prisma.category.create({
      data: {
        name: "Business",
      },
    });

    console.log("Created categories:", {
      techCategory,
      scienceCategory,
      businessCategory,
    });

    // テストユーザーの作成
    const testUser1 = await prisma.user.create({
      data: {
        name: "Test User 1",
        email: "test1@example.com",
      },
    });

    const testUser2 = await prisma.user.create({
      data: {
        name: "Test User 2",
        email: "test2@example.com",
      },
    });

    console.log("Created users:", { testUser1, testUser2 });

    // 記事の作成
    const article1 = await prisma.article.create({
      data: {
        title: "Getting Started with Cloudflare Workers",
        content:
          "Cloudflare Workers provide a serverless execution environment...",
        userId: testUser1.id,
        categories: {
          connect: [{ id: techCategory.id }],
        },
      },
    });

    const article2 = await prisma.article.create({
      data: {
        title: "GraphQL Best Practices",
        content: "When building GraphQL APIs, consider these best practices...",
        userId: testUser1.id,
        categories: {
          connect: [{ id: techCategory.id }, { id: businessCategory.id }],
        },
      },
    });

    const article3 = await prisma.article.create({
      data: {
        title: "The Future of Edge Computing",
        content: "Edge computing is revolutionizing how we think about...",
        userId: testUser2.id,
        categories: {
          connect: [{ id: scienceCategory.id }, { id: techCategory.id }],
        },
      },
    });

    console.log("Created articles:", { article1, article2, article3 });

    console.log("Seed data created successfully!");
  } catch (error) {
    console.error("Error creating seed data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
