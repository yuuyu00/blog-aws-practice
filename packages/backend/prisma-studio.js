#!/usr/bin/env node

/**
 * D1データベースでPrisma Studioを使用するためのスクリプト
 * 参考: https://zenn.dev/tomotomo/scraps/6b685d70d788b3
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// D1のローカルデータベースファイルを検索
function findD1Database() {
  const wranglerDir = path.join(__dirname, '.wrangler');
  const findDatabase = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const result = findDatabase(fullPath);
        if (result) return result;
      } else if (file.endsWith('.sqlite')) {
        return fullPath;
      }
    }
    return null;
  };
  
  return findDatabase(wranglerDir);
}

// メイン処理
async function main() {
  try {
    // D1データベースファイルを探す
    const dbPath = findD1Database();
    if (!dbPath) {
      console.error('❌ D1データベースファイルが見つかりません。');
      console.error('💡 先に "pnpm dev" を実行してD1データベースを初期化してください。');
      process.exit(1);
    }
    
    console.log('✅ D1データベースを検出:', dbPath);
    
    // DATABASE_URL環境変数を設定
    const databaseUrl = `file:${dbPath}`;
    console.log('🔧 DATABASE_URL:', databaseUrl);
    
    // Prisma Studioを起動
    console.log('🚀 Prisma Studioを起動しています...');
    const studio = spawn('npx', ['prisma', 'studio'], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
      stdio: 'inherit',
      shell: true,
    });
    
    studio.on('error', (error) => {
      console.error('❌ Prisma Studio起動エラー:', error);
    });
    
    studio.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Prisma Studioが異常終了しました (code: ${code})`);
      }
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

main();