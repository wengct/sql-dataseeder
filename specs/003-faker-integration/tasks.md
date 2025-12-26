# Tasks: 整合 Faker.js 提供更真實的假資料生成

**Input**: Design documents from `/specs/003-faker-integration/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, quickstart.md, contracts/

**Tests**: 依循 Constitution III TDD 原則，各 Phase 於實作前包含對應測試任務。

**Organization**: 任務依使用者故事分組，便於獨立實作與測試。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無相依性）
- **[Story]**: 該任務所屬的使用者故事（如 US1, US2, US3）
- 描述中包含確切的檔案路徑

## Path Conventions

- **Single project**: `src/`, `out/` 於專案根目錄
- VS Code 擴充套件結構

---

## Phase 1: Setup (專案設定)

**Purpose**: 安裝相依套件與更新專案配置

- [x] T001 安裝 @faker-js/faker 套件：執行 `npm install @faker-js/faker`
- [x] T002 在 package.json 新增 VS Code 設定貢獻宣告（sqlDataSeeder.faker.enabled, sqlDataSeeder.faker.locale）

---

## Phase 2: Foundational (基礎架構)

**Purpose**: 核心型別定義與服務介面，MUST 完成才能開始使用者故事

**⚠️ CRITICAL**: 所有使用者故事都依賴此階段完成

- [x] T003 建立欄位模式型別定義於 src/models/fieldPattern.ts（FieldCategory, FakerMethodId, FieldPattern, FieldMatchResult, FakerConfig, FakerLocale, DEFAULT_FAKER_CONFIG）
- [x] T004 在 src/models/index.ts 匯出 fieldPattern.ts 的所有型別
- [x] T005 [P] 建立預設欄位模式定義陣列 DEFAULT_FIELD_PATTERNS 於 src/models/fieldPattern.ts（14+ 種模式）
- [x] T006 [P] 建立 FakerConfigService 類別於 src/services/fakerConfigService.ts（getConfig, isEnabled, getLocale, validateLocale）
- [x] T007 建立 FieldPatternMatcher 類別於 src/services/fieldPatternMatcher.ts（match 方法、最長匹配優先排序邏輯、多關鍵字匹配處理）
- [x] T007a [P] 建立 FieldPatternMatcher 單元測試於 src/test/unit/fieldPatternMatcher.test.ts（TDD：先撰寫測試）
- [x] T007b [P] 建立 FakerConfigService 單元測試於 src/test/unit/fakerConfigService.test.ts（TDD：先撰寫測試）

**Checkpoint**: 基礎架構完成 - 使用者故事可以開始實作

---

## Phase 3: User Story 1 - 智慧欄位識別產生真實資料 (Priority: P1) 🎯 MVP

**Goal**: 根據欄位名稱自動產生對應的真實假資料（Email、FirstName、Phone 等）

**Independent Test**: 選取包含常見欄位名稱的資料表定義，執行產生 INSERT 語句，驗證產生的值符合欄位語意

### Implementation for User Story 1

- [x] T008 [US1] 擴展 FakeDataService 測試於 src/test/unit/fakeDataService.test.ts（TDD：先撰寫 Faker 整合測試案例）
- [x] T009 [US1] 在 src/services/fakeDataService.ts 匯入 Faker.js 並建立 Faker 實例
- [x] T010 [US1] 在 src/services/fakeDataService.ts 匯入 FieldPatternMatcher 服務
- [x] T011 [US1] 在 src/services/fakeDataService.ts 新增 tryGenerateFakerValue() 私有方法，根據 FieldMatchResult 呼叫對應的 Faker 方法
- [x] T012 [US1] 在 src/services/fakeDataService.ts 新增 truncateToMaxLength() 輔助方法，處理字串長度限制（FR-007）
- [x] T013 [US1] 修改 src/services/fakeDataService.ts 的字串資料產生邏輯：先嘗試 Faker 匹配，失敗則 fallback 至原有隨機字串
- [x] T014 [US1] 實作 Faker 方法映射邏輯於 src/services/fakeDataService.ts，支援所有 FakerMethodId（person.firstName, internet.email 等）

**Checkpoint**: User Story 1 完成 - 智慧欄位識別功能可獨立測試

---

## Phase 4: User Story 2 - 多語系假資料支援 (Priority: P2)

**Goal**: 支援英文與繁體中文語系切換

**Independent Test**: 變更 VS Code 設定中的語系選項，執行產生 INSERT 語句，驗證資料語系正確

### Implementation for User Story 2

- [x] T015 [US2] (depends: T014) 在 src/services/fakeDataService.ts 匯入 FakerConfigService
- [x] T016 [US2] (depends: T015) 修改 Faker 實例建立邏輯：根據 FakerConfigService.getLocale() 選擇語系（en 或 zh_TW）
- [x] T017 [US2] (depends: T016) 實作 createFakerInstance() 方法於 src/services/fakeDataService.ts，支援語系 fallback chain（zh_TW → en → base）
- [x] T018 [US2] (depends: T017) 實作不支援語系的 fallback 邏輯：自動退回使用 'en'
- [x] T019 [US2] 新增語系動態切換整合測試於 src/test/unit/fakeDataService.test.ts（驗證 SC-004）

**Checkpoint**: User Story 2 完成 - 多語系功能可獨立測試

---

## Phase 5: User Story 3 - 功能開關控制 (Priority: P3)

**Goal**: 透過設定開關選擇是否啟用智慧假資料功能

**Independent Test**: 變更 VS Code 設定中的功能開關，執行產生 INSERT 語句，驗證策略切換正確

### Implementation for User Story 3

- [x] T020 [US3] (depends: T014) 修改 src/services/fakeDataService.ts：在產生資料前檢查 FakerConfigService.isEnabled()
- [x] T021 [US3] (depends: T020) 實作功能開關邏輯：disabled 時完全跳過 Faker 匹配，直接使用原有隨機字串邏輯
- [x] T022 [US3] (depends: T021) 確保非字串資料類型（數值、日期、布林值）維持原有產生邏輯不變（FR-008）

**Checkpoint**: User Story 3 完成 - 功能開關可獨立測試

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 文件更新、整合驗證與品質提升

- [x] T023 執行現有測試確保向下相容（npm run test）
- [x] T024 更新 README.md 新增 Faker.js 功能說明
- [x] T025 更新 CHANGELOG.md 記錄新功能
- [x] T026 執行 quickstart.md 手動驗證流程

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依 - 可立即開始
- **Foundational (Phase 2)**: 依賴 Setup 完成 - BLOCKS 所有使用者故事
- **User Stories (Phase 3-5)**: 都依賴 Foundational 完成
  - US1 (P1)：無其他故事相依性
  - US2 (P2)：依賴 US1 完成（需有 Faker 實例才能切換語系）
  - US3 (P3)：依賴 US1 完成（需有 Faker 整合才能控制開關）
- **Polish (Phase 6)**: 依賴所有使用者故事完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他故事相依性
- **User Story 2 (P2)**: 依賴 US1（Faker 實例建立）
- **User Story 3 (P3)**: 依賴 US1（Faker 整合邏輯）

### Within Each User Story

- 型別定義 → 服務實作 → 整合測試
- 核心實作 → 邊界情況處理
- 每個 Story 完成後可獨立驗證

### Parallel Opportunities

- Phase 2: T005 與 T006 可平行執行（不同檔案）；T007a 與 T007b 可平行執行（不同測試檔案）

---

## Parallel Example: Foundational Phase

```bash
# 可同時執行：
Task: "建立預設欄位模式定義陣列 DEFAULT_FIELD_PATTERNS 於 src/models/fieldPattern.ts"
Task: "建立 FakerConfigService 類別於 src/services/fakerConfigService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: 測試欄位識別功能
5. 可部署 MVP 版本

### Incremental Delivery

1. Setup + Foundational → 基礎架構完成
2. Add User Story 1 → 智慧欄位識別 → Deploy/Demo (MVP!)
3. Add User Story 2 → 多語系支援 → Deploy/Demo
4. Add User Story 3 → 功能開關 → Deploy/Demo
5. 每個 Story 獨立增加價值

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

- 安裝 Faker.js 套件
- 欄位模式型別定義
- FieldPatternMatcher 服務
- FakeDataService 整合
- 智慧欄位識別產生真實資料

---

## Notes

- [P] tasks = 不同檔案、無相依性
- [Story] label 對應 spec.md 的使用者故事
- 每個使用者故事應可獨立完成與測試
- 提交時機：每個任務或邏輯群組完成後
- 任一 Checkpoint 都可停下驗證
- 避免：模糊任務、同檔案衝突、跨故事相依性
