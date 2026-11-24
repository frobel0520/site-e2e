# learning-atlas E2E 規格

- **目標網站**：`https://frobel0520.github.io/learning-atlas/`
- **來源 Repo**：`frobel0520/learning-atlas`（GitHub Pages 上的學習網站總入口，8 座子站與 `lessons/` 單頁教學）
- **測試邊界**：只開公開頁面，只送 `GET`。不登入、不填表、不動 AI-Agent-Tutorial 的線上後端；子站只確認入口回應，深入互動由各子站自己的測試負責。

## 核心不變量（依據來源 Repo README 與 `index.html`）

1. **基線健康**：HTTP 200、非空標題、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面（1280×900）與手機（375×812）無橫向捲軸、深淺色主題切換正常。Harbor 維護腳本連不上時頁面也要照常顯示（README「Harbor 整合」）。
2. **入口連結完整**：首頁標題為「Learning Atlas」，列出 8 座子站（README 路線表）與 2 份 HTML 教學（`lessons/fsrs.html`、`lessons/request-journey.html`），每個入口連結都回 HTTP 200。
3. **手機選單**：寬度 ≤ 720px 時側欄收起，「開啟選單」按鈕的 `aria-expanded` 會切到 `true` 並顯示側欄；點側欄內的路線連結後側欄關閉，`aria-expanded` 回 `false`；按 `Escape` 也能關閉。

## 不測範圍

- 子站內部功能、Pyodide 執行環境、AI-Agent-Tutorial 線上模式。
- 教學頁的 cdnjs 外部資源與互動實驗內容正確性。
