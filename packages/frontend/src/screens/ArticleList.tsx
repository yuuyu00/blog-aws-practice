import { useQuery } from "@apollo/client";
import { Link } from "react-router";
import { GET_ARTICLES } from "../graphql/queries/articles";

export const ArticleList = () => {
  const { data, loading, error } = useQuery(GET_ARTICLES);

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

  return (
    <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl font-bold mb-20 text-title">
        AWSアレルギーを克服するために構築したブログ
      </h1>

      {data?.articles.length === 0 ? (
        <p className="text-gray-600">記事がありません。</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.articles.map((article) => (
            <Link
              key={article.id}
              to={`/articles/${article.id}`}
              className="group block"
            >
              <article className="bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1 hover:bg-gray-750 border border-gray-700 hover:border-gray-600">
                <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors duration-200">
                  {article.title}
                </h2>

                <div className="text-sm text-gray-500 mb-3">
                  {article.user.name}
                </div>

                <p className="mb-4 line-clamp-3 text-gray-300 flex-grow">
                  {article.content}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {article.categories.map((category) => (
                    <span
                      key={category.id}
                      className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
