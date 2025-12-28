# Implementation Plan: 支援中文欄位名稱與同義詞匹配

**Branch**: `001-chinese-column-matching` | **Date**: 2025-12-27 | **Spec**: `specs/001-chinese-column-matching/spec.md`
**Input**: Feature specification from `specs/001-chinese-column-matching/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

支援中文/混合字元欄位名稱與同義詞匹配，採用 Unicode NFKC 正規化與英文大小寫不敏感比對，新增使用者設定的同義詞群組並將同義詞命中優先於既有語意/模式匹配。
測試任務在 tasks.md 中已前置，符合 Test-First Development 原則。

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: VS Code Extension API, ms-mssql.mssql, @faker-js/faker
**Storage**: N/A (設定由 VS Code configuration 提供)
**Testing**: Mocha + @vscode/test-cli
**Target Platform**: VS Code ^1.106.1
**Project Type**: single (VS Code extension)
**Performance Goals**: 無明確目標，優先正確性
**Constraints**: 不新增 UI/指令；同義詞設定錯誤需完全跳過同義詞匹配
**Scale/Scope**: 既有擴充套件功能範圍內的欄位名稱匹配流程

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. VS Code Extension Architecture: PASS (僅調整既有匹配邏輯與設定)
- II. Type Safety First: PASS (TypeScript 嚴格模式下新增型別定義)
- III. Test-First Development: PASS (新增/補齊單元測試涵蓋中文與同義詞)
- IV. SQL Server Compatibility: PASS (不影響資料來源與 SQL 相容性)
- V. User Experience Simplicity: PASS (僅新增設定項，無 UI 變更)
- VI. Brownfield Management: PASS (在既有邏輯新增單元測試並小幅清理)

## Project Structure

### Documentation (this feature)

```text
specs/001-chinese-column-matching/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── commands/
├── generators/
├── models/
├── services/
├── utils/
└── test/
    ├── unit/
    └── fixtures/
```

**Structure Decision**: 單一 VS Code 擴充套件專案，功能與測試皆位於 `src/` 與 `src/test/`。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

(無)

## Post-Phase 1 Constitution Check

- I. VS Code Extension Architecture: PASS
- II. Type Safety First: PASS
- III. Test-First Development: PASS (規劃新增單元測試)
- IV. SQL Server Compatibility: PASS
- V. User Experience Simplicity: PASS
- VI. Brownfield Management: PASS
