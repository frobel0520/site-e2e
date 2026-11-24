# Playmint E2E 規格

- **目標網站**：`https://playmint.pages.dev/`
- **來源 Repo**：`frobel0520/playmint`
- **測試邊界**：純公開解謎遊戲入口頁，驗證目錄連結完整且點擊可達目標網站。

## 核心不變量（依據來源 Repo README）

1. **基線健康**：HTTP 200、非空標題（包含 `Playmint`）、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面與手機無橫向捲軸。
2. **三款遊戲目錄連結完整**：頁面必須包含指向以下三款遊戲的可見連結：
   - Tensift（`https://tensift.pages.dev/`）
   - 左腳踩右腳（`https://frobel0520.github.io/left-foot-right-foot/`）
   - 小日子收納（`https://playmint-little-days.pages.dev/`）
3. **跨站導覽健康**：從 Playmint 入口點選 Tensift 連結可正常抵達並渲染標題，不發生執行期錯誤。
