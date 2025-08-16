// GraphQL スキーマを文字列として定義
// Cloudflare WorkersではファイルシステムAPIが使えないため、スキーマを直接埋め込む
// このファイルは自動生成されます。直接編集しないでください。
// 生成コマンド: pnpm run generate:schema

export const typeDefs = `type Article {
  id: Int!
  title: String!
  content: String!
  user: User!
  categories: [Category!]!
}

input CreateArticleInput {
  title: String!
  content: String!
  categoryIds: [Int!]!
}

input UpdateArticleInput {
  id: Int!
  title: String
  content: String
  categoryIds: [Int!]
}

extend type Query {
  articles: [Article!]!
  article(id: Int!): Article
}

extend type Mutation {
  createArticle(input: CreateArticleInput!): Article!
  updateArticle(input: UpdateArticleInput!): Article!
  deleteArticle(id: Int!): Boolean!
}

type Category {
  id: Int!
  name: String!
  articles: [Article!]!
}

input CreateCategoryInput {
  name: String!
}

input UpdateCategoryInput {
  id: Int!
  name: String
}

extend type Query {
  categories: [Category!]!
  category(id: Int!): Category
}

extend type Mutation {
  createCategory(input: CreateCategoryInput!): Category!
  updateCategory(input: UpdateCategoryInput!): Category!
  deleteCategory(id: Int!): Boolean!
}

type Query {
  node(id: ID!): Node
}
type Mutation {
  noop(input: NoopInput): NoopPayload
}
interface Node {
  id: ID!
}
input NoopInput {
  clientMutationId: String
}
type NoopPayload {
  clientMutationId: String
}

schema {
  query: Query
  mutation: Mutation
}

type User {
  id: Int!
  sub: String!
  name: String!
  email: String!
  articles: [Article!]!
}

extend type Query {
  users: [User!]!
  user(id: Int!): User
  me: User
}

extend type Mutation {
  signUp(name: String!): User!
}
`;
