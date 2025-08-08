# Firebase 本機開發設定指南

## Google 登入本機開發問題解決方案

### 🔧 方法1：使用開發模式 Mock 登入
已在應用程式中加入開發模式 Mock 登入功能：
- ✅ 僅在開發環境顯示
- ✅ 創建假的使用者資料進行測試
- ✅ 不需要真實的 Google 驗證

### 🌐 方法2：設定 Firebase 授權網域

1. **前往 Firebase Console**
   - 開啟 [Firebase Console](https://console.firebase.google.com/)
   - 選擇你的專案 `climbing-points-system`

2. **設定授權網域**
   - 前往 Authentication > Settings > Authorized domains
   - 加入以下網域：
     ```
     localhost
     127.0.0.1
     ```

3. **Google OAuth 設定**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 選擇同一個專案
   - 前往 APIs & Services > Credentials
   - 編輯 OAuth 2.0 客戶端 ID
   - 在「已授權的 JavaScript 來源」加入：
     ```
     http://localhost:5173
     http://127.0.0.1:5173
     http://localhost:3000
     http://127.0.0.1:3000
     ```

4. **重新部署設定**
   - 在 Firebase Console 重新儲存設定
   - 等待 10-15 分鐘讓變更生效

### 🚀 方法3：使用 HTTPS 本機開發

修改 `package.json` 的 dev 腳本：
```json
{
  "scripts": {
    "dev": "vite --host --https",
    "dev-http": "vite --host"
  }
}
```

然後使用：
```bash
npm run dev
```

這會在 `https://localhost:5173` 上運行，Google 更容易接受 HTTPS 連線。

### 📱 測試建議

1. **使用 Mock 登入**（推薦）
   - 最簡單的本機開發方式
   - 不需要網路連線
   - 可以測試所有功能

2. **實機測試**
   - 使用手機瀏覽器開啟應用程式
   - 手機通常不會有本機限制問題

3. **部署到 Firebase Hosting 測試**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### ⚠️ 注意事項

- Mock 登入僅在開發環境可用 (`import.meta.env.DEV`)
- 生產環境會自動隱藏 Mock 登入選項
- 所有 Mock 資料都是臨時的，不會儲存到 Firebase

### 🛠️ 偵錯技巧

如果仍有問題，開啟瀏覽器開發者工具檢查：
1. Console 錯誤訊息
2. Network 請求是否成功
3. Firebase Auth 狀態

常見錯誤碼：
- `auth/unauthorized-domain`: 網域未授權
- `auth/popup-blocked`: 彈出視窗被封鎖
- `auth/popup-closed-by-user`: 使用者關閉登入視窗