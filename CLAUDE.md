# Blog AWS Practice Stack - プロジェクト情報

このドキュメントは、プロジェクトの構成、開発手順、よく使うコマンドをまとめたものです。

## プロジェクト概要

- **技術スタック**:
  - Backend: Apollo Server on Cloudflare Workers + D1
  - Frontend: React SPA on Cloudflare Workers (Static Assets)
  - Auth: Supabase Auth
- **モノレポ管理**: Turborepo + pnpm workspaces
- **パッケージマネージャー**: pnpm v8.14.0
- **Node.jsバージョン**: v22.11.0 (LTS)
- **Wranglerバージョン**: v4.20.0（重要：v4対応済み）

## ディレクトリ構成

```
blog-aws-practice/
├── packages/
│   ├── server/           # Apollo Server (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts         # Cloudflare Workersエントリーポイント
│   │   │   ├── schema.ts        # GraphQLスキーマ（自動生成）
│   │   │   ├── db.ts           # Prisma D1設定
│   │   │   ├── auth.ts         # JWT認証
│   │   │   ├── types.ts        # 共通型定義
│   │   │   ├── domain/         # ドメイン層（クリーンアーキテクチャ）
│   │   │   │   ├── entities/   # ドメインエンティティ
│   │   │   │   ├── errors/     # カスタムエラークラス
│   │   │   │   └── repositories/ # リポジトリインターフェース
│   │   │   ├── application/    # アプリケーション層
│   │   │   │   └── usecases/   # ユースケース（ビジネスロジック）
│   │   │   ├── infrastructure/ # インフラストラクチャ層
│   │   │   │   ├── container.ts # DIコンテナ
│   │   │   │   └── repositories/ # リポジトリ実装（Prisma）
│   │   │   └── resolvers/      # GraphQLリゾルバー
│   │   ├── prisma/
│   │   │   └── schema.prisma    # Prismaスキーマ
│   │   ├── migrations/          # D1マイグレーション
│   │   │   └── 0001_init.sql
│   │   ├── schema/              # GraphQLスキーマ定義
│   │   │   └── *.gql
│   │   ├── scripts/             # ビルドスクリプト
│   │   │   └── generate-schema.js
│   │   ├── wrangler.toml        # Wrangler v4設定
│   │   ├── .dev.vars           # ローカル開発用環境変数
│   │   └── .env                # Prisma CLI用設定
│   ├── frontend/                # React + Vite (Cloudflare Workers Static Assets)
│   │   ├── src/
│   │   ├── wrangler.toml        # Workers設定
│   │   ├── .env                # ローカル開発用
│   │   ├── .env.development     # 開発環境デプロイ用
│   │   └── .env.production      # 本番環境デプロイ用
│   └── terraform/               # AWS Infrastructure as Code
│       ├── main.tf              # Terraform設定
│       ├── import.sh            # 既存リソースインポートスクリプト
│       └── .gitignore           # Terraform state除外
├── turbo.json                   # Turborepo設定
├── pnpm-workspace.yaml          # pnpm workspaces設定
├── .npmrc                       # pnpm設定
├── CLAUDE.md                    # プロジェクトドキュメント
└── CLOUDFLARE_MIGRATION_TODO.md # 移行計画
```

## セットアップ手順

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定

**Backend (.env)**

```bash
# packages/server/.env
DATABASE_URL="file:./dev.db"  # Prisma CLI用のダミーURL
```

**Backend (.dev.vars)**

```bash
# packages/server/.dev.vars
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
GRAPHQL_INTROSPECTION=true
GRAPHQL_PLAYGROUND=true
CORS_ORIGIN=http://localhost:3000
```

**Frontend 環境変数設定**

Viteは以下の優先順位で環境変数ファイルを読み込みます：
1. `.env.local` - すべての環境で最優先（gitignore対象）
2. `.env.[mode]` - 特定のモード用（例: .env.development）
3. `.env` - デフォルトの設定

**Frontend (.env)**

```bash
# packages/frontend/.env
# デフォルト設定（ローカル開発用）
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Frontend (.env.development)**

```bash
# packages/frontend/.env.development
# 開発環境デプロイ用（pnpm deploy:dev）
VITE_GRAPHQL_ENDPOINT=https://blog-aws-practice-api.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Frontend (.env.production)**

```bash
# packages/frontend/.env.production
# 本番環境デプロイ用（pnpm deploy:prod）
VITE_GRAPHQL_ENDPOINT=https://blog-aws-practice-api-prod.your-subdomain.workers.dev/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Frontend (.env.local)**

```bash
# packages/frontend/.env.local（オプション）
# ローカル開発でデフォルト設定を上書きしたい場合
# このファイルは.gitignoreに含まれるため、個人設定に最適
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
```

### 3. D1データベースのセットアップ

```bash
# D1データベースの作成（初回のみ）
cd packages/server
pnpm wrangler d1 create blog-aws-practice-db

# wrangler.tomlのdatabase_idを更新（作成時に表示されたIDを使用）
# database_id = "c370ca69-c11d-4d00-9fd0-b7339850fd30"

# マイグレーションの状況確認
pnpm d1:migrations:list                     # ローカルの未適用マイグレーション
pnpm d1:migrations:list:remote              # リモート（本番）の未適用マイグレーション

# マイグレーションの適用
pnpm d1:migrations:apply                    # ローカルに適用
pnpm d1:migrations:apply:remote             # リモート（本番）に適用

# テーブルの確認
pnpm d1:execute --command "SELECT name FROM sqlite_master WHERE type='table';"  # ローカル
pnpm d1:execute:remote --command "SELECT name FROM sqlite_master WHERE type='table';"  # リモート
```

## よく使うコマンド

### 開発

```bash
# 全体の開発サーバー起動
pnpm dev

# Backend (Cloudflare Workers) のみ起動
cd packages/server && pnpm dev

# Frontend のみ起動
cd packages/frontend && pnpm dev

# Frontend Worker のローカルテスト（ポート3001）
cd packages/frontend && pnpm dev:worker
```

### ビルド・型チェック

```bash
# ビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint

# フォーマット
pnpm format
```

### コード生成

```bash
# GraphQL型定義とPrismaクライアントの生成（ルートから）
pnpm generate

# Backend の生成処理
cd packages/server
pnpm generate  # 以下を実行:
# 1. pnpm generate:prisma    - Prismaクライアント生成
# 2. pnpm generate:codegen   - GraphQL型定義生成
# 3. pnpm generate:schema    - schema.ts生成（Workers用）

# Frontend の生成処理
cd packages/frontend
pnpm generate  # GraphQLクライアントコード生成
```

**注意**: Frontend の codegen は Backend の `schema/schema.gql` を直接参照するため、Backend で先に `pnpm generate` を実行する必要があります。

### データベース操作

```bash
cd packages/server

# Prismaスキーマからクライアント生成
pnpm prisma generate

# D1マイグレーション関連（package.jsonのスクリプトを使用）
pnpm d1:migrations:create <migration_name>  # 新規マイグレーション作成
pnpm d1:migrations:list                     # ローカルの未適用マイグレーション一覧
pnpm d1:migrations:list:remote              # リモート（本番）の未適用マイグレーション一覧
pnpm d1:migrations:apply                    # ローカルに適用
pnpm d1:migrations:apply:remote             # リモート（本番）に適用

# D1マイグレーションのフラグ説明：
# - フラグなし・--local（デフォルト）: ローカルDB（wrangler devで使用）に対して実行
# - --remote: リモートの本番DBに対して実行

# SQLの実行
pnpm d1:execute --file ./migrations/0001_init.sql           # ローカルでファイル実行
pnpm d1:execute --command "SELECT * FROM User;"             # ローカルでコマンド実行
pnpm d1:execute:remote --file ./migrations/0001_init.sql    # リモートでファイル実行
pnpm d1:execute:remote --command "SELECT * FROM User;"      # リモートでコマンド実行

# データベース情報の確認
pnpm wrangler d1 info blog-aws-practice-db
```

### D1ローカルデータベースの確認方法

Prisma StudioはD1を直接サポートしていませんが、以下の方法でデータを確認できます：

#### 1. Wrangler D1コマンド（推奨）

```bash
cd packages/server

# 便利なスクリプトでデータ確認
pnpm d1:show:users      # ユーザー一覧
pnpm d1:show:articles   # 記事一覧（著者名付き）
pnpm d1:show:categories # カテゴリー一覧
pnpm d1:show:tables     # テーブル一覧

# 任意のSQLクエリを実行
pnpm d1:execute --command "SELECT * FROM User WHERE email LIKE '%@example.com';"
```

#### 2. SQLiteツールで直接確認

D1のローカルデータベースはSQLiteファイルとして保存されています：

```bash
# データベースファイルの場所を確認
find .wrangler -name "*.sqlite" -type f

# SQLite CLIで開く（例）
sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite

# SQLiteコマンド例
.tables              # テーブル一覧
.schema User         # Userテーブルのスキーマ
SELECT * FROM User;  # データ確認
.quit               # 終了
```

#### 3. GUI SQLiteツール

以下のツールでSQLiteファイルを開いて視覚的に確認できます：
- **TablePlus**（macOS/Windows/Linux）
- **DB Browser for SQLite**（無料）
- **VS Code拡張機能**: SQLite Viewer

#### 4. Prisma Studio（推奨）

D1データベースでもPrisma Studioが使用できます：

```bash
cd packages/server

# Prisma Studioを起動
pnpm prisma-studio

# ブラウザで http://localhost:5555 を開く
```

**注意**: 
- 事前に`pnpm dev`でD1データベースを初期化しておく必要があります
- Prisma Studioを使用中は、データベースファイルがロックされる可能性があります

### デプロイ

#### Backend (Apollo Server)

```bash
cd packages/server

# ローカル開発サーバー（http://localhost:8787）
pnpm dev  # または pnpm wrangler dev

# デプロイ（開発環境）
pnpm deploy:dev  # または pnpm wrangler deploy

# デプロイ（本番環境）
pnpm deploy:prod  # または pnpm wrangler deploy --env production

# シークレット環境変数の設定
pnpm wrangler secret put SUPABASE_JWT_SECRET
pnpm wrangler secret put SUPABASE_URL
pnpm wrangler secret put SUPABASE_ANON_KEY

# ログの確認
pnpm wrangler tail

# Workers の設定確認
pnpm wrangler whoami      # ログイン状態確認
pnpm wrangler config list  # 設定一覧
```

#### Frontend (React SPA)

```bash
cd packages/frontend

# デプロイ（開発環境）
pnpm deploy:dev   # .env.developmentを使用してビルド

# デプロイ（本番環境）
pnpm deploy:prod  # .env.productionを使用してビルド

# デプロイURL
# 開発: https://blog-aws-practice-frontend.your-subdomain.workers.dev
# 本番: https://blog-aws-practice-frontend-prod.your-subdomain.workers.dev
```

## Wrangler v4 対応について

### 重要な変更点

1. **node_compat → nodejs_compat**

   - `node_compat = true` は廃止
   - `compatibility_flags = ["nodejs_compat"]` を使用

2. **削除された設定**

   - `[upload]` セクション
   - `[build].watch_paths`
   - `[tsconfig]` セクション（tsconfig.jsonで管理）

3. **エントリーポイント**

   - `src/index.ts` が必須（Cloudflare Workers形式）
   - Express形式の `server.ts` は使用不可
   - `export default` で fetch ハンドラーをエクスポート

4. **Apollo Server統合**
   - `@as-integrations/cloudflare-workers` を使用
   - Prisma D1 Adapter でデータベース接続

## Turborepo設定

このプロジェクトはTurborepo v2 + pnpm workspacesを使用してモノレポを管理しています。

### 主要なタスク（turbo.json）

- **build**: 依存関係を含めて全パッケージをビルド
- **dev**: 開発サーバーを起動（キャッシュ無効、永続実行）
- **generate**: GraphQLスキーマとコード生成
- **type-check**: 型チェック（generateタスクに依存）
- **lint**: コードのリンティング
- **deploy:dev/prod**: デプロイメント（buildに依存）

### pnpm workspacesとの統合

- `pnpm-workspace.yaml`でパッケージ場所を定義
- `pnpm --filter`コマンドで特定パッケージのタスクを実行
- ワークスペース内の依存関係は自動的に解決

### Turborepoの実行方法

```bash
# ルートから全パッケージのタスクを実行
pnpm build              # turbo run build
pnpm dev                # turbo run dev
pnpm generate           # turbo run generate

# 特定パッケージのタスクを実行
pnpm --filter @blog-aws-practice/server build
pnpm --filter @blog-aws-practice/frontend dev

# Turborepoのキャッシュをクリア
rm -rf .turbo packages/*/.turbo
```

### Turborepoのメリット

- **高速なタスク実行**: インテリジェントなキャッシュシステム
- **並列実行**: 依存関係に基づく最適な実行順序
- **インクリメンタルビルド**: 変更されたパッケージのみ再ビルド

## Catalyst UI Kit（Tailwind UIコンポーネント）

### 概要

Catalyst は Tailwind CSS チームが開発した最新のUIキットで、26個のReactコンポーネントを提供しています。このプロジェクトの `packages/frontend/src/components/ui/` に配置されており、フロントエンド開発で活用できます。

### 利用可能なコンポーネント

#### 基本要素
- **Button**: プライマリ、セカンダリ、ゴースト等のバリエーション
- **Input**: テキスト入力フィールド
- **Badge**: ステータスやラベル表示
- **Avatar**: ユーザーアバター表示
- **Text/Heading**: タイポグラフィコンポーネント

#### フォームコントロール
- **Checkbox/Radio**: 選択コントロール
- **Switch**: トグルスイッチ
- **Textarea**: 複数行テキスト入力
- **Field/FieldGroup/Label**: フォーム構造化コンポーネント

#### ナビゲーション
- **Sidebar/Navbar**: アプリケーションナビゲーション
- **Dropdown**: ドロップダウンメニュー
- **Pagination**: ページネーション

#### レイアウト
- **SidebarLayout**: サイドバー付きレイアウト
- **StackedLayout**: 積層レイアウト
- **AuthLayout**: 認証画面用レイアウト

#### オーバーレイ
- **Dialog**: モーダルダイアログ
- **Alert**: アラート表示

#### データ表示
- **Table**: テーブルコンポーネント
- **DescriptionList**: 説明リスト
- **Listbox/Combobox**: 選択リスト

### 使用方法

```jsx
// コンポーネントのインポート
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, Label } from '@/components/ui/fieldset'

// 使用例
function ExampleForm() {
  return (
    <form>
      <FieldGroup>
        <Field>
          <Label>名前</Label>
          <Input name="name" placeholder="山田太郎" />
        </Field>
        <Field>
          <Label>メールアドレス</Label>
          <Input type="email" name="email" placeholder="email@example.com" />
        </Field>
        <Button type="submit">保存</Button>
      </FieldGroup>
    </form>
  )
}
```

### 技術仕様

- **Tailwind CSS**: v4.0以上が必要
- **依存パッケージ**: 
  - `@headlessui/react`: アクセシビリティ対応のUIプリミティブ
  - `framer-motion`: アニメーション
  - `clsx`: クラス名の条件付き結合

### 開発時の活用ポイント

1. **カスタマイズ性**: Tailwindのユーティリティクラスで簡単にスタイル調整可能
2. **アクセシビリティ**: キーボード操作とスクリーンリーダー対応済み
3. **TypeScript対応**: 型安全な開発が可能
4. **一貫性**: デザインシステムとして統一感のあるUI構築

### GraphQL連携での活用例

```jsx
import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function ArticleManager() {
  const [isOpen, setIsOpen] = useState(false)
  const { data, loading } = useQuery(GET_ARTICLES)
  const [createArticle] = useMutation(CREATE_ARTICLE)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>新規記事作成</Button>
      
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>タイトル</TableHeader>
            <TableHeader>作成日</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.articles.map(article => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isOpen} onClose={setIsOpen}>
        <DialogTitle>新規記事作成</DialogTitle>
        <DialogDescription>
          記事のタイトルと内容を入力してください
        </DialogDescription>
        {/* フォーム実装 */}
      </Dialog>
    </>
  )
}
```

### ベストプラクティス

1. **コンポーネントの組み合わせ**: 小さなコンポーネントを組み合わせて複雑なUIを構築
2. **一貫性の維持**: Catalystコンポーネントを基準にカスタムコンポーネントを作成
3. **アクセシビリティ優先**: 提供されているアクセシビリティ機能を活用
4. **パフォーマンス**: 必要なコンポーネントのみインポートして使用

### 参考リンク

- [Catalyst Documentation](https://catalyst.tailwindui.com/docs)
- [Headless UI](https://headlessui.dev)
- [Framer Motion](https://www.framer.com/docs/)

## トラブルシューティング

### pnpm generateでエラーが出る場合

1. Node.jsバージョンが22.11.0であることを確認
2. `packages/server/.env`に`DATABASE_URL="file:./dev.db"`が設定されているか確認
3. `pnpm prisma generate`を先に実行

### D1マイグレーションが失敗する場合

```bash
# テーブルの存在確認
pnpm wrangler d1 execute blog-aws-practice-db --command "SELECT name FROM sqlite_master WHERE type='table';"

# 既存のテーブルを削除して再実行
pnpm wrangler d1 execute blog-aws-practice-db --command "DROP TABLE IF EXISTS User, Article, Category, _ArticleToCategory;"
```

### D1コマンドで対象環境を明確に指定する

D1コマンドはデフォルトでローカルDBに対して実行されます：

- **ローカル**: フラグなし または `--local`フラグ（デフォルト）
- **リモート（本番）**: `--remote`フラグを明示的に追加

```bash
# 例：マイグレーションの適用
pnpm d1:migrations:apply         # ローカル（デフォルト）
pnpm d1:migrations:apply:remote  # リモート本番（--remote）
```

### 型エラーが発生する場合

```bash
# 生成ファイルのクリーンアップ
rm -rf packages/server/src/gqlTypes.ts
rm -rf packages/frontend/src/generated-graphql

# 再生成
pnpm generate
```

## クリーンアーキテクチャ設計

このプロジェクトのBackendはクリーンアーキテクチャの原則に従って設計されています。

### レイヤー構成

1. **Domain層** (`src/domain/`)
   - **entities/**: ドメインエンティティ（ビジネスルールを含む）
   - **errors/**: カスタムエラークラス（NotFoundError, ValidationError等）
   - **repositories/**: リポジトリインターフェース（抽象化）

2. **Application層** (`src/application/`)
   - **usecases/**: ユースケース（ビジネスロジックの実装）
   - 外部への依存はインターフェース経由のみ
   - エラーハンドリングとバリデーション

3. **Infrastructure層** (`src/infrastructure/`)
   - **repositories/**: Prismaを使用したリポジトリ実装
   - **container.ts**: 依存性注入（DI）コンテナ

4. **Presentation層** (`src/resolvers/`)
   - GraphQLリゾルバー
   - 認証処理
   - DIコンテナからユースケースを呼び出し

### 依存関係の方向

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ← Domain (interfaces only)
```

### 実装例

```typescript
// Domain Entity
export class Article {
  canBeEditedBy(userId: number): boolean {
    return this.userId === userId.toString();
  }
}

// Use Case
export class ArticleUseCase {
  async updateArticle(id: number, input: UpdateArticleInput, userId: number) {
    const article = await this.articleRepository.findById(id);
    const articleEntity = ArticleEntity.fromPrismaModel(article);
    
    if (!articleEntity.canBeEditedBy(userId)) {
      throw new UnauthorizedError('update', 'article');
    }
    
    return this.articleRepository.update(id, input);
  }
}

// Resolver
export const updateArticle = async (_parent, { input }, { container, user }) => {
  const dbUser = await container.useCases.user.getUserBySub(user.sub);
  return container.useCases.article.updateArticle(input.id, input, dbUser.id);
};
```

### カスタムエラー

- `NotFoundError`: リソースが見つからない場合
- `ValidationError`: 入力値が無効な場合
- `UnauthorizedError`: 権限がない場合
- `BusinessRuleViolationError`: ビジネスルール違反

## コーディングルール

### コメントの書き方

**厳守事項: 自明なコメントは絶対に書かない**

**避けるべきコメント（自明なコメント）**：
```typescript
// ❌ 悪い例
const user = await getUser(); // ユーザーを取得
if (!user) { // ユーザーが存在しない場合
  throw new Error(); // エラーをスロー
}

// ❌ 悪い例：コードを見れば分かることをコメントで説明
// 認証必須
const authenticatedUser = requireAuth(user);

// ❌ 悪い例：関数名から明らかな動作を説明
// DIコンテナを作成
const container = createContainer(prisma);

// ❌ 悪い例：設定値の名前から自明な内容
// 開発環境ではintrospectionを有効化
introspection: process.env.NODE_ENV !== 'production'

// ❌ 悪い例：ミドルウェアの一般的な使い方を説明
// グローバルミドルウェア設定
app.use(cors())

// ❌ 悪い例：標準的な実装パターンを説明
// GraphQLエンドポイント
app.use('/graphql', expressMiddleware(server))
```

**良いコメント（理由や意図を説明）**：
```typescript
// ✅ 良い例：なぜこの値なのか理由を説明
// Workerの実行時間制限（30秒）を考慮してタイムアウトを設定
const TIMEOUT_MS = 25000;

// ✅ 良い例：複雑な仕様や落とし穴を説明
// Supabase JWTのsub claimはauth.users.idと同じ値
// ただしPrismaのUser.idとは異なるため、User.subで検索する必要がある
const dbUser = await getUserBySub(authUser.sub);

// ✅ 良い例：将来の変更予定や TODO を記載
/**
 * 記事の更新権限をチェックする
 * - 記事の作成者のみが編集可能
 * - 管理者権限の実装は今後追加予定
 */
```

**コメントを書くべき場合**：
1. **なぜ**その実装を選んだか（他の選択肢があった場合）
2. **バグ回避**やワークアラウンドの理由
3. **外部仕様**への依存（API の特殊な挙動など）
4. **パフォーマンス**や**セキュリティ**の考慮事項
5. **TODO** や将来の改善点

### 一般的なコーディング規則

1. **TypeScriptの活用**
   - `any`型の使用は最小限に
   - 型推論が効く場合は明示的な型注釈は不要

2. **エラーハンドリング**
   - カスタムエラークラスを使用
   - エラーメッセージは具体的に

3. **関数・変数名**
   - 意図が明確な名前を使用
   - 略語は避ける（例: `usr` → `user`）

4. **非同期処理**
   - `async/await`を使用
   - エラーは適切にキャッチして処理

## 開発フロー

1. **機能開発**

   - GraphQLスキーマの更新（`packages/server/schema/*.gql`）
   - `pnpm generate`で型定義を生成
   - ユースケースの実装（ビジネスロジック）
   - リポジトリの実装（必要に応じて）
   - リゾルバーの実装（薄く保つ）
   - フロントエンドの実装

2. **データベース変更**

   - Prismaスキーマの更新（`packages/server/prisma/schema.prisma`）
   - マイグレーションファイルの作成（`packages/server/migrations/`）
   - `pnpm d1:migrations:apply:remote`でリモートにマイグレーション適用
   - `pnpm d1:migrations:apply`でローカルにマイグレーション適用
   - `pnpm prisma generate`でクライアント更新

3. **デプロイ**
   - `pnpm build`でビルド確認
   - `pnpm type-check`で型チェック
   - Backend: `pnpm deploy:dev`（開発）または`pnpm deploy:prod`（本番）
   - Frontend: `pnpm deploy:dev`（開発）または`pnpm deploy:prod`（本番）

## 注意事項

- D1はSQLiteベースなので、一部のPostgreSQL/MySQL固有の機能は使用不可
- Cloudflare Workersは実行時間とメモリに制限あり（有料プランで緩和）
- 環境変数の管理：
  - Backend: `.dev.vars`（ローカル）、`wrangler secret`（本番の秘密情報）
  - Frontend: `.env`ファイル群（ビルド時に使用）
- 自動生成ファイルは直接編集しない：
  - `src/gqlTypes.ts` - GraphQL型定義
  - `src/schema.ts` - Workers用スキーマ
  - `schema/schema.gql` - 結合されたスキーマ
  - `src/generated-graphql/` - Frontend GraphQL型定義
- Wrangler v4では`node_compat`は廃止、`nodejs_compat`を使用
- ファイルシステムAPIは使用不可（Workers環境のため）
- **Frontend (Static Assets)の配信は無料**（Workerスクリプトが起動しないため）

## Workers Static Assets設定

Frontend の `wrangler.toml` の重要な設定：

```toml
# Cloudflare Workers with Static Assets configuration
name = "blog-aws-practice-frontend"
compatibility_date = "2024-11-25"

# Static Assets（Workerスクリプトなし = 無料配信）
assets = { directory = "./dist", not_found_handling = "single-page-application" }

# 本番環境設定
[env.production]
name = "blog-aws-practice-frontend-prod"
```

- `not_found_handling = "single-page-application"`: SPAのルーティングサポート
- Workerスクリプト（`main`）の指定なし: 静的アセットのみの無料配信

## AWSインフラストラクチャ管理

### Terraform

AWSインフラストラクチャは`packages/terraform`でコードとして管理されています。

```bash
cd packages/terraform

# 初期化
terraform init

# 実行計画確認
terraform plan

# インフラ構築
terraform apply

# インフラ削除
terraform destroy

# 既存リソースのインポート
./import.sh
```

管理対象リソース：
- VPC、Subnets、Internet Gateway、NAT Gateway、Route Tables、Route Table Associations
- Security Groups (ALB、ECS、RDS)
- Application Load Balancer、Target Group、Listener
- ECS Cluster、Task Definitions、Services
- ECR Repositories
- RDS Instance、DB Subnet Group
- IAM Roles、Policies、Policy Attachments
- CloudWatch Log Groups
- Secrets Manager（シークレット自体は作成、値は手動設定）

## AWS移行プロジェクト管理

このプロジェクトは現在、AWS ECS Fargateへの移行作業を進めています。

### 重要なドキュメント

- **[AWS_MIGRATION_PLAN.md](./AWS_MIGRATION_PLAN.md)** - AWS移行の詳細計画書
- **[AWS_MIGRATION_PROGRESS.md](./AWS_MIGRATION_PROGRESS.md)** - 移行作業の進捗管理

### 作業ルール

**AWS移行に関する作業を行った場合は、必ず `AWS_MIGRATION_PROGRESS.md` を更新してください。**

このルールにより：
- Claude Codeセッションが切り替わっても作業を継続可能
- チーム内で進捗状況を共有
- 作業の重複や漏れを防止

更新すべき内容：
- 完了した作業を「✅ 完了した作業」セクションに移動
- 新しく開始した作業を「🚧 進行中の作業」に記載
- 発生した課題や決定事項を記録
- 最終更新日時を更新

## AWSコンソール操作に関するルール

**重要**: AWSコンソールの操作説明を行う際は、以下のルールに従ってください：

1. **説明は日本語で行う**
2. **AWSコンソール上の要素（ボタン、メニュー、設定項目など）は英語版の名称を使用する**
   - 例: 「左側のメニューから「**Your VPCs**」をクリック」
   - 例: 「「**Create VPC**」ボタンをクリック」
   - 例: 「**Name tag**に`blog-aws-practice-vpc`を入力」
3. **AWSコンソールでの操作手順は必ず`AWS_MANUAL_SETUP_GUIDE.md`に追記する**
   - 新しいリソースの作成手順
   - 設定変更の手順
   - トラブルシューティング手順

このルールにより、英語版AWSコンソールを使用しているユーザーが迷わずに操作でき、すべての手順が文書化されます。

## 参考リンク

### Cloudflare関連
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Prisma D1 Adapter](https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1)
- [Apollo Server Cloudflare](https://www.apollographql.com/docs/apollo-server/deployment/cloudflare-workers)

### AWS関連
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Aurora PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Actions for Amazon ECS](https://github.com/aws-actions/amazon-ecs-deploy-task-definition)

### その他
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
