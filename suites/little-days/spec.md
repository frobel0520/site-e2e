# little-days E2E 規格

- **目標網站**：`https://playmint-little-days.pages.dev/`（Playmint 目錄列出的「小日子收納」正式網址）
- **來源 Repo**：`frobel0520/little-days`（Godot 4.6.3 3D 收納遊戲，Web 版以 WebGL 2 canvas 繪製）
- **測試邊界**：只開公開頁面。互動測試一律走 `?playtest=1`：來源 README「存檔」段說明此模式使用獨立測試存檔、不讀玩家進度，並提供唯讀的 `window.littleDaysState` 給瀏覽器測試。不匯入／匯出備份，不送任何寫入請求。

## 核心不變量（依據來源 Repo README「內容」「操作」「存檔」）

1. **基線健康**：HTTP 200、非空標題、0 `pageerror`、0 `console.error`、0 同源資源錯誤、桌面（1280×900）與手機（375×812）無橫向捲軸、深淺色主題切換正常。畫面全部畫在 canvas，沒有 DOM 文字，因此以 `requireVisibleText: false` 關閉文字檢查，改為確認 canvas 可見。
2. **遊戲可啟動**：playtest 模式載入引擎後會發布遊戲狀態，共 11 個日常場景（主線 6 關＋5 個抽屜小品），新存檔已收好 0 件，「今天收好了」（`finish`）在整理前是停用狀態。
3. **選取與放置**：從清單選「相機」（`camera`）後點「上層架」（`shelf-high`）家具按鈕，相機會放到上層架。整個過程不寫入玩家存檔 `little-days-godot-v1`，0 `pageerror`，0 Godot `SCRIPT ERROR`／`USER ERROR`。

## 共用基線調整

- `shared/baseline.ts` 新增選項 `requireVisibleText`，預設 `true`，所以其他站點行為不變。只有純 canvas 應用可以明確關掉。

## 不測範圍

- 拖放、旋轉、鏡頭、音效、貓咪互動、收尾劇情與六關通關（由來源 repo `npm run test:browser` 負責）。
- 進度備份匯出／匯入。
- 載入效能：引擎檔案較大，基線與互動測試各給 180 秒逾時，只確認可用，不當效能指標。
