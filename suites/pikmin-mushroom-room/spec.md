# 蘑菇戰情室隔離測試

依來源 repo 的 README、系統分析與系統設計，測試初始狀態、輸入後自動加五分鐘，以及 Realtime 更新後切換為剩餘五分鐘內的警示狀態。

```sh
node suites/pikmin-mushroom-room/fixture.mjs ../pikmin-mushroom-room
```

已驗證來源 repo 主線 commit `ab9382efd9198dc0a7396ae4d066b576e82feafe`。

使用來源 checkout 的 `js/app.js`，執行前將點位替換為合成樣本，只載入最小 DOM 與記憶體中的 Supabase 替身。Chromium context 設為離線並拒絕所有路由，頁面沒有實際 Supabase 網址、憑證、點位或家庭資料；驗證寫入 payload、Realtime 回覆及零網路請求。

這是經 Owner 核准的本機隔離測試，不走公開站點 Site E2E workflow。測試範圍限於前端行為與合成回覆，正式資料庫欄位型別、實際跨裝置同步及正式畫面布局不在驗收範圍內。
