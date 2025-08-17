import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    // 既存データをクリア
    await tx.article.deleteMany({});
    await tx.category.deleteMany({});
    await tx.user.deleteMany({});

    const users = await Promise.all(
      [
        {
          sub: "auth0|yoshida-123456",
          name: "吉田兼好",
          email: "yoshida@example.com",
        },
        {
          sub: "auth0|seisho-123456",
          name: "清少納言",
          email: "seisho@example.com",
        },
        {
          sub: "auth0|kamo-123456",
          name: "鴨長明",
          email: "kamo@example.com",
        },
      ].map(async (user) =>
        tx.user.create({
          data: { ...user },
        })
      )
    );

    const categories = await Promise.all(
      [
        {
          name: "随筆",
        },
        {
          name: "日記文学",
        },

        {
          name: "歌物語",
        },
      ].map((category) => tx.category.create({ data: category }))
    );

    const articles = [
      {
        title: "つれづれなるままに",
        content:
          "つれづれなるままに、日暮らし、硯にむかひて、心にうつりゆくよしなし事を、そこはかとなく書きつくれば、あやしうこそものぐるほしけれ。",
        userId: users[0].id,
      },

      {
        title: "仁和寺にある法師",
        content:
          "仁和寺にある法師、笙を吹きなむとて、夜もすがら吹きあかしけり。",
        userId: users[0].id,
      },

      {
        title: "をこがましきもの",
        content: "をこがましきものは、夜の雨の音なり。",
        userId: users[0].id,
      },

      {
        title: "春はあけぼの",
        content:
          "春はあけぼの。やうやう白くなりゆく山際、少し明りて、紫だちたる雲の細くたなびきたる。",
        userId: users[1].id,
      },

      {
        title: "色好みの殿",
        content:
          "色好みの殿は、弘徽殿のかたはらにおはします。その渡殿に、簀子を敷きて、物語などのたまふを、年に一度ききゐたまふなり。",
        userId: users[1].id,
      },

      {
        title: "雪のいと高う降りたるを",
        content:
          "雪のいと高う降りたるを、障子を上げて、わたり見わたしたまへるに、庭の樹木の枝も、まばらにうち見ゆるを、いみじと思しめし、よみたまへる。",
        userId: users[1].id,
      },

      {
        title: "行く川の流れは絶えずして",
        content:
          "行く川の流れは絶えずして、しかももとの水にあらず。淀みに浮かぶうたかたは、かつ消えかつ結びて、久しくとどまりたるためしなし。",
        userId: users[2].id,
      },

      {
        title: "水まさる時",
        content:
          "水まさる時は、高き所にのぼりて、民のいえをみそなはす。さるべき所にありつるものは、いかでかはおぼつかなからむ。",
        userId: users[2].id,
      },

      {
        title: "夜もすがら",
        content:
          "夜もすがら、松風をききつつ、ひとり明かし暮らせば、いとものあはれなり。",
        userId: users[2].id,
      },
    ];

    await Promise.all(
      articles.map((article, index) =>
        tx.article.create({
          data: {
            ...article,
            categories: {
              connect: {
                id: categories[Math.floor(index / 3)].id,
              },
            },
          },
        })
      )
    );
  });

  console.log("✅ Seed data inserted successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding data:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
