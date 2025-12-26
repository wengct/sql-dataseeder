# Implementation Plan: 整合 Faker.js 提供更真實的假資料生成

**Branch**: `003-faker-integration` | **Date**: 2025-12-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-faker-integration/spec.md`

## Summary

整合 `@faker-js/faker` v9.x 至 SQL DataSeeder 擴充套件，實作智慧欄位名稱識別，根據欄位語意產生真實的假資料（Email、姓名、電話等）。支援英文與繁體中文語系切換，並提供功能開關讓使用者可選擇停用智慧假資料功能。

## Technical Context

**Language/Version**: TypeScript 5.x，嚴格模式 (strict: true)  
**Primary Dependencies**: @faker-js/faker v9.x（新增）、VS Code Extension API ^1.106.1、ms-mssql.mssql  
**Storage**: N/A（無資料持久化，所有設定透過 VS Code 設定 API）  
**Testing**: Mocha + @vscode/test-cli（現有測試框架）  
**Target Platform**: VS Code ^1.106.1  
**Project Type**: Single project（VS Code 擴充套件）  
**Performance Goals**: INSERT 語句產生時間不應有明顯延遲（< 100ms for 100 rows）  
**Constraints**: 擴充套件打包後增加約 2-3 MB（Faker.js 完整打包），離線可用  
**Scale/Scope**: 支援 14+ 種欄位名稱模式識別，2 種語系（en, zh_TW）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 狀態 | 說明 |
|------|------|------|
| I. VS Code Extension Architecture | ✅ 通過 | 所有功能透過 VS Code Extension API、使用 VS Code 設定系統 |
| II. Type Safety First | ✅ 通過 | TypeScript 嚴格模式、Faker.js 有完整型別定義 |
| III. Test-First Development | ✅ 通過 | 將為新功能撰寫單元測試，測試涵蓋欄位模式匹配與假資料產生 |
| IV. SQL Server Compatibility | ✅ 通過 | 不影響 SQL 語法相容性，僅改變產生的資料內容 |
| V. User Experience Simplicity | ✅ 通過 | 預設啟用、自動識別、透過 VS Code 標準設定 UI 配置 |
| VI. Brownfield Management | ✅ 通過 | 將重構 `FakeDataService` 以支援可擴展的假資料策略 |

## Project Structure

### Documentation (this feature)

```text
specs/003-faker-integration/
├── plan.md              # 本文件
├── research.md          # Phase 0 輸出
├── data-model.md        # Phase 1 輸出
├── quickstart.md        # Phase 1 輸出
├── contracts/           # Phase 1 輸出
└── tasks.md             # Phase 2 輸出（由 /speckit.tasks 產生）
```

### Source Code (repository root)

```text
src/
├── commands/                  # VS Code 命令處理
├── extension.ts               # 擴充套件進入點
├── generators/
│   ├── existingDataInsertGenerator.ts
│   └── insertScriptGenerator.ts
├── models/
│   ├── columnMetadata.ts      # 將新增 FieldPatternType 介面
│   ├── existingDataTypes.ts
│   ├── generationTypes.ts
│   ├── index.ts
│   ├── sqlDataType.ts
│   └── tableMetadata.ts
├── services/
│   ├── dataQueryBuilder.ts
│   ├── fakeDataService.ts     # 主要修改：整合 Faker.js
│   ├── fieldPatternMatcher.ts # 新增：欄位名稱模式匹配服務
│   ├── fakerConfigService.ts  # 新增：Faker 設定管理服務
│   ├── mssqlService.ts
│   └── schemaService.ts
├── test/
│   ├── extension.test.ts
│   └── unit/
│       ├── fieldPatternMatcher.test.ts  # 新增
│       └── fakeDataService.test.ts      # 新增/擴展
└── utils/
```

**Structure Decision**: 維持現有 Single project 結構，在 `services/` 目錄新增 `fieldPatternMatcher.ts` 和 `fakerConfigService.ts`，修改現有的 `fakeDataService.ts` 以整合 Faker.js。

## Complexity Tracking

> 無違規事項，本功能符合所有 Constitution 原則。
