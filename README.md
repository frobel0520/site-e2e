# site-e2e

文件驅動的跨站自動化 Playwright E2E 測試中心（Public Repo，使用 GitHub Actions 免費額度）。

## 涵蓋站點

| 站點 | 正式網址 | 規格文件 | 狀態 |
| :--- | :--- | :--- | :--- |
| `media-craft` | https://media-craft.pages.dev/ | [`suites/media-craft/spec.md`](suites/media-craft/spec.md) | ✅ Phase 1 |
| `playmint` | https://playmint.pages.dev/ | [`suites/playmint/spec.md`](suites/playmint/spec.md) | ✅ Phase 1 |
| `tensift` | https://tensift.pages.dev/ | [`suites/tensift/spec.md`](suites/tensift/spec.md) | ✅ Phase 1 |

## 本機執行

```bash
npm install
npx playwright install chromium
npm run typecheck
npm test
# 只跑單一站點：
npx playwright test suites/media-craft
```

## 新增站點流程（給 Agent）

1. 閱讀目標 repo 的 `README.md`、`docs/` 與 `progress.md`。
2. 在 `suites/<slug>/spec.md` 整理測試規格（核心旅程、合成輸入、排除項目）。
3. 在 `suites/<slug>/e2e.spec.ts` 撰寫 Playwright 測試（必含 `runSiteBaseline`＋至少 1 條真實互動旅程）。
4. 跑完 `npm run check` 全綠後開 PR。
