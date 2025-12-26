---

description: "Task list for feature implementation"
---

# Tasks: 自定義關鍵字固定值（Custom Keyword Values）

**Input**: `specs/004-custom-keyword-values/plan.md`、`specs/004-custom-keyword-values/spec.md`（並參考 `research.md`、`data-model.md`、`contracts/`、`quickstart.md`）

**Tests**: 本功能在 `plan.md` 憲章閘門中明確要求 Test-first（Mocha + `@vscode/test-cli`），因此以下任務包含測試。

**Organization**: 依 User Story 分組，確保每個故事可獨立實作與驗收。

---

## Phase 1: Setup（專案初始化/驗證）

- [X] T001 重新確認需求/驗收重點（P1~P3、FR-001~FR-010、SC-001~SC-003）於 specs/004-custom-keyword-values/spec.md
- [X] T002 重新確認整合點（FakeDataService.generateValue 優先序、TS strict、測試框架）於 specs/004-custom-keyword-values/plan.md
- [X] T003 執行既有測試基線（確認環境可跑）使用 package.json scripts.test（npm run test）

---

## Phase 2: Foundational（阻塞性基礎建設）

**⚠️ CRITICAL**：本階段完成前，不開始任何 User Story 的整合行為修改。

- [X] T004 [P] 新增 CustomKeywordValueRule 型別與基礎驗證 helper 於 src/models/customKeywordValueRule.ts
- [X] T005 [P] 新增 CustomKeywordValuesConfig 型別（包含 rules）於 src/models/customKeywordValuesConfig.ts
- [X] T006 [P] 匯出新 model 於 src/models/index.ts（export CustomKeywordValueRule/CustomKeywordValuesConfig）
- [X] T007 [P] 建立輸出診斷通道工具（Output Channel name: "SQL DataSeeder"）於 src/utils/outputChannel.ts
- [X] T012 [P] [US1] 新增/更新 formatter 單元測試：null/number/string、危險 token 強制字串、與 N 前綴行為於 src/test/unit/utils/customKeywordValuesSqlFormat.test.ts
- [X] T013 [P] [US1] 新增 ConfigService 單元測試：可讀取 sqlDataSeeder.customKeywordValues.rules 並回傳 rules/warnings 於 src/test/unit/services/customKeywordValuesConfigService.test.ts
- [X] T014 [P] [US1] 新增 Matcher 單元測試：literal contains 不分大小寫命中於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts
- [X] T008 [P] 擴充 SQL literal 格式化（null/number/string + N'...' vs '...' + escape）於 src/utils/sqlEscape.ts（新增 formatCustomKeywordValueForSql(value, column)）
- [X] T009 [P] 新增 CustomKeywordValuesConfigService（讀取設定 + 過濾無效規則 + 收集 warnings）於 src/services/customKeywordValuesConfigService.ts
- [X] T010 [P] 新增 CustomKeywordValueRuleMatcher（literal contains/regex i、first match wins、regex cache）於 src/services/customKeywordValueRuleMatcher.ts
- [X] T011 更新 VS Code 設定 schema（contributes.configuration）新增 sqlDataSeeder.customKeywordValues.rules 於 package.json

**Checkpoint**：Foundation ready（已具備：型別、設定讀取/驗證、匹配器、SQL literal 格式化、診斷輸出、設定 schema）。

---

## Phase 3: User Story 1 - 以自定義固定值覆寫欄位產生 (Priority: P1) 🎯 MVP

**Goal**：使用者能設定 1 筆規則（pattern + matchType + value），產生 INSERT 時命中欄位會輸出固定值，且優先於 Faker/既有產生邏輯。

**Independent Test**：依 quickstart 設定 1 筆 `tenantid → 1`，對含 TenantId 欄位的表產生腳本，確認該欄位值皆為 `1`，且同時存在 faker 命中時仍以固定值為準。

### Tests（先寫，確保會 FAIL 再實作）

- （已於 Phase 2（Foundational）先完成 T012–T014，確保先測試後實作）

### Implementation

- [X] T015 [US1] 在 FakeDataService.generateValue 最前面套用固定值規則（命中即直接回傳 SQL literal）於 src/services/fakeDataService.ts
- [X] T016 [US1] 確保固定值規則優先於 Faker（欄位同時可被 FieldPatternMatcher 命中時仍以固定值為準）於 src/services/fakeDataService.ts
- [X] T017 [US1] 新增 FakeDataService 整合測試：命中固定值時輸出固定值（並覆蓋 faker 情境）於 src/test/unit/services/fakeDataService.test.ts

**Checkpoint**：US1 完成後，僅靠設定 1 筆規則即可交付 MVP。

---

## Phase 4: User Story 2 - 支援多筆規則與可預期的匹配行為 (Priority: P2)

**Goal**：支援多筆規則；不分大小寫；同欄位多筆命中時 first match wins（依設定順序）。

**Independent Test**：設定 3 筆規則（含大小寫差異與同欄位多筆命中），產生一次腳本並確認：
1) 不同欄位各自命中正確規則；2) 大小寫不影響命中；3) 同欄位多筆命中取第一筆。

### Tests

- [X] T018 [P] [US2] 新增 Matcher 單元測試：同欄位多筆命中時取第一筆（rules array index）於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts
- [X] T019 [P] [US2] 新增 FakeDataService 測試：rules 為空/未設定/存在但不命中時不改變既有行為（回歸）於 src/test/unit/services/fakeDataService.test.ts

### Implementation

- [X] T020 [US2] 確保 CustomKeywordValueRuleMatcher 嚴格使用輸入 rules 順序（不得排序/不得改變優先序）於 src/services/customKeywordValueRuleMatcher.ts

---

## Phase 5: User Story 3 - 支援進階匹配（正規表達式）並具備容錯 (Priority: P3)

**Goal**：支援 `matchType: "regex"`（固定 i）；regex 無法編譯或規則缺欄位/空 pattern 時需忽略且產生 warning，不得中斷產生。

**Independent Test**：設定 1 筆有效 regex（如 `^is_`）+ 1 筆無效 regex，產生腳本並確認：有效規則生效、無效規則被忽略、仍可完成產生且有診斷訊息。

### Tests

- [X] T021 [P] [US3] 新增 Matcher 單元測試：regex i 命中（例如 `^is_` 可命中 `Is_Active`）於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts
- [X] T022 [P] [US3] 新增 ConfigService 單元測試：無效 regex/缺欄位/空 pattern 會被忽略並回傳 warnings 於 src/test/unit/services/customKeywordValuesConfigService.test.ts
- [X] T023 [P] [US3] 新增 FakeDataService 測試：存在無效規則時仍可產生且不 throw 於 src/test/unit/services/fakeDataService.test.ts

### Implementation

- [X] T024 [US3] 在 CustomKeywordValuesConfigService 實作規則驗證：regex 編譯失敗時忽略規則並記錄 warning 於 src/services/customKeywordValuesConfigService.ts
- [X] T025 [US3] 將 warnings 輸出到 VS Code Output Channel（主要）並避免過度干擾（必要時僅一次 toast）於 src/utils/outputChannel.ts 與 src/services/customKeywordValuesConfigService.ts
- [X] T026 [US3] 在 CustomKeywordValueRuleMatcher 加入 regex compiled cache（pattern → RegExp）以降低大量產生時的重複編譯成本於 src/services/customKeywordValueRuleMatcher.ts

---

## Phase 6: Polish & Cross-Cutting Concerns（收尾與橫切面）

- [X] T027 [P] 對齊並更新文件示例（settings key、規則範例）於 specs/004-custom-keyword-values/quickstart.md
- [X] T028 [P] 對齊概念性合約/Schema（若有差異）於 specs/004-custom-keyword-values/contracts/settings.schema.json
- [X] T029 [P] 加入/更新效能回歸測試或基準檢查說明（SC-002；包含可重複執行的量測步驟/指令/記錄格式；並說明 regex cache）於 specs/004-custom-keyword-values/research.md
- [X] T030 執行 lint 與測試驗證（pretest：compile-tests + compile + lint）使用 package.json scripts.pretest（npm run pretest）

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 → Phase 2 → Phase 3（US1）
- Phase 4（US2）與 Phase 5（US3）皆依賴 Phase 2（且建議在 US1 完成後再擴充）
- Phase 6 依賴要納入的 user stories 完成

### User Story Dependencies

- **US1 (P1)**：無依賴（Foundation 完成即可做）
- **US2 (P2)**：邏輯上延伸 US1 的 matcher 行為（建議 US1 完成後）
- **US3 (P3)**：延伸 US1（regex 與容錯/診斷），建議於 US1 完成後

---

## Parallel Example（每個 User Story）

### US1

可平行：
- T012（formatter tests）、T013（config tests）、T014（matcher tests）

### US2

可平行：
- T018（matcher tests）與 T019（service regression tests）

### US3

可平行：
- T021（matcher regex tests）、T022（config validation tests）、T023（service robustness tests）

---

## Implementation Strategy

### MVP First（只做 US1）

1. 完成 Phase 1 + Phase 2（確保設定可讀、可診斷、可格式化）
2. 完成 Phase 3（US1）並依 Independent Test 驗收
3. **停止**：確認能穩定覆寫固定欄位值且不破壞既有 faker/型別產生

### Incremental Delivery

- 先交付 US1（可用 MVP）
- 再補 US2（多規則一致性）
- 最後補 US3（regex + 容錯 + 診斷）
