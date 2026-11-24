# media-craft E2E 規格

- **目標網站**：`https://media-craft.pages.dev/`
- **來源 Repo**：`frobel0520/media-craft`
- **測試邊界**：純公開頁面 + 合成 1×1 PNG（`SYNTHETIC_PNG_1X1`），不登入、不上傳真實檔案。

## 核心不變量（依據來源 Repo README）

1. **基線健康**：HTTP 200、非空標題、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面（1280×900）與手機（375×812）皆無橫向捲軸、深淺色主題切換正常。
2. **嚴格本地 CSP**：文件 `<meta http-equiv="Content-Security-Policy">` 包含 `connect-src 'self'`，確保無外部上傳通道。
3. **零上傳本地處理**：透過 `<input type="file">` 載入合成 1×1 PNG 圖片時，瀏覽器不得送出任何外部網域請求或任何 `POST` / `PUT` / `PATCH` 上傳請求，且畫面維持無錯誤。
