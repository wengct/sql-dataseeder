---

description: "Task list for 支援中文欄位名稱與同義詞匹配"
---

# Tasks: 支援中文欄位名稱與同義詞匹配

**Input**: Design documents from `specs/001-chinese-column-matching/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 需求包含測試情境與 Test-First 開發要求，因此本清單包含測試任務。

**Organization**: 依照 user story 分組，確保每個故事可獨立完成與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無相依）
- **[Story]**: 對應 user story（US1/US2/US3）
- 描述必須包含確切檔案路徑

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 共用基礎工具與測試基礎

- [X] T002 [P] 新增正規化單元測試（全形/半形、大小寫）於 `src/test/unit/utils/columnNameNormalizer.test.ts`
- [X] T001 建立欄位名稱正規化工具（NFKC + en-US 小寫）於 `src/utils/columnNameNormalizer.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 共用設定與型別基礎，後續故事共用

- [X] T003 [P] 定義同義詞群組型別與驗證規則於 `src/models/columnNameSynonyms.ts`
- [X] T011 [P] 新增同義詞設定驗證測試（合法/不合法群組）於 `src/test/unit/services/columnNameSynonymsConfigService.test.ts`
- [X] T004 [P] 新增同義詞設定讀取/驗證服務與警告輸出於 `src/services/columnNameSynonymsConfigService.ts`
- [X] T005 [P] 匯出同義詞型別與驗證於 `src/models/index.ts`
- [X] T006 [P] 新增 `sqlDataSeeder.columnNameSynonyms` 設定結構於 `package.json`

**Checkpoint**: 基礎工具與設定已就緒

---

## Phase 3: User Story 1 - 中文欄位名稱規則命中 (Priority: P1) MVP

**Goal**: 中文/混合欄位名稱可被規則與語意匹配流程正確命中。

**Independent Test**: 設定中文 pattern 規則並以含中文欄位資料表進行匹配，確認規則命中與輸出值正確。

### Tests for User Story 1

- [X] T007 [P] [US1] 新增中文/混合欄位 literal 規則匹配測試於 `src/test/unit/services/customKeywordValueRuleMatcher.test.ts`
- [X] T008 [P] [US1] 新增混合欄位語意匹配測試（例如「使用者Email」）於 `src/test/unit/fieldPatternMatcher.test.ts`

### Implementation for User Story 1

- [X] T009 [US1] 套用正規化工具於 literal 規則匹配流程（保留 contains 行為）於 `src/services/customKeywordValueRuleMatcher.ts`
- [X] T010 [US1] 套用正規化工具於欄位語意匹配流程於 `src/services/fieldPatternMatcher.ts`

**Checkpoint**: User Story 1 可獨立驗證

---

## Phase 4: User Story 2 - 同義詞也能命中 (Priority: P2)

**Goal**: 同義詞設定可將欄位名稱視為匹配成功，並優先於語意/模式匹配。

**Independent Test**: 以「身分證字號」規則搭配「證號」欄位測試雙向命中。

### Tests for User Story 2

- [X] T012 [P] [US2] 新增同義詞命中、優先序與非同義詞不命中測試於 `src/test/unit/services/customKeywordValueRuleMatcher.test.ts`

### Implementation for User Story 2

- [X] T013 [US2] 於 `src/services/fakeDataService.ts` 注入同義詞設定並傳遞至 matcher
- [X] T014 [US2] 實作同義詞等值匹配與優先序邏輯於 `src/services/customKeywordValueRuleMatcher.ts`
- [X] T015 [US2] 強化同義詞設定格式錯誤時的整體跳過策略於 `src/services/columnNameSynonymsConfigService.ts`

**Checkpoint**: User Story 2 可獨立驗證

---

## Phase 5: User Story 3 - 英文欄位匹配維持一致 (Priority: P3)

**Goal**: 新增中文/同義詞能力後，既有英文匹配結果不變。

**Independent Test**: 使用既有英文欄位回歸案例確認輸出一致。

### Tests for User Story 3

- [X] T016 [P] [US3] 新增英文 literal/regex 回歸測試於 `src/test/unit/services/customKeywordValueRuleMatcher.test.ts`
- [X] T017 [P] [US3] 新增英文語意匹配回歸測試於 `src/test/unit/fieldPatternMatcher.test.ts`

### Implementation for User Story 3

- [X] T018 [US3] 確認英文匹配行為未變更（必要時調整正規化邏輯）於 `src/utils/columnNameNormalizer.ts`

**Checkpoint**: User Story 3 可獨立驗證

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 文件與跨故事收尾事項

- [X] T019 [P] 更新同義詞設定說明與範例於 `README.md`（對應 FR-009/FR-013）
- [X] T020 [P] 若設定格式或範例有調整，更新 `specs/001-chinese-column-matching/quickstart.md`（對應 FR-009/FR-013）
- [X] T021 [P] 檢核無新增 UI/指令與相關入口（對應 FR-015）
- [X] T022 定義 QA/驗證集與期望結果清單（對應 SC-001/SC-004）
- [X] T023 以 QA/驗證集執行匹配並記錄通過率（對應 SC-001/SC-004）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無依賴，可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成，阻擋所有 user story
- **User Stories (Phase 3+)**: 皆依賴 Foundational 完成
- **Polish (Final Phase)**: 依賴所有需要的 user story 完成

### User Story Dependencies

- **User Story 1 (P1)**: 需完成 Phase 2，無其他依賴
- **User Story 2 (P2)**: 需完成 Phase 2，無其他依賴
- **User Story 3 (P3)**: 需完成 Phase 2，無其他依賴

### Within Each User Story

- 測試（若包含）先寫且應先失敗
- Matching 邏輯優先於整合
- 完成後獨立驗證

---

## Parallel Opportunities

- Phase 1 與 Phase 2 內標記 [P] 的任務可平行執行
- Phase 2 完成後，各 user story 可平行進行
- 各 story 的測試任務可平行

---

## Parallel Example: User Story 1

```bash
Task: "新增中文/混合欄位 literal 規則匹配測試於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts"
Task: "新增混合欄位語意匹配測試（例如「使用者Email」）於 src/test/unit/fieldPatternMatcher.test.ts"
```

---

## Parallel Example: User Story 2

```bash
Task: "新增同義詞設定驗證測試於 src/test/unit/services/columnNameSynonymsConfigService.test.ts"
Task: "新增同義詞命中與優先序測試於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts"
```

---

## Parallel Example: User Story 3

```bash
Task: "新增英文 literal/regex 回歸測試於 src/test/unit/services/customKeywordValueRuleMatcher.test.ts"
Task: "新增英文語意匹配回歸測試於 src/test/unit/fieldPatternMatcher.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational
3. 完成 Phase 3: User Story 1
4. **停止並獨立驗證** User Story 1

### Incremental Delivery

1. Setup + Foundational → 基礎完成
2. User Story 1 → 獨立驗證 → MVP
3. User Story 2 → 獨立驗證
4. User Story 3 → 獨立驗證
5. Polish 收尾

---

## Notes

- [P] 代表可平行且無相依
- 各 user story 必須可獨立測試
- 避免跨故事耦合與模糊任務




