import { gql } from "../../generated-graphql";

export const GET_ARTICLES = gql(`
  query GetArticles {
    articles {
      id
      title
      content
      user {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`);

export const GET_ARTICLE = gql(`
  query GetArticle($id: Int!) {
    article(id: $id) {
      id
      title
      content
      user {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`);
