import { QueryResolvers } from "../../gqlTypes";

export const categories: QueryResolvers["categories"] = async (
  _parent,
  _args,
  { container }
) => {
  return container.useCases.category.getCategories();
};

export const category: QueryResolvers["category"] = async (
  _parent,
  { id },
  { container }
) => {
  return container.useCases.category.getCategory(id);
};
