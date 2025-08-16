import { UserResolvers } from "../../gqlTypes";

export const User: UserResolvers = {
  articles: async (parent, {}, { container }) => {
    const articles = await container.useCases.article.getArticlesByAuthor(parent.id);
    return articles || [];
  },
};
