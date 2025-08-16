const fs = require('fs');
const path = require('path');

// schema.gqlファイルを読み込む
const schemaPath = path.join(__dirname, '../schema/schema.gql');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// TypeScriptファイルとして出力
const outputPath = path.join(__dirname, '../src/schema.ts');
const outputContent = `// GraphQL スキーマを文字列として定義
// Cloudflare WorkersではファイルシステムAPIが使えないため、スキーマを直接埋め込む
// このファイルは自動生成されます。直接編集しないでください。
// 生成コマンド: pnpm run generate:schema

export const typeDefs = \`${schemaContent}\`;
`;

fs.writeFileSync(outputPath, outputContent);
console.log('✅ Generated src/schema.ts from schema/schema.gql');