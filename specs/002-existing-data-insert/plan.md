# Implementation Plan: 從現有資料庫資料產生 INSERT 腳本

**Branch**: `002-existing-data-insert` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-existing-data-insert/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

新增「Generate Existing Insert Scripts」功能，讓使用者能從資料庫現有資料產生 INSERT 腳本。功能將重用現有的 mssql 擴充套件整合架構，並擴展 `MssqlService` 以支援資料查詢功能，同時建立新的 `ExistingDataInsertGenerator` 來處理實際資料轉 SQL 的邏輯。

## Technical Context

**Language/Version**: TypeScript 5.x（嚴格模式）  
**Primary Dependencies**: VS Code Extension API, mssql 擴充套件 (ms-mssql.mssql)  
**Storage**: N/A（透過 mssql 擴充套件連線至 SQL Server）  
**Testing**: Mocha + @vscode/test-cli  
**Target Platform**: VS Code ^1.106.1  
**Project Type**: single（VS Code 擴充套件）  
**Performance Goals**: 處理 1000 筆資料時產生時間 < 5 秒  
**Constraints**: SQL Server 2016+ 相容性、INSERT 語法需 100% 可執行  
**Scale/Scope**: 預設 100 筆、最大無硬性限制（由使用者決定）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Phase 0 前評估

| 原則 | 合規狀態 | 說明 |
|------|----------|------|
| I. VS Code Extension Architecture | ✅ PASS | 透過 VS Code Extension API 與 mssql 擴充套件整合，使用原生 UI 元件 |
| II. Type Safety First | ✅ PASS | 使用 TypeScript 嚴格模式，所有資料結構皆定義明確型別 |
| III. Test-First Development | ⚠️ TBD | 新功能需先撰寫測試；對現有程式碼修改需補齊測試 |
| IV. SQL Server Compatibility | ✅ PASS | 僅支援 MSSQL，使用 sys.* 系統檢視，相容 SQL Server 2016+ |
| V. User Experience Simplicity | ✅ PASS | 右鍵選單入口、預設 100 筆、自動複製到剪貼簿 |
| VI. Brownfield Management | ⚠️ TBD | 重用現有服務時，需評估是否需要重構以符合新需求 |

**閘門評估**: ✅ 通過 - 無違規項目，可進入 Phase 0

### Phase 1 後重新評估

| 原則 | 合規狀態 | 說明 |
|------|----------|------|
| I. VS Code Extension Architecture | ✅ PASS | 使用 showInputBox + showQuickPick 進行使用者互動，符合原生 UI 要求 |
| II. Type Safety First | ✅ PASS | contracts/ 定義完整型別介面，包含 IExistingDataOptions、IQueryCell 等 |
| III. Test-First Development | ✅ PASS | quickstart.md 已規劃測試策略，每個新模組皆有對應測試檔 |
| IV. SQL Server Compatibility | ✅ PASS | 使用 SELECT TOP N 語法、SET IDENTITY_INSERT，皆為 SQL Server 2016+ 標準語法 |
| V. User Experience Simplicity | ✅ PASS | 逐步引導輸入、合理預設值（100 筆）、清楚的成功/錯誤訊息 |
| VI. Brownfield Management | ✅ PASS | 重用現有 MssqlService、SchemaService；擴展 SqlDataType 新增 BINARY/VARBINARY |

**閘門評估**: ✅ 通過 - 設計符合所有 Constitution 原則

## Project Structure

### Documentation (this feature)

```text
specs/002-existing-data-insert/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── extension.ts              # 註冊新指令
├── commands/
│   ├── generateInsertScripts.ts        # 現有假資料指令
│   └── generateExistingInsertScripts.ts # [NEW] 現有資料指令
├── generators/
│   ├── insertScriptGenerator.ts        # 現有假資料產生器
│   └── existingDataInsertGenerator.ts  # [NEW] 現有資料產生器
├── models/
│   ├── columnMetadata.ts
│   ├── generationTypes.ts              # [EXTEND] 新增 ExistingDataOptions
│   ├── index.ts
│   ├── sqlDataType.ts
│   └── tableMetadata.ts
├── services/
│   ├── fakeDataService.ts
│   ├── mssqlService.ts                 # [EXTEND] 新增資料查詢方法
│   └── schemaService.ts
└── utils/
    ├── clipboard.ts
    ├── errorMessages.ts                # [EXTEND] 新增錯誤訊息
    └── sqlEscape.ts                    # [EXTEND] 新增實際資料跳脫

tests/
└── unit/
    ├── commands/
    │   └── generateExistingInsertScripts.test.ts  # [NEW]
    ├── generators/
    │   └── existingDataInsertGenerator.test.ts    # [NEW]
    └── utils/
        └── sqlEscape.test.ts                      # [EXTEND]
```

**Structure Decision**: 延續現有的單一專案結構，新增命令與產生器平行於現有模組，最大化程式碼重用。

## Complexity Tracking

> 無違規項目需要說明。
