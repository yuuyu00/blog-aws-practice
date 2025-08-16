import { useParams, Link } from "react-router";
import { useQuery } from "@apollo/client";
import { GET_ARTICLE } from "../graphql/queries/articles";

export const ArticleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(GET_ARTICLE, {
    variables: { id: parseInt(id || "0") },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">
          エラーが発生しました: {error.message}
        </div>
      </div>
    );
  }

  if (!data?.article) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-600">
          記事が見つかりませんでした。
        </div>
      </div>
    );
  }

  const { article } = data;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Link
        to="/articles"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        ← 記事一覧に戻る
      </Link>

      <article className="bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

        <div className="text-sm text-gray-600 mb-6">
          投稿者: {article.user.name}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {article.categories.map((category) => (
            <span
              key={category.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {category.name}
            </span>
          ))}
        </div>

        <div className="prose prose-lg max-w-none">
          <p className="whitespace-pre-wrap">{article.content}</p>
        </div>
      </article>
    </div>
  );
};
