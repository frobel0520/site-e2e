# Tensift E2E 規格

- **目標網站**：`https://tensift.pages.dev/`
- **來源 Repo**：`frobel0520/tensift`
- **測試邊界**：純靜態 300 關分類解謎遊戲，不登入、不寫入任何真實個人資料，僅驗證公開互動流程與 `localStorage` 持久化。

## 核心不變量（依據來源 Repo README）

1. **基線健康**：HTTP 200、標題含 `Tensift`、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面與手機無橫向捲軸。
2. **關卡盤面渲染**：主頁載入後顯示遊戲主標題與互動按鈕（如選關、提示或卡片元素），不呈現空白頁。
3. **本地進度持久化**：瀏覽器 `localStorage` 可正常讀寫且重新整理頁面後不遺失狀態、無執行期錯誤。
4. **公開說明頁可達**：`/learn/en/how-to-play` 回傳 HTTP 200 且正常渲染教學內容。
