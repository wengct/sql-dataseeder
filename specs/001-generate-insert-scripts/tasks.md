# Tasks: Generate Insert Scripts

**Input**: Design documents from `/specs/001-generate-insert-scripts/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Update package.json with command and menu contributions per research.md
- [X] T002 [P] Create src/models/ directory structure
- [X] T003 [P] Create src/services/ directory structure
- [X] T004 [P] Create src/commands/ directory structure
- [X] T005 [P] Create src/generators/ directory structure
- [X] T006 [P] Create src/utils/ directory structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Test Infrastructure (Constitution III: Test-First Development)

- [X] T007 [P] Create test directory structure: src/test/unit/models/, src/test/unit/services/, src/test/unit/generators/
- [X] T008 [P] Write unit tests for SqlDataType enum in src/test/unit/models/sqlDataType.test.ts
- [X] T009 [P] Write unit tests for IColumnMetadata in src/test/unit/models/columnMetadata.test.ts (isInsertable, isSupported logic)
- [X] T010 [P] Write unit tests for ITableMetadata in src/test/unit/models/tableMetadata.test.ts (insertableColumns filtering)

### Model Implementation

- [X] T011 [P] Implement SqlDataType enum in src/models/sqlDataType.ts per data-model.md (tests T008 should pass)
- [X] T012 [P] Implement IColumnMetadata interface in src/models/columnMetadata.ts per contracts/types.ts (tests T009 should pass)
- [X] T013 [P] Implement ITableMetadata interface in src/models/tableMetadata.ts per contracts/types.ts (tests T010 should pass)
- [X] T014 [P] Implement IGenerationOptions and IGenerationResult interfaces in src/models/generationTypes.ts per contracts/types.ts

### Service Infrastructure

- [X] T015 Implement MssqlService class in src/services/mssqlService.ts per research.md (mssql API integration)
- [X] T016 Implement error message constants and helper functions in src/utils/errorMessages.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 + 2 - 核心功能 (Priority: P1) 🎯 MVP

**Goal**: 使用者可從資料表右鍵選單產生 Insert 語法，系統根據欄位類型產生合理的假資料

**Independent Test**: 在任一資料表上右鍵選擇功能，確認產生的 Insert 語法正確且已複製到剪貼簿

> Note: User Story 1 和 User Story 2 緊密耦合（沒有假資料產生就無法產生完整的 Insert 語法），因此合併為同一 Phase

### Test-First: Service Tests (Constitution III)

- [X] T017 [P] [US1] Write unit tests for SchemaService in src/test/unit/services/schemaService.test.ts
- [X] T018 [P] [US2] Write unit tests for FakeDataService in src/test/unit/services/fakeDataService.test.ts (all data types)
- [X] T019 [P] [US1] Write unit tests for InsertScriptGenerator in src/test/unit/generators/insertScriptGenerator.test.ts

### Implementation for User Story 1 + 2

- [X] T020 [P] [US1] Implement SchemaService class in src/services/schemaService.ts (查詢資料表結構, tests T017 should pass)
- [X] T021 [P] [US2] Implement FakeDataService class in src/services/fakeDataService.ts (假資料產生 - 字串類型, 字元集 a-zA-Z0-9)
- [X] T022 [US2] Add numeric type fake data generation to src/services/fakeDataService.ts (int, bigint, decimal, float)
- [X] T023 [US2] Add datetime type fake data generation to src/services/fakeDataService.ts (datetime, date, time)
- [X] T024 [US2] Add other type fake data generation to src/services/fakeDataService.ts (bit, uniqueidentifier)
- [X] T025 [US1] Implement InsertScriptGenerator class in src/generators/insertScriptGenerator.ts (tests T019 should pass)
- [X] T026 [US1] Implement generateInsertScripts command handler in src/commands/generateInsertScripts.ts
- [X] T027 [US1] Register command and update extension activation in src/extension.ts
- [X] T028 [US1] Implement clipboard utility in src/utils/clipboard.ts

**Checkpoint**: At this point, User Story 1 + 2 should be fully functional - user can generate insert scripts with valid fake data

---

## Phase 4: User Story 3 - 錯誤處理與使用者回饋 (Priority: P2)

**Goal**: 當發生錯誤時，系統顯示清楚的錯誤訊息，說明問題原因並提供解決建議

**Independent Test**: 模擬各種錯誤情境（斷開連線、無權限等），確認錯誤訊息清楚

### Test-First: Error Handling Tests (Constitution III)

- [ ] T029 [US3] Write unit tests for error scenarios in src/test/unit/commands/generateInsertScripts.test.ts

### Implementation for User Story 3

- [ ] T030 [US3] Add mssql extension availability check and error handling to src/services/mssqlService.ts
- [ ] T031 [US3] Add connection error handling to src/commands/generateInsertScripts.ts
- [ ] T032 [US3] Add input validation (row count) error handling to src/commands/generateInsertScripts.ts
- [ ] T033 [US3] Add no insertable columns error handling to src/generators/insertScriptGenerator.ts
- [ ] T034 [US3] Add skipped columns notification to src/commands/generateInsertScripts.ts

**Checkpoint**: All user stories should now be independently functional with proper error handling

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T035 [P] Add JSDoc comments to all public APIs
- [ ] T036 [P] Update README.md with usage instructions per quickstart.md
- [ ] T037 Run quickstart.md validation scenarios
- [ ] T038 Code cleanup and ensure strict TypeScript compliance (no any types)
- [ ] T039 Run all tests and ensure coverage >= 80% (Constitution III requirement)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1+2 (Phase 3)**: Depends on Foundational phase completion
- **User Story 3 (Phase 4)**: Can start after Phase 3 core implementation (T026) exists
- **Polish (Phase 5)**: Depends on all user stories being complete

### Task Dependencies within Phases

**Phase 2 (Foundational)**:
- T007 (test directory) should be first
- T008, T009, T010 (tests) can run in parallel after T007
- T011, T012, T013, T014 (implementations) depend on corresponding tests
- T015 (MssqlService) can run in parallel with model implementations
- T016 (error messages) can run in parallel

**Phase 3 (User Story 1+2)**:
- T017, T018, T019 (tests) can all run in parallel - Test-First!
- T020 (SchemaService) depends on T012, T013, T017
- T021-T024 (FakeDataService) depends on T011, T012, T018
- T025 (InsertScriptGenerator) depends on T020, T021-T024, T019
- T026 (command handler) depends on T015, T020, T025
- T027 (extension.ts) depends on T026
- T028 (clipboard) can run in parallel after T001

**Phase 4 (User Story 3)**:
- T029 (tests) should be first - Test-First!
- T030 can run independently
- T031, T032 depend on T026 existing
- T033 depends on T025 existing
- T034 depends on T026 existing

### Parallel Opportunities

```bash
# Phase 1 - All setup tasks can run in parallel:
T002, T003, T004, T005, T006

# Phase 2 - Test tasks can run in parallel:
T008, T009, T010

# Phase 2 - Model implementations can run in parallel:
T011, T012, T013, T014

# Phase 3 - Test tasks can run in parallel (Test-First):
T017, T018, T019

# Phase 3 - Schema and FakeData services can start in parallel:
T020, T021
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 Only)

1. Complete Phase 1: Setup (package.json, directories)
2. Complete Phase 2: Foundational (models, MssqlService, error messages)
3. Complete Phase 3: User Story 1+2 (core functionality)
4. **STOP and VALIDATE**: Test complete flow manually
5. Deploy/demo if ready - basic functionality works

### Full Feature

1. Complete MVP above
2. Add Phase 4: User Story 3 (error handling polish)
3. Add Phase 5: Polish (documentation, cleanup)

---

## Task Count Summary

| Phase | Tasks | Parallelizable | Test Tasks |
|-------|-------|----------------|------------|
| Phase 1: Setup | 6 | 5 | 0 |
| Phase 2: Foundational | 10 | 8 | 4 |
| Phase 3: US1+US2 | 12 | 5 | 3 |
| Phase 4: US3 | 6 | 0 | 1 |
| Phase 5: Polish | 5 | 2 | 0 |
| **Total** | **39** | **20** | **8** |

---

## Notes

- ✅ Constitution III「Test-First Development」已遵循：每個 Phase 在實作前先寫測試
- 每個 [P] 任務代表可與同 Phase 其他 [P] 任務並行執行
- 測試檔案路徑遵循 plan.md 結構：`src/test/unit/`
- 建議每完成一個 Phase 就進行一次 commit
- 字串假資料字元集：a-zA-Z0-9（符合 spec.md FR-005a 定義）
