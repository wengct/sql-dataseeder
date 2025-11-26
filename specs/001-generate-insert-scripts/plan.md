# Implementation Plan: Generate Insert Scripts

**Branch**: `001-generate-insert-scripts` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-generate-insert-scripts/spec.md`

## Summary

實作一個 VS Code 擴充套件功能，讓使用者可在 mssql 擴充套件的 Object Explorer 資料表節點上點選右鍵，選擇「Generate Insert Scripts」功能，自動查詢資料表結構並產生指定筆數的 Insert 語法，結果自動複製到剪貼簿。

## Technical Context

**Language/Version**: TypeScript 5.9.3，嚴格模式 (strict: true)  
**Primary Dependencies**: VS Code Extension API ^1.106.1, vscode-mssql (連線共享 API)  
**Storage**: N/A（不需要持久化儲存）  
**Testing**: Mocha + @vscode/test-cli + @vscode/test-electron  
**Target Platform**: VS Code ^1.106.1，Windows/macOS/Linux
**Project Type**: VS Code Extension (single project)  
**Performance Goals**: 產生 100 筆 Insert 語法應在 2 秒內完成  
**Constraints**: 最小化外部相依、僅使用 VS Code 原生 UI 元件  
**Scale/Scope**: 單一功能擴充套件，支援 18 種 SQL Server 資料類型

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. VS Code Extension Architecture | ✅ PASS | 使用 VS Code Extension API + mssql 連線共享 API，UI 使用原生元件（右鍵選單、InputBox、通知、剪貼簿） |
| II. Type Safety First | ✅ PASS | TypeScript 嚴格模式已啟用，contracts/ 定義了所有型別介面（IColumnMetadata, ITableMetadata, SqlDataType 等） |
| III. Test-First Development | ✅ PASS | 將使用 Mocha + VS Code Test API，服務介面設計支援依賴注入便於測試 |
| IV. SQL Server Compatibility | ✅ PASS | 僅支援 SQL Server 2016+，使用 sys.columns + sys.types 查詢結構 |
| V. User Experience Simplicity | ✅ PASS | 右鍵選單入口、預設 10 筆、自動複製到剪貼簿、清楚的錯誤訊息 |

**Post-Design Re-check (Phase 1 完成後)**: ✅ 所有原則仍然符合

## Project Structure

### Documentation (this feature)

```text
specs/001-generate-insert-scripts/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── extension.ts              # 擴充套件入口點
├── commands/
│   └── generateInsertScripts.ts  # 主要指令實作
├── services/
│   ├── mssqlService.ts           # mssql 擴充套件整合
│   ├── schemaService.ts          # 資料表結構查詢
│   └── fakeDataService.ts        # 假資料產生
├── models/
│   ├── tableMetadata.ts          # 資料表結構型別
│   └── columnMetadata.ts         # 欄位結構型別
├── generators/
│   └── insertScriptGenerator.ts  # Insert 語法產生器
└── utils/
    └── clipboard.ts              # 剪貼簿操作

src/test/
├── unit/
│   ├── fakeDataService.test.ts
│   ├── insertScriptGenerator.test.ts
│   └── schemaService.test.ts
└── integration/
    └── extension.test.ts
```

**Structure Decision**: 採用 VS Code Extension 標準結構，將功能拆分為 commands、services、models、generators 等模組，確保單一職責和可測試性。

## Complexity Tracking

> 無 Constitution 違規，不需要記錄。
