# Progress

## 目前進度（Phase 1）

- [x] 建立公開 repo `frobel0520/site-e2e` 與共用基線 `shared/baseline.ts`
- [x] 建立 GitHub Actions 自動化排程與 PR 驗收（`.github/workflows/e2e.yml`）
- [x] 完成 3 個先導站點規格與 Playwright E2E 測試：
  - `suites/media-craft/`（`https://media-craft.pages.dev/`）
  - `suites/playmint/`（`https://playmint.pages.dev/`）
  - `suites/tensift/`（`https://tensift.pages.dev/`）

## 下一階段（Phase 2：跨站擴充待辦）

以下公開站點適合拆分為獨立 Harbor 任務，由不同 Agent 依據各專案文件撰寫 `suites/<slug>/spec.md` 與 `e2e.spec.ts`：

- [x] `nihongo-lab`（`suites/nihongo-lab/`）
- [x] `learning-atlas`（`suites/learning-atlas/`）
- [x] `curio-lab`（`suites/curio-lab/`）
- [ ] `left-foot-right-foot`
- [x] `little-days`（`suites/little-days/`）

> 明確排除：需要真實 Google 帳號登入、或含個人／家庭內部資料的私有站點（如 `Family` 私有內部頁與 `harbor` Owner 管理頁）。
>
> 已移出 Phase 2（Owner 2026-11-24 決定）：
> - `pikmin-mushroom-room`：網址僅限家人私下分享，且操作會寫入家人共用資料庫。
> - `typing-lab`：Windows 桌面程式，沒有公開網頁。
> - `motorcycle-simulator-rebuild`：Unity 專案，沒有網頁版。
