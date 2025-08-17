import { QueryResolvers } from "../../gqlTypes";

export const articles: QueryResolvers["articles"] = async (
  _parent,
  _args,
  { container }
) => {
  return container.useCases.article.getArticles();
};

export const article: QueryResolvers["article"] = async (
  _parent,
  { id },
  { container }
) => {
  return container.useCases.article.getArticle(id);
};
