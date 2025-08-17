import { MutationResolvers } from "../../gqlTypes";

export const createCategory: MutationResolvers["createCategory"] = async (
  _parent,
  { input },
  { container }
) => {
  return container.useCases.category.createCategory(input);
};

export const updateCategory: MutationResolvers["updateCategory"] = async (
  _parent,
  { input },
  { container }
) => {
  return container.useCases.category.updateCategory(input.id, input);
};
