# 攀岩社積分系統 Vue 3 版

這是一個使用 Vue 3 + Firebase 開發的攀岩社積分管理系統。

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 部署到 Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📁 專案結構

```
src/
├── components/          # Vue 組件
│   ├── AppHeader.vue   # 應用程式標題
│   ├── LoginSection.vue # 登入區域
│   ├── UserInfo.vue    # 使用者資訊
│   ├── MainContent.vue # 主要內容容器
│   ├── StatsSection.vue # 統計資料
│   ├── RouteForm.vue   # 路線提交表單
│   ├── RouteHistory.vue # 路線記錄
│   └── Leaderboard.vue # 排行榜
├── stores/             # Pinia 狀態管理
│   ├── auth.js        # 身份驗證狀態
│   └── climbing.js    # 攀岩數據狀態
├── firebase.js        # Firebase 配置
├── App.vue           # 根組件
└── main.js           # 入口文件
```

## 🔧 主要功能

- **Google 登入** - 使用 Google 帳號登入
- **積分記錄** - 記錄不同等級的抱石完成情況
- **照片上傳** - 上傳路線照片到 Firebase Storage
- **額外積分** - 各種額外積分任務
- **排行榜** - 查看所有使用者的積分排名
- **個人記錄** - 查看個人的路線完成記錄
- **響應式設計** - 支援手機和桌面設備

## ⚙️ Firebase 設定

### 1. 啟用 Firebase 服務

確保在 Firebase Console 中啟用以下服務：

1. **Authentication** - 啟用所需的登入方式
2. **Firestore Database** - 資料儲存
3. **Storage** - 照片儲存

### 2. 設定認證提供商

前往 Firebase Console > Authentication > Sign-in method，啟用您需要的認證方式：

#### 🔍 Google 登入 (預設啟用)
- 點擊 "Google" 提供商
- 啟用並設定專案支援電子郵件

#### 📘 Facebook 登入
- 點擊 "Facebook" 提供商  
- 需要 Facebook App ID 和 App Secret
- 在 Facebook Developer Console 設定 OAuth 重新導向 URI

#### 🐱 GitHub 登入
- 點擊 "GitHub" 提供商
- 需要在 GitHub 建立 OAuth App
- 設定 Client ID 和 Client Secret

#### 🐦 Twitter 登入  
- 點擊 "Twitter" 提供商
- 需要 Twitter API Key 和 Secret

### 3. 配置應用程式認證方式

編輯 `.env` 檔案來控制顯示哪些登入方式：

```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 檔案
VITE_ENABLE_GOOGLE_AUTH=true      # Google 登入
VITE_ENABLE_FACEBOOK_AUTH=true    # Facebook 登入  
VITE_ENABLE_GITHUB_AUTH=true      # GitHub 登入
VITE_ENABLE_TWITTER_AUTH=false    # Twitter 登入
```

### 4. 動態認證方式

應用程式會：
- ✅ 根據 `.env` 檔案顯示對應的登入按鈕
- ✅ 自動檢測 Firebase 配置的提供商
- ✅ 在開發模式顯示提供商管理工具
- ✅ 提供友善的錯誤訊息和載入狀態

## 🎯 積分規則

- **VB-V1**: 2分/題
- **V2-V3**: 3分/題  
- **V4-V5**: 5分/題
- **V6+**: 8分/題

### 額外積分任務 (+1分/項)
- 拍攝他人抱石瞬間
- 分享心得或技巧
- 協助其他社員
- 清潔岩點/整理裝備
- 社群打卡分享
- 團體挑戰完成 (+3分)

### 抽獎券
- 每{POINTS_PER_TICKET}分可兌換1張抽獎券

## 🐛 VS Code Debug 設定

專案已配置完整的 VS Code debug 環境，支援以下調試方式：

### 🚀 快速開始調試

1. **自動啟動 (推薦)**
   - 按 `F5` 或點擊 Debug 面板的「Launch Vue 3 App (Chrome)」
   - 會自動啟動 Vite 開發伺服器並開啟 Chrome 進行調試

2. **手動附加調試**
   - 先執行 `npm run dev` 啟動開發伺服器
   - 使用「Attach to Chrome」配置附加到現有瀏覽器

### 📋 可用的 Debug 配置

- **Launch Vue 3 App (Chrome)** - 使用 Chrome 啟動並調試
- **Launch Vue 3 App (Edge)** - 使用 Edge 啟動並調試  
- **Attach to Chrome** - 附加到正在運行的 Chrome
- **Debug Node.js (Build Script)** - 調試建置腳本
- **Debug Firebase Deploy** - 調試部署過程

### 🔧 可用的 Tasks

按 `Ctrl+Shift+P` 輸入 `Tasks: Run Task` 可執行：

- **npm: dev** - 啟動開發伺服器
- **npm: build** - 建置專案
- **Firebase Deploy** - 部署到 Firebase
- **Firebase Serve** - 本地測試部署
- **Build and Deploy** - 完整建置並部署

### 📦 建議的 VS Code 擴展

開啟專案時 VS Code 會自動建議安裝以下擴展：

- **Vue.volar** - Vue 3 官方語言支援
- **Vue.vscode-typescript-vue-plugin** - TypeScript 支援
- **esbenp.prettier-vscode** - 程式碼格式化
- **ms-vscode.vscode-chrome-debug-core** - Chrome 調試支援

### ⚡ Debug 技巧

1. **設置斷點** - 在 `.vue` 檔案的 `<script>` 區域點擊行號左側
2. **Console 調試** - 在 Chrome DevTools 中查看 `console.log` 輸出
3. **Vue DevTools** - 安裝 Vue DevTools 瀏覽器擴展以獲得更好的 Vue 調試體驗
4. **熱重載** - 修改程式碼會自動重載，斷點保持有效