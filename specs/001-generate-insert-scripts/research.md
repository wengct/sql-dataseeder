# Research: Generate Insert Scripts

**Date**: 2025-11-25  
**Feature**: [spec.md](./spec.md)

## 研究任務

### 1. mssql 擴充套件整合方式

**問題**: 如何與 mssql 擴充套件整合，取得資料庫連線並執行查詢？

**決策**: 使用 mssql 擴充套件公開的 `IConnectionSharingService` API

**理由**:
- mssql 擴充套件 (ms-mssql.mssql) 提供公開的 `IExtension` API
- `IConnectionSharingService` 是較新且穩定的 API，專為擴充套件間共享連線設計
- 提供 `executeSimpleQuery` 方法可直接執行 SQL 查詢並取得結果
- 支援連線權限授權流程，首次使用時會提示使用者

**考慮的替代方案**:
- ❌ 直接使用 `promptForConnection`：需要使用者每次手動選擇連線，體驗差
- ❌ 自行實作資料庫連線：增加複雜度，且無法重用使用者已設定的連線

**實作方式**:
```typescript
// 取得 mssql 擴充套件 API
const mssqlExt = vscode.extensions.getExtension('ms-mssql.mssql');
await mssqlExt.activate();
const mssqlApi = mssqlExt.exports as mssql.IExtension;

// 使用連線共享服務
const connectionSharingService = mssqlApi.connectionSharing;
const connectionUri = await connectionSharingService.connect(extensionId, connectionId);
const result = await connectionSharingService.executeSimpleQuery(connectionUri, query);
```

---

### 2. Object Explorer 右鍵選單註冊

**問題**: 如何在 mssql 的 Object Explorer 資料表節點上註冊右鍵選單？

**決策**: 使用 VS Code 的 `contributes.menus` 搭配 `view/item/context`

**理由**:
- mssql 的 Object Explorer tree view ID 是 `objectExplorer`
- 節點的 `contextValue` 使用 `key=value` 格式，可用正規表達式匹配
- Table 節點的 contextValue 包含 `type=Table`

**實作方式**:
```json
{
  "contributes": {
    "menus": {
      "view/item/context": [
        {
          "command": "sql-dataseeder.generateInsertScripts",
          "when": "view == objectExplorer && viewItem =~ /type=Table/",
          "group": "sql-dataseeder@1"
        }
      ]
    }
  }
}
```

**從 TreeNodeInfo 取得資料表資訊**:
```typescript
// node: mssql.ITreeNodeInfo
const tableName = node.metadata.name;
const schema = node.metadata.schema || 'dbo';
const connectionProfile = node.connectionProfile;
```

---

### 3. SQL Server 資料表結構查詢

**問題**: 如何查詢 SQL Server 資料表的欄位結構？

**決策**: 使用 `sys.columns` 搭配 `sys.types` 系統檢視

**理由**:
- `INFORMATION_SCHEMA.COLUMNS` 無法取得 IDENTITY 和 COMPUTED 欄位資訊
- `sys.columns` 提供 `is_identity`、`is_computed` 等完整屬性
- 相容於 SQL Server 2016+

**查詢語法**:
```sql
SELECT 
    c.name AS column_name,
    t.name AS data_type,
    c.max_length,
    c.precision,
    c.scale,
    c.is_nullable,
    c.is_identity,
    c.is_computed
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('[schema].[table]')
ORDER BY c.column_id;
```

**注意事項**:
- `max_length` 對於 nvarchar/nchar 是字節數（需除以 2 得到字元數）
- `varchar(max)` 的 `max_length` 為 -1

---

### 4. 假資料產生策略

**問題**: 如何為各種 SQL Server 資料類型產生合理的假資料？

**決策**: 內建假資料產生器，根據資料類型和長度產生隨機值

**理由**:
- 不依賴外部函式庫（如 faker.js），減少相依性
- 使用者選擇 Option A（隨機字元組合）作為字串內容風格
- 簡單且可預測的產生邏輯

**資料類型對應**:

| 資料類型 | 產生策略 |
|----------|----------|
| varchar, nvarchar, char, nchar | 隨機英數字元組合，長度為 min(max_length, 10) |
| int, bigint, smallint, tinyint | 隨機整數，範圍根據類型調整 |
| decimal, numeric | 隨機小數，根據 precision 和 scale |
| float, real | 隨機浮點數 |
| datetime, datetime2 | 過去 365 天內的隨機日期時間 |
| date | 過去 365 天內的隨機日期 |
| time | 隨機時間 |
| bit | 隨機 0 或 1 |
| uniqueidentifier | 隨機 UUID |

**不支援的類型**（跳過並通知）:
- geography, geometry
- xml
- varbinary, binary, image
- text, ntext
- sql_variant
- hierarchyid
- timestamp/rowversion

---

### 5. Insert 語法格式

**問題**: 產生的 Insert 語法應該是什麼格式？

**決策**: 標準 SQL Server INSERT 語法，每筆一行

**格式範例**:
```sql
INSERT INTO [dbo].[TableName] ([Column1], [Column2], [Column3]) VALUES ('value1', 123, '2025-01-15T10:30:00');
INSERT INTO [dbo].[TableName] ([Column1], [Column2], [Column3]) VALUES ('value2', 456, '2025-02-20T14:45:00');
```

**考量**:
- 使用方括號包住 schema、table、column 名稱，避免保留字問題
- 字串值使用單引號，數值不加引號
- 日期時間使用 ISO 8601 格式
- NULL 值直接輸出 `NULL`（但目前設定為不產生 NULL）

---

### 6. 錯誤處理策略

**問題**: 如何處理各種錯誤情境？

**決策**: 分層錯誤處理，清楚的錯誤訊息搭配解決建議

**錯誤分類**:

| 錯誤類型 | 訊息範例 | 解決建議 |
|----------|----------|----------|
| mssql 擴充套件未安裝 | "MSSQL extension is not installed." | "Please install the SQL Server (mssql) extension." |
| 未連線到資料庫 | "No active database connection." | "Please connect to a database using the MSSQL extension first." |
| 連線已中斷 | "Database connection lost." | "Please reconnect to the database." |
| 權限不足 | "Access denied to table [table]." | "Please ensure you have SELECT permission on this table." |
| 無可插入欄位 | "No insertable columns found." | "All columns are IDENTITY or COMPUTED." |
| 輸入無效筆數 | "Invalid row count." | "Please enter a positive integer." |

---

## 技術風險

| 風險 | 影響 | 緩解措施 |
|------|------|----------|
| mssql API 變動 | 整合功能失效 | 使用 try-catch 包裝，優雅降級並顯示錯誤訊息 |
| 大量資料效能 | 產生 1000+ 筆時可能卡頓 | 加入進度指示，考慮分批處理 |
| 特殊字元處理 | 產生的 SQL 語法錯誤 | 對字串值進行適當的跳脫處理 |

---

## 參考資源

- [vscode-mssql GitHub](https://github.com/microsoft/vscode-mssql)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [SQL Server sys.columns](https://docs.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-columns-transact-sql)
