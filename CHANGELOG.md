# Change Log

All notable changes to the "sql-dataseeder" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.2.0] - 2025-12-26

### Added

- **自定義關鍵字固定值（Custom Keyword Values）**：可用 `sqlDataSeeder.customKeywordValues.rules` 依欄位名稱匹配（literal contains / regex i）直接覆寫輸出值（最高優先於 Faker/預設產生）
- 無效規則/無效 regex 會被忽略並輸出 warnings 到 Output Channel（SQL DataSeeder）

## [0.1.1] - 2025-12-25

### Added

- **Faker.js 智慧假資料**：依欄位名稱語意（Email、FirstName、Phone、Address…）產生更真實的字串資料
- 新增 VS Code 設定
  - `sqlDataSeeder.faker.enabled`（預設：true）
  - `sqlDataSeeder.faker.locale`（en | zh_TW，預設：en）

## [0.1.0] - 2025-12-25

### Added

- **Generate Existing Insert Scripts**: 從資料表現有資料產生可執行的 INSERT 語法
  - 支援指定筆數（預設 100 筆）
  - 支援 WHERE 條件篩選
  - 支援 ORDER BY 排序
  - 支援 IDENTITY 欄位選項（自動加入 SET IDENTITY_INSERT ON/OFF）
  - 處理 NULL 值、Unicode 字串、日期時間等資料類型
- 新增 `binary` 和 `varbinary` 資料類型支援

## [0.0.1] - 初始版本

### Added

- Generate Insert Scripts：產生含有假資料的 INSERT 語法
- 支援 18 種 SQL Server 資料類型
- 右鍵選單整合
- 自動複製到剪貼簿