````markdown
# Tasks: 從現有資料庫資料產生 INSERT 腳本

**Input**: Design documents from `/specs/002-existing-data-insert/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: 根據 Constitution 原則 III「Test-First Development」，新功能 MUST 先撰寫測試。所有新增模組皆有對應測試任務，為必要（非選擇性）。

**Organization**: 任務按 User Story 分組，以便獨立實作與測試每個故事。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無相依性）
- **[Story]**: 所屬 User Story（如 US1, US2, US3, US4）
- 描述中包含確切檔案路徑

## Path Conventions

- **單一專案**: `src/`、`src/test/` 位於儲存庫根目錄
- 根據 plan.md 定義的結構

---

## Phase 1: Setup（共用基礎設施）

**Purpose**: 專案初始化與基本結構

- [x] T001 建立功能分支 `002-existing-data-insert`
- [x] T002 [P] 擴展 SqlDataType 列舉，新增 `BINARY`、`VARBINARY` 類型於 src/models/sqlDataType.ts

---

## Phase 2: Foundational（阻塞性前置作業）

**Purpose**: 在任何 User Story 開始前必須完成的核心基礎設施

**⚠️ 關鍵**: 此階段完成後，User Story 工作才能開始

- [x] T003 建立 IExistingDataOptions 介面於 src/models/existingDataTypes.ts（新建）
- [x] T004 [P] 建立 IQueryCell、IQueryRow 介面於 src/models/existingDataTypes.ts
- [x] T005 [P] 建立 IDataQuery 介面於 src/models/existingDataTypes.ts
- [x] T006 [P] 建立 IExistingDataGenerationResult 介面於 src/models/existingDataTypes.ts
- [x] T007 擴展 TableMetadata 類別，新增 `hasIdentityColumn` 計算屬性於 src/models/tableMetadata.ts
- [x] T008 更新 src/models/index.ts 匯出新增的型別
- [x] T009 [P] 擴展錯誤訊息，新增 `TABLE_EMPTY`、`QUERY_NO_RESULTS`、`INVALID_ROW_COUNT`、`QUERY_SYNTAX_ERROR` 於 src/utils/errorMessages.ts
- [x] T010 [P] 新增 `formatValueForSql(cell, column)` 函式於 src/utils/sqlEscape.ts，處理各種資料型別的 SQL 字面量轉換
- [x] T011 新增單元測試驗證 formatValueForSql 函式於 src/test/unit/utils/sqlEscape.test.ts

**Checkpoint**: 基礎設施就緒 - 可開始 User Story 實作

---

## Phase 3: User Story 1 - 從資料表產生基本 INSERT 腳本 (Priority: P1) 🎯 MVP

**Goal**: 使用者能從資料表的現有資料產生 INSERT 語法，複製到剪貼簿

**Independent Test**: 選取任一有資料的資料表，執行指令後驗證剪貼簿中的 INSERT 語法可正確執行

### Implementation for User Story 1

- [x] T012 [US1] 建立 DataQueryBuilder 類別於 src/services/dataQueryBuilder.ts（新建），實作 `buildSelectQuery(options)` 方法組合 SELECT TOP N 查詢
- [x] T013 [US1] 擴展 MssqlService，新增 `queryTableData(node, query)` 方法於 src/services/mssqlService.ts
- [x] T014 [US1] 建立 ExistingDataInsertGenerator 類別於 src/generators/existingDataInsertGenerator.ts（新建），實作 `generate(tableMetadata, rows, options)` 方法
- [x] T015 [US1] 新增單元測試驗證 ExistingDataInsertGenerator 於 src/test/unit/generators/existingDataInsertGenerator.test.ts（新建），包含 SQL 排版格式與現有 insertScriptGenerator 一致性驗證（FR-011）
- [x] T016 [US1] 建立 generateExistingInsertScripts 指令於 src/commands/generateExistingInsertScripts.ts（新建），實作基本互動流程
- [x] T017 [US1] 在 package.json 註冊新指令 `sqlDataSeeder.generateExistingInsertScripts` 與右鍵選單項目
- [x] T018 [US1] 在 src/extension.ts 註冊並啟用新指令
- [x] T019 [US1] 新增單元測試驗證 generateExistingInsertScripts 指令於 src/test/unit/commands/generateExistingInsertScripts.test.ts（新建）
- [x] T020 [US1] 處理空資料表情況，顯示提示訊息「Table [schema].[table] has no data.」

**Checkpoint**: User Story 1 完成 - 可獨立測試基本 INSERT 產生功能

---

## Phase 4: User Story 2 - 限制產生的資料筆數 (Priority: P2)

**Goal**: 使用者能指定只產生前 N 筆資料的 INSERT 語法

**Independent Test**: 指定筆數（如 10）後，驗證產生的 INSERT 語法數量為 10

### Implementation for User Story 2

- [x] T021 [US2] 擴展 generateExistingInsertScripts 指令，新增 InputBox 提示輸入筆數於 src/commands/generateExistingInsertScripts.ts
- [x] T022 [US2] 實作筆數驗證邏輯（必須為正整數），無效時顯示錯誤訊息於 src/commands/generateExistingInsertScripts.ts
- [x] T023 [US2] 設定預設值 100，使用者直接按 Enter 時使用預設值
- [x] T024 [US2] 更新 DataQueryBuilder 以支援 TOP N 參數於 src/services/dataQueryBuilder.ts

**Checkpoint**: User Story 2 完成 - 可獨立測試筆數限制功能

---

## Phase 5: User Story 3 - 使用條件篩選資料 (Priority: P3)

**Goal**: 使用者能透過 WHERE 條件篩選要產生的資料

**Independent Test**: 輸入 WHERE 條件後，驗證產生的資料皆符合該條件

### Implementation for User Story 3

- [x] T025 [US3] 擴展 generateExistingInsertScripts 指令，新增 InputBox 提示輸入 WHERE 條件於 src/commands/generateExistingInsertScripts.ts
- [x] T026 [US3] 實作 WHERE 條件清理邏輯，自動移除使用者輸入的「WHERE」前綴於 src/commands/generateExistingInsertScripts.ts
- [x] T027 [US3] 更新 DataQueryBuilder 以支援 WHERE 子句於 src/services/dataQueryBuilder.ts
- [x] T028 [US3] 處理查詢無結果情況，顯示提示訊息「No data matching the specified conditions.」
- [x] T029 [US3] 處理無效 WHERE 語法錯誤，顯示錯誤訊息並引導使用者修正

**Checkpoint**: User Story 3 完成 - 可獨立測試 WHERE 篩選功能

---

## Phase 6: User Story 4 - 指定資料排序 (Priority: P3)

**Goal**: 使用者能指定資料的排序方式

**Independent Test**: 指定排序欄位後，驗證產生的 INSERT 語法順序符合排序

### Implementation for User Story 4

- [x] T030 [US4] 擴展 generateExistingInsertScripts 指令，新增 InputBox 提示輸入 ORDER BY 欄位於 src/commands/generateExistingInsertScripts.ts
- [x] T031 [US4] 實作 ORDER BY 條件清理邏輯，自動移除使用者輸入的「ORDER BY」前綴於 src/commands/generateExistingInsertScripts.ts
- [x] T032 [US4] 更新 DataQueryBuilder 以支援 ORDER BY 子句於 src/services/dataQueryBuilder.ts

**Checkpoint**: User Story 4 完成 - 可獨立測試排序功能

---

## Phase 7: IDENTITY 欄位處理（跨 User Story 功能）

**Purpose**: 處理 IDENTITY 欄位的特殊邏輯，屬於 FR-010 需求

- [x] T033 擴展 generateExistingInsertScripts 指令，檢測資料表是否有 IDENTITY 欄位於 src/commands/generateExistingInsertScripts.ts
- [x] T034 新增 QuickPick 讓使用者選擇是否包含 IDENTITY 欄位（「Include IDENTITY column values?」）於 src/commands/generateExistingInsertScripts.ts
- [x] T035 更新 ExistingDataInsertGenerator，支援 `includeIdentity` 選項於 src/generators/existingDataInsertGenerator.ts
- [x] T036 當 `includeIdentity = true` 時，產生 `SET IDENTITY_INSERT [table] ON/OFF` 語法於 src/generators/existingDataInsertGenerator.ts
- [x] T037 當 `includeIdentity = false` 時，從 INSERT 欄位列表排除 IDENTITY 欄位於 src/generators/existingDataInsertGenerator.ts
- [x] T038 更新單元測試驗證 IDENTITY 處理邏輯於 src/test/unit/generators/existingDataInsertGenerator.test.ts

**Checkpoint**: IDENTITY 處理功能完成

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 改進影響多個 User Story 的功能

- [x] T039 [P] 實作 VS Code 進度條通知（withProgress），顯示處理進度百分比於 src/commands/generateExistingInsertScripts.ts
- [x] T040 [P] 驗證所有支援的資料型別轉換正確性（字串、數值、日期、NULL、二進位、GUID、BIT）
- [x] T041 [P] 更新 README.md 新增功能說明與使用方式
- [x] T042 [P] 更新 CHANGELOG.md 記錄新功能
- [x] T043 執行 quickstart.md 驗證流程，確認所有測試案例通過
- [x] T044 程式碼清理與重構，確保符合現有程式碼風格

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性 - 可立即開始
- **Foundational (Phase 2)**: 相依於 Setup 完成 - **阻塞所有 User Story**
- **User Stories (Phase 3-6)**: 皆相依於 Foundational 階段完成
  - User Story 可平行進行（若有人力）
  - 或按優先順序依序進行（P1 → P2 → P3）
- **IDENTITY 處理 (Phase 7)**: 相依於 User Story 1 完成
- **Polish (Phase 8)**: 相依於所有所需 User Story 完成

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 完成後可開始 - 無其他 Story 相依
- **User Story 2 (P2)**: Foundational 完成後可開始 - 可獨立測試
- **User Story 3 (P3)**: Foundational 完成後可開始 - 可獨立測試
- **User Story 4 (P3)**: Foundational 完成後可開始 - 可獨立測試

### Within Each User Story

- 模型優先於服務
- 服務優先於產生器
- 產生器優先於指令
- 核心實作優先於整合

### Parallel Opportunities

- Phase 2 中標記 [P] 的任務可平行執行
- Foundational 完成後，各 User Story 可平行開始
- Phase 8 中標記 [P] 的任務可平行執行

---

## Parallel Example: Foundational Phase

```bash
# 可同時執行的基礎設施任務：
Task T003: 建立 IExistingDataOptions 介面
Task T004: 建立 IQueryCell、IQueryRow 介面
Task T005: 建立 IDataQuery 介面
Task T006: 建立 IExistingDataGenerationResult 介面
Task T009: 擴展錯誤訊息
Task T010: 新增 formatValueForSql 函式
```

---

## Parallel Example: After Foundational

```bash
# Foundational 完成後，可同時進行不同 User Story：
Developer A: User Story 1 (T012-T020)
Developer B: User Story 2 (T021-T024) - 等待 T016 完成後開始
Developer C: User Story 3 (T025-T029) - 等待 T016 完成後開始
Developer D: User Story 4 (T030-T032) - 等待 T016 完成後開始
```

---

## Implementation Strategy

### MVP First（僅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵 - 阻塞所有 Story**）
3. 完成 Phase 3: User Story 1
4. **暫停並驗證**: 獨立測試 User Story 1
5. 可部署/展示 MVP

### Incremental Delivery

1. 完成 Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示（MVP!）
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 新增 User Story 4 → 獨立測試 → 部署/展示
6. 新增 IDENTITY 處理 → 完整功能
7. 每個 Story 增加價值而不破壞先前 Story

### Parallel Team Strategy

有多位開發者時：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A: User Story 1（必須先完成指令框架）
   - 開發者 B/C/D: 可在 A 完成指令框架後平行處理 US2-4 的擴展
3. 各 Story 獨立完成並整合

---

## Notes

- [P] 任務 = 不同檔案、無相依性
- [Story] 標籤將任務對應到特定 User Story 以便追蹤
- 每個 User Story 應可獨立完成與測試
- 每個任務或邏輯群組完成後提交
- 可在任何 Checkpoint 暫停以獨立驗證 Story
- 避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 相依

---

## Summary

| 統計項目 | 數量 |
|----------|------|
| **總任務數** | 44 |
| **Setup 任務** | 2 |
| **Foundational 任務** | 9 |
| **User Story 1 任務** | 9 |
| **User Story 2 任務** | 4 |
| **User Story 3 任務** | 5 |
| **User Story 4 任務** | 3 |
| **IDENTITY 處理任務** | 6 |
| **Polish 任務** | 6 |
| **可平行任務** | 12 |

### Suggested MVP Scope

- **Phase 1**: Setup（T001-T002）
- **Phase 2**: Foundational（T003-T011）
- **Phase 3**: User Story 1（T012-T020）

完成以上 20 個任務即可交付可用的 MVP 版本。

### 格式驗證

✅ 所有任務皆遵循 checklist 格式：`- [ ] [TaskID] [P?] [Story?] 描述與檔案路徑`

````
