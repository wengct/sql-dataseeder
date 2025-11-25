<!--
## Sync Impact Report
- Version change: N/A → 1.0.0 (initial ratification)
- Modified principles: N/A (initial version)
- Added sections:
  - Core Principles (5 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
- Removed sections: None
- Templates requiring updates:
  - `.specify/templates/plan-template.md` ✅ (Constitution Check section compatible)
  - `.specify/templates/spec-template.md` ✅ (functional requirements aligned)
  - `.specify/templates/tasks-template.md` ✅ (task categorization compatible)
- Follow-up TODOs: None
-->

# SQL DataSeeder Constitution

## Core Principles

### I. VS Code Extension Architecture
所有功能 MUST 透過 VS Code Extension API 提供。擴充套件 MUST 與 mssql 擴充套件 (ms-mssql.mssql) 整合以取得資料庫連線。UI 互動 MUST 使用 VS Code 原生元件（右鍵選單、通知、剪貼簿）。不得引入獨立的 GUI 框架或視窗。

**Rationale**: 確保與 VS Code 生態系統的一致性，減少使用者學習成本，並利用現有的資料庫連線設定。

### II. Type Safety First
所有程式碼 MUST 使用 TypeScript 編寫，且 MUST 啟用嚴格模式 (strict: true)。SQL 查詢結果 MUST 定義明確的型別介面。禁止使用 `any` 型別，除非有充分的技術理由並在程式碼中加以註解說明。

**Rationale**: TypeScript 的型別系統可在編譯期捕獲錯誤，減少執行期異常，提高程式碼可維護性。

### III. Test-First Development
新功能 MUST 先撰寫測試，測試 MUST 先失敗再實作功能。測試框架使用 Mocha + VS Code Test API。測試覆蓋率 SHOULD 達到 80% 以上。每個公開 API MUST 有對應的單元測試。

**Rationale**: 測試先行確保功能符合規格，並建立回歸測試網，使重構更安全。

### IV. SQL Server Compatibility
目前僅支援 Microsoft SQL Server。所有 SQL 語法 MUST 相容於 SQL Server 2016+。資料表結構查詢 MUST 使用標準的系統檢視 (INFORMATION_SCHEMA 或 sys.*)。假資料生成 MUST 依據欄位的資料類型、長度、可空性產生合理的值。

**Rationale**: 明確的資料庫支援範圍可避免功能蔓延，確保核心功能的穩定性。

### V. User Experience Simplicity
功能入口 MUST 直觀（右鍵選單）。預設值 MUST 合理（預設 10 筆）。結果 MUST 自動複製到剪貼簿並顯示通知。錯誤訊息 MUST 清楚說明問題並提供解決建議。

**Rationale**: 工具的價值在於節省時間，複雜的操作流程會抵消生產力增益。

## Technology Constraints

- **語言**: TypeScript 5.x，嚴格模式
- **目標平台**: VS Code ^1.106.1
- **建置工具**: Webpack
- **測試框架**: Mocha + @vscode/test-cli
- **程式碼品質**: ESLint (typescript-eslint)
- **相依性**: MUST 最小化外部相依，僅使用必要的套件
- **相容性**: MUST 相容於 mssql 擴充套件的連線 API

## Development Workflow

- **分支策略**: 每個功能建立獨立分支，命名格式 `feature/###-feature-name`
- **品質閘門**: 
  - 所有測試 MUST 通過
  - ESLint 檢查 MUST 無錯誤
  - 編譯 MUST 成功無警告
- **提交規範**: 使用 Conventional Commits 格式
- **PR 審查**: 所有變更 MUST 經過 Constitution 合規性檢查
- **版本管理**: 遵循語義化版本 (MAJOR.MINOR.PATCH)

## Governance

- Constitution 優先於所有其他開發慣例
- 修改 Constitution MUST 記錄變更理由
- 版本升級規則：
  - MAJOR: 移除或重新定義原則
  - MINOR: 新增原則或大幅擴展指導內容
  - PATCH: 澄清、措辭修正、非語義變更
- 複雜度增加 MUST 在 plan.md 的 Complexity Tracking 區段說明理由

**Version**: 1.0.0 | **Ratified**: 2025-11-25 | **Last Amended**: 2025-11-25
