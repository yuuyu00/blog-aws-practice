import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const createArticle: MutationResolvers["createArticle"] = async (
  _parent,
  { input },
  { container, user }
) => {
  const authenticatedUser = requireAuth(user);
  
  const dbUser = await container.useCases.user.getUserBySub(authenticatedUser.sub);
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  return container.useCases.article.createArticle(input, dbUser.id);
};

export const updateArticle: MutationResolvers["updateArticle"] = async (
  _parent,
  { input },
  { container, user }
) => {
  const authenticatedUser = requireAuth(user);
  
  const dbUser = await container.useCases.user.getUserBySub(authenticatedUser.sub);
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  return container.useCases.article.updateArticle(input.id, input, dbUser.id);
};

export const deleteArticle: MutationResolvers["deleteArticle"] = async (
  _parent,
  { id },
  { container, user }
) => {
  const authenticatedUser = requireAuth(user);
  
  const dbUser = await container.useCases.user.getUserBySub(authenticatedUser.sub);
  
  if (!dbUser) {
    throw new Error("User not found. Please sign up first.");
  }
  
  try {
      await container.useCases.article.deleteArticle(id, dbUser.id);
    return true;
  } catch (error) {
    console.error('Failed to delete article:', error);
    throw error;
  }
};
