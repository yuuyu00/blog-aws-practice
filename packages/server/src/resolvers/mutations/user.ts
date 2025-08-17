import { MutationResolvers } from "../../gqlTypes";
import { requireAuth } from "../../auth";

export const signUp: MutationResolvers["signUp"] = async (
  _parent,
  { name },
  { container, user }
) => {
  const authUser = requireAuth(user);

  const existingUser = await container.useCases.user.getUserBySub(authUser.sub);

  if (existingUser) {
    return await container.useCases.user.updateUser(existingUser.id, { name });
  }

  return await container.useCases.user.createUser({
    email: authUser.email || "",
    name,
    sub: authUser.sub,
  });
};
