import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Field, Label, FieldGroup } from "@/components/ui/fieldset";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`;

const CREATE_ARTICLE = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      title
      content
      categories {
        id
        name
      }
    }
  }
`;

export const CreateArticle = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>(
    {}
  );

  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const [createArticle, { loading }] = useMutation(CREATE_ARTICLE, {
    onCompleted: () => {
      showToast("記事を投稿しました", "success");
      navigate("/");
    },
    onError: (error) => {
      console.error("記事の作成に失敗しました:", error);
      showToast("記事の投稿に失敗しました", "error");
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = "タイトルは必須項目です";
    }

    if (!content.trim()) {
      newErrors.content = "本文は必須項目です";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) return;

    await createArticle({
      variables: {
        input: {
          title: title.trim(),
          content: content.trim(),
          categoryIds: selectedCategoryIds,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title">新規記事投稿</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-gray-900 p-8 rounded-lg shadow-lg"
        >
          <FieldGroup>
            <Field>
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトルを入力してください"
                invalid={!!errors.title}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </Field>

            <Field>
              <Label>カテゴリー</Label>
              <div className="flex flex-wrap gap-2">
                {categoriesData?.categories.map((category: any) => {
                  const isSelected = selectedCategoryIds.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCategoryIds(
                            selectedCategoryIds.filter(
                              (id) => id !== category.id
                            )
                          );
                        } else {
                          setSelectedCategoryIds([
                            ...selectedCategoryIds,
                            category.id,
                          ]);
                        }
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                        ${
                          isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                        }
                      `}
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-400">
                カテゴリーをクリックして選択・解除できます
              </p>
            </Field>

            <Field>
              <Label htmlFor="content">本文 *</Label>
              <Textarea
                id="content"
                name="content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="記事の本文を入力してください"
                invalid={!!errors.content}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-500">{errors.content}</p>
              )}
            </Field>
          </FieldGroup>

          <div className="flex items-center justify-between pt-6">
            <Button type="button" plain onClick={() => navigate("/")}>
              キャンセル
            </Button>
            <Button type="submit" color="blue" disabled={loading}>
              {loading ? "投稿中..." : "記事を投稿"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
