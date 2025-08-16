import { QueryResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const users: QueryResolvers["users"] = async (_parent, _args, { container }) => {
  return container.useCases.user.getUsers();
};

export const user: QueryResolvers["user"] = async (_parent, { id }, { container }) => {
  return container.useCases.user.getUser(id);
};

export const me: QueryResolvers["me"] = async (_parent, _args, context) => {
  const authUser = requireAuth(context.user);
  
  return context.container.useCases.user.getUserBySub(authUser.sub);
};
