# Quickstart: 從現有資料庫資料產生 INSERT 腳本

**Feature Branch**: `002-existing-data-insert`  
**Date**: 2025-12-24

## 開發環境設定

### 先決條件

- Node.js 22.x
- VS Code ^1.106.1
- 已安裝 mssql 擴充套件 (ms-mssql.mssql)
- 可連線的 SQL Server 資料庫（含測試資料）

### 快速開始

```bash
# 1. 切換到功能分支
git checkout 002-existing-data-insert

# 2. 安裝相依性
npm install

# 3. 啟動開發模式
npm run watch

# 4. 按 F5 啟動擴充套件開發主機
```

## 實作順序建議

### Phase 1: 核心型別定義

1. **擴展 SqlDataType 列舉**
   - 新增 `BINARY = 'binary'`、`VARBINARY = 'varbinary'`
   - 檔案：`src/models/sqlDataType.ts`

2. **新增 ExistingDataOptions 型別**
   - 定義 `rowCount`、`whereClause`、`orderByClause`、`includeIdentity`
   - 檔案：`src/models/existingDataTypes.ts`（新建）

3. **擴展 TableMetadata**
   - 新增 `hasIdentityColumn` 計算屬性
   - 檔案：`src/models/tableMetadata.ts`

### Phase 2: 值格式化器

4. **擴展 sqlEscape 工具**
   - 新增 `formatValueForSql(cell, column)` 函式
   - 處理各種資料型別的 SQL 字面量轉換
   - 檔案：`src/utils/sqlEscape.ts`
   - 測試：`src/test/unit/utils/sqlEscape.test.ts`

### Phase 3: 產生器

5. **建立 ExistingDataInsertGenerator**
   - 實作 `generate(tableMetadata, rows, options)` 方法
   - 處理 SET IDENTITY_INSERT ON/OFF
   - 檔案：`src/generators/existingDataInsertGenerator.ts`（新建）
   - 測試：`src/test/unit/generators/existingDataInsertGenerator.test.ts`（新建）

### Phase 4: 服務層

6. **擴展 MssqlService**
   - 新增 `queryTableData(node, query)` 方法
   - 檔案：`src/services/mssqlService.ts`

7. **新增 DataQueryBuilder**
   - 實作 `buildSelectQuery(options)` 方法
   - 檔案：`src/services/dataQueryBuilder.ts`（新建）

### Phase 5: 指令與 UI

8. **新增 generateExistingInsertScripts 指令**
   - 實作使用者互動流程（InputBox + QuickPick）
   - 整合各服務產生最終腳本
   - 檔案：`src/commands/generateExistingInsertScripts.ts`（新建）
   - 測試：`src/test/unit/commands/generateExistingInsertScripts.test.ts`（新建）

9. **註冊指令與選單**
   - 在 `extension.ts` 註冊新指令
   - 在 `package.json` 新增選單項目
   - 檔案：`src/extension.ts`、`package.json`

### Phase 6: 錯誤處理

10. **擴展錯誤訊息**
    - 新增 `TABLE_EMPTY`、`QUERY_NO_RESULTS` 等錯誤碼
    - 檔案：`src/utils/errorMessages.ts`

## 測試驗證

### 單元測試

```bash
# 執行所有測試
npm test

# 執行特定測試檔
npm test -- --grep "ExistingDataInsertGenerator"
```

### 手動測試腳本

1. 連線到有資料的 SQL Server 資料庫
2. 在 Object Explorer 右鍵點擊資料表
3. 選擇「Generate Existing Insert Scripts」
4. 輸入筆數：10
5. WHERE 條件留空
6. ORDER BY 留空
7. 驗證剪貼簿中的 INSERT 語法

### 驗收測試案例

| 測試案例 | 預期結果 |
|----------|----------|
| 產生 10 筆基本 INSERT | 成功複製 10 筆語法 |
| 資料表無資料 | 顯示提示訊息 |
| 包含 IDENTITY 欄位 | 加入 SET IDENTITY_INSERT |
| 含 NULL 值的資料 | 正確輸出 NULL 關鍵字 |
| 含單引號的字串 | 正確跳脫為 '' |
| Unicode 字串 | 加入 N 前綴 |

## 關鍵檔案

| 檔案 | 說明 |
|------|------|
| [spec.md](./spec.md) | 功能規格 |
| [research.md](./research.md) | 技術研究 |
| [data-model.md](./data-model.md) | 資料模型 |
| [contracts/types.ts](./contracts/types.ts) | 型別契約 |
| [contracts/services.ts](./contracts/services.ts) | 服務介面 |

## 常見問題

### Q: 如何測試 mssql 擴充套件整合？

A: 需要在 VS Code 擴充套件開發主機中測試，無法在純單元測試中執行。可使用 mock 進行單元測試。

### Q: 如何處理大量資料？

A: MVP 版本建議限制在 1000 筆內。超過時可顯示警告，但不強制限制。

### Q: SET IDENTITY_INSERT 需要什麼權限？

A: 需要 ALTER TABLE 權限。若使用者執行失敗，應在錯誤訊息中說明可能的權限問題。
