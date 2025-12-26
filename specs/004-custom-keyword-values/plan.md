# Implementation Plan: 自定義關鍵字固定值（Custom Keyword Values）

**Branch**: `feature/004-custom-keyword-values` | **Date**: 2025-12-26 | **Spec**: `specs/004-custom-keyword-values/spec.md`
**Input**: 依據 `specs/004-custom-keyword-values/spec.md`（自定義關鍵字/欄位名稱模式 → 固定值，並於產生時優先套用）

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

新增一組 VS Code 設定，讓使用者可以用「欄位名稱匹配規則（literal contains / regex i）」對應「固定值（null/number/string）」；在產生 INSERT 腳本時，任何欄位一旦命中規則就直接輸出該固定值，且優先於既有的 Faker 智慧產生與型別預設產生。

無效規則（缺欄位、空 pattern、regex 編譯失敗）不應中斷產生流程：規則會被忽略並輸出 warning（主要寫到 VS Code Output Channel，必要時可額外 toast 一次）。

## Technical Context

**Language/Version**: TypeScript 5.9.x（tsconfig: `strict: true`）  
**Primary Dependencies**: VS Code Extension API、`ms-mssql.mssql`（extensionDependencies）、`@faker-js/faker`（既有智慧產生）  
**Storage**: N/A（不自建儲存；透過 mssql 擴充套件連線讀取 schema/資料）  
**Testing**: Mocha + `@vscode/test-cli`（`npm run test`）  
**Target Platform**: VS Code ^1.106.1（Node extension runtime）
**Project Type**: 單一 VS Code Extension（Webpack bundle 至 `dist/extension.js`）  
**Performance Goals**: 產生 1,000 筆資料時，相對未啟用本功能總耗時增加不超過 10%（SC-002）  
**Constraints**: 必須維持 SQL Server 2016+ 相容；嚴格型別；外部相依最小化；設定錯誤不得導致整體產生失敗（FR-008）  
**Scale/Scope**: 主要影響「每欄位值產生」流程（先套用固定值規則，再走既有 Faker/型別產生）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 憲章閘門（Constitution Gates）

- **I. VS Code Extension Architecture**：僅新增 VS Code 設定讀取、Output Channel 診斷與既有產生流程整合；不引入外部 GUI。✅ PASS
- **II. Type Safety First**：新增的設定/規則/Matcher 需有明確型別（禁止 `any`）；regex 編譯與 value 推斷有明確結果型別。✅ PASS
- **III. Test-First Development**：先新增單元測試覆蓋：匹配（literal/regex）、first-match-wins、無效規則容錯、value 推斷/格式化。✅ PASS
- **IV. SQL Server Compatibility**：輸出值必須是 SQL Server 可接受 literal（`NULL`/數字/字串引號與跳脫）；不允許 raw SQL expression。✅ PASS
- **V. User Experience Simplicity**：使用者只需在 settings.json 管理規則；產生流程不多加互動；錯誤/警示可理解。✅ PASS
- **VI. Brownfield Management**：若需插入 Output Channel 或抽取設定服務，採最小重構並確保不破壞既有功能。✅ PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-custom-keyword-values/
├── plan.md              # 本檔
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # Phase 2（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
src/
├── commands/
├── extension.ts
├── generators/
├── models/
├── services/
├── test/
└── utils/

# tests（現況）
src/test/
└── unit/
   └── services/
```

**Structure Decision**: 單一 VS Code Extension 專案；功能實作主要落在 `src/services/`（設定讀取 + 規則匹配 + 值格式化）並在現有的產生流程（`FakeDataService` / generator）中以「最高優先」插入。

## Complexity Tracking

本功能不需要引入新專案/新層級架構；預期無憲章違規。

## Phase 0：Outline & Research（已彙整至 `research.md`）

- 釐清/決策：設定結構、匹配語意、無效規則容錯、SQL literal 推斷與安全策略、診斷輸出方式。

## Phase 1：Design & Contracts（已產出）

- `data-model.md`：定義設定與規則實體、驗證規則。
- `contracts/`：輸出設定 schema 與（概念性）產生服務 OpenAPI。
- `quickstart.md`：提供使用者設定與驗證步驟。

## Phase 2：Implementation Planning（僅規劃，停止於此）

### 實作步驟（建議順序）
1. 新增型別：`CustomKeywordValueRule`、`MatchType`、`CustomKeywordValuesConfig`（models）。
2. 新增設定讀取服務：從 `vscode.workspace.getConfiguration('sqlDataSeeder')` 讀取 `customKeywordValues.rules`，並做 validation（無效規則忽略 + warning）。
3. 新增規則匹配器：
   - literal：`columnName.toLowerCase().includes(pattern.toLowerCase())`
   - regex：`new RegExp(pattern, 'i')`；編譯失敗則忽略 + warning
   - first match wins
   - 針對 regex 建議做 cache（以減少每欄位重複編譯）
4. 新增固定值 → SQL literal 格式化（FR-010）：
   - `null` → `NULL`
   - number → `123`
   - string：預設 `'...'`（必要時 `N'...'`，取決於欄位型別）；做 SQL 單引號跳脫
   - 若字串含 `;`, `--`, `/*`, `*/` 等 token：仍視為字串（不可當作 raw SQL）
5. 整合到產生流程：在 `FakeDataService.generateValue(column)` 一開始先詢問「是否命中固定值規則」，命中則直接回傳（優先於 Faker/型別預設）。
6. 診斷輸出：新增/共用 Output Channel（例如 `SQL DataSeeder`）寫入忽略規則的原因；重大問題可 `showWarningMessage` 一次。
7. 測試（Test-first）：新增 unit tests 覆蓋 FR-004/007/008/010，並確保既有 Faker 測試不回歸。
8. 更新 `package.json` contributes.configuration：新增設定項與 schema（含 examples）。

### 驗收檢查
- 設定 1 筆規則即可覆寫對應欄位值（User Story 1）。
- 多筆規則與大小寫、衝突行為符合規格（User Story 2）。
- 無效 regex/無效規則不影響產生，且有可理解診斷（User Story 3）。
