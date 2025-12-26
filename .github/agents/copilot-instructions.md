# sql-dataseeder Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-25

## Active Technologies
- TypeScript 5.x（嚴格模式） + VS Code Extension API, mssql 擴充套件 (ms-mssql.mssql) (002-existing-data-insert)
- N/A（透過 mssql 擴充套件連線至 SQL Server） (002-existing-data-insert)
- TypeScript 5.x，嚴格模式 (strict: true) + @faker-js/faker v9.x（新增）、VS Code Extension API ^1.106.1、ms-mssql.mssql (003-faker-integration)
- N/A（無資料持久化，所有設定透過 VS Code 設定 API） (003-faker-integration)
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (004-custom-keyword-values)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (004-custom-keyword-values)
- TypeScript 5.9.x（tsconfig: `strict: true`） + VS Code Extension API、`ms-mssql.mssql`（extensionDependencies）、`@faker-js/faker`（既有智慧產生） (004-custom-keyword-values)
- N/A（不自建儲存；透過 mssql 擴充套件連線讀取 schema/資料） (004-custom-keyword-values)

- TypeScript 5.9.3，嚴格模式 (strict: true) + VS Code Extension API ^1.106.1, vscode-mssql (連線共享 API) (001-generate-insert-scripts)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.9.3，嚴格模式 (strict: true): Follow standard conventions

## Recent Changes
- 004-custom-keyword-values: Added TypeScript 5.9.x（tsconfig: `strict: true`） + VS Code Extension API、`ms-mssql.mssql`（extensionDependencies）、`@faker-js/faker`（既有智慧產生）
- 004-custom-keyword-values: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
- 003-faker-integration: Added TypeScript 5.x，嚴格模式 (strict: true) + @faker-js/faker v9.x（新增）、VS Code Extension API ^1.106.1、ms-mssql.mssql


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
