# Change Log

All notable changes to the "sql-dataseeder" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

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