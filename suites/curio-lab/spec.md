# curio-lab E2E 規格

- **目標網站**：`https://www.curio-lab.workers.dev/`
- **來源 Repo**：`frobel0520/curio-lab`（「好奇一下 Curio Lab」互動工具，Next.js static export＋Cloudflare Worker 分享 API）
- **測試邊界**：只開公開頁面，作答內容只存在測試瀏覽器。**絕不按「分享結果」**（README 隱私段：分享會上傳圖卡與文案並建立 7 天公開連結），因此整段流程不得送出 `POST`／`PUT`／`PATCH`／`DELETE`。

## 核心不變量（依據來源 Repo README 的「主要功能」與「隱私」段）

1. **基線健康**：HTTP 200、非空標題、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面（1280×900）與手機（375×812）無橫向捲軸、深淺色主題切換正常。Harbor 維護查詢連不上時頁面照常顯示。
2. **工具入口**：首頁列出「主子帳本」（`/tools/cat-cost`）與「16 型貓格」（`/tools/cat-personality`），兩個工具頁都能開啟並顯示開始按鈕，主子帳本標示「不需登入」。
3. **貓格測驗作答**：從「開始觀察主子」進入 `/tools/cat-personality/quiz`，顯示 `01 / 20` 與四個選項（`role="radio"`）。選一個選項後該選項 `aria-checked="true"`；按「下一題」進到 `02 / 20`；按「上一題」回到第 1 題時，先前的選擇仍保留（續答依賴瀏覽器保存）。過程中沒有寫入請求。

## 不測範圍

- 分享結果、圖卡上傳、QR Code 公開連結（會寫入 KV／D1）。
- 主子帳本完整多步填寫與金額正確性（由來源 repo 單元測試負責）。
- 20 題完整作答與 16 型結果分布。
