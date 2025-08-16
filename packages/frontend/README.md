# Frontend (Cloudflare Pages)

## 開発環境のセットアップ

### 前提条件
- Backend が起動していること（`cd ../backend && pnpm dev`）
- 環境変数が設定されていること（`.env` ファイル）

### 開発サーバーの起動

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

### GraphQL Code Generation

GraphQL Code Generation を実行するには、**必ず Backend サーバーが起動している必要があります**。

```bash
# Backend を起動（別ターミナル）
cd ../backend && pnpm dev

# Code Generation を実行
pnpm generate

# または Watch モードで実行
pnpm codegen-watch
```

エラーが発生する場合：
- Backend が `http://localhost:8787` で起動しているか確認
- `codegen.ts` の schema URL が正しいか確認

### ビルドとデプロイ

```bash
# ビルド
pnpm build

# Cloudflare Pages へデプロイ（開発環境）
pnpm deploy

# Cloudflare Pages へデプロイ（本番環境）
pnpm deploy:prod
```

## 環境変数

`.env` ファイルに以下の環境変数を設定：

```env
VITE_GRAPHQL_ENDPOINT=http://localhost:8787/graphql
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## トラブルシューティング

### `pnpm codegen-watch` でエラーが発生する

1. Backend サーバーが起動しているか確認
   ```bash
   cd ../backend && pnpm dev
   ```

2. GraphQL エンドポイントにアクセスできるか確認
   ```bash
   curl http://localhost:8787/graphql
   ```

3. `codegen.ts` の設定を確認
   - schema URL が `http://localhost:8787/graphql` になっているか
   - documents のパスが正しいか
