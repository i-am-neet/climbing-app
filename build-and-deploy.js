#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始建置和部署流程...\n');

try {
  // 1. 清理舊的建置
  console.log('🧹 清理舊的建置檔案...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 2. 建置專案
  console.log('📦 建置 Vue 3 專案...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. 檢查建置結果
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('建置失敗：找不到 dist/index.html');
  }

  console.log('✅ 建置完成！');
  console.log('\n📁 建置檔案位於 dist/ 目錄');
  
  // 4. 顯示後續步驟
  console.log('\n🚀 後續步驟：');
  console.log('1. 本地預覽：npm run preview');
  console.log('2. 部署到 Firebase：firebase deploy');
  console.log('3. 或執行：npm run deploy\n');

} catch (error) {
  console.error('❌ 建置失敗：', error.message);
  process.exit(1);
}