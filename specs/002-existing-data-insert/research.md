# Research: 從現有資料庫資料產生 INSERT 腳本

**Date**: 2025-12-24  
**Feature**: [spec.md](./spec.md)

## 研究任務

### 1. 資料查詢策略

**問題**: 如何從資料庫查詢現有資料並支援使用者自訂的筆數限制、WHERE 條件和排序？

**決策**: 使用動態 SQL 組合 `SELECT TOP N` + 使用者輸入的 WHERE/ORDER BY

**理由**:
- `SELECT TOP N` 是 SQL Server 原生語法，效能最佳
- 使用者（資料庫開發者）熟悉 SQL 語法，直接輸入 WHERE 條件最具彈性
- 無需複雜的 UI 元件，符合 Constitution 的簡潔原則

**查詢模板**:
```sql
SELECT TOP {rowCount} *
FROM [{schemaName}].[{tableName}]
{WHERE clause if provided}
{ORDER BY clause if provided}
```

**SQL 注入防護考量**:
- 使用者本身已有資料庫存取權限，注入攻擊風險低
- Schema 和 Table 名稱使用方括號包住，避免保留字問題
- WHERE 和 ORDER BY 由使用者直接輸入，信任使用者模式
- 僅對識別碼（schema、table、column）進行驗證，確保不含特殊字元

**考慮的替代方案**:
- ❌ OFFSET-FETCH：語法複雜且需要 ORDER BY，不適合快速取樣
- ❌ SET ROWCOUNT：已被 Microsoft 標記為棄用
- ❌ 結構化 WHERE UI：開發成本高，彈性反而降低

---

### 2. 資料型別轉換為 SQL 字面量

**問題**: 如何將 mssql 擴充套件回傳的查詢結果轉換為有效的 SQL INSERT 值？

**決策**: 根據欄位的 `dataType` 判斷格式化方式，優先使用 `invariantCultureDisplayValue`

**理由**:
- mssql 的 `IQueryResultCell` 提供 `displayValue` 和 `invariantCultureDisplayValue`
- `invariantCultureDisplayValue` 對數值和日期提供與文化無關的格式，更可靠
- `isNull` 屬性可直接判斷是否為 NULL 值

**資料型別對應表**:

| SQL Server 型別 | 格式化方式 | 範例 |
|-----------------|------------|------|
| varchar, char | 單引號包圍 + 跳脫 | `'O''Brien'` |
| nvarchar, nchar | N 前綴 + 單引號 + 跳脫 | `N'中文'` |
| int, bigint, smallint, tinyint | 直接輸出 | `123` |
| decimal, numeric, float, real | 直接輸出 | `123.45` |
| datetime, datetime2 | 單引號 ISO 格式 | `'2025-12-24T10:30:00'` |
| date | 單引號日期格式 | `'2025-12-24'` |
| time | 單引號時間格式 | `'10:30:00'` |
| bit | 0 或 1 | `1` |
| uniqueidentifier | 單引號包圍 | `'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'` |
| binary, varbinary | 0x 十六進位 | `0x48656C6C6F` |
| NULL | NULL 關鍵字 | `NULL` |

**實作方式**:
```typescript
function formatValueForSql(cell: IQueryResultCell, column: ColumnMetadata): string {
  // NULL 值處理
  if (cell.isNull) {
    return 'NULL';
  }

  const value = cell.invariantCultureDisplayValue || cell.displayValue;

  switch (column.dataType) {
    // Unicode 字串：加 N 前綴
    case SqlDataType.NVARCHAR:
    case SqlDataType.NCHAR:
      return `N'${escapeSqlString(value)}'`;

    // 一般字串
    case SqlDataType.VARCHAR:
    case SqlDataType.CHAR:
      return `'${escapeSqlString(value)}'`;

    // 數值：直接輸出
    case SqlDataType.INT:
    case SqlDataType.BIGINT:
    case SqlDataType.SMALLINT:
    case SqlDataType.TINYINT:
    case SqlDataType.DECIMAL:
    case SqlDataType.NUMERIC:
    case SqlDataType.FLOAT:
    case SqlDataType.REAL:
      return value;

    // 日期時間：單引號包圍
    case SqlDataType.DATETIME:
    case SqlDataType.DATETIME2:
    case SqlDataType.DATE:
    case SqlDataType.TIME:
      return `'${value}'`;

    // 布林：轉為 0/1
    case SqlDataType.BIT:
      return value.toLowerCase() === 'true' || value === '1' ? '1' : '0';

    // GUID：單引號包圍
    case SqlDataType.UNIQUEIDENTIFIER:
      return `'${value}'`;

    // 二進位：0x 前綴（假設 displayValue 已是十六進位）
    case SqlDataType.BINARY:
    case SqlDataType.VARBINARY:
      return value.startsWith('0x') ? value : `0x${value}`;

    default:
      return `'${escapeSqlString(value)}'`;
  }
}
```

**考慮的替代方案**:
- ❌ 僅使用 displayValue：可能受本地化影響（如日期格式）
- ❌ 參數化查詢：無法產生純 SQL 腳本供複製貼上

---

### 3. IDENTITY 欄位處理

**問題**: 使用者可能需要包含 IDENTITY 欄位值以進行資料遷移，如何處理？

**決策**: 提供 `includeIdentity` 選項，預設為 `false`，選擇 `true` 時自動加入 SET IDENTITY_INSERT

**理由**:
- 資料遷移場景需要保留原始 IDENTITY 值
- SET IDENTITY_INSERT 是 SQL Server 標準做法
- 預設不包含可避免主鍵衝突問題

**產生格式**:
```sql
SET IDENTITY_INSERT [dbo].[TableName] ON;
INSERT INTO [dbo].[TableName] ([Id], [Name]) VALUES (1, 'Value1');
INSERT INTO [dbo].[TableName] ([Id], [Name]) VALUES (2, 'Value2');
SET IDENTITY_INSERT [dbo].[TableName] OFF;
```

**權限需求**:
- 使用 SET IDENTITY_INSERT 需要 ALTER TABLE 權限
- 文件說明：若執行失敗可能是權限不足

**考慮的替代方案**:
- ❌ 總是包含 IDENTITY：可能導致插入失敗
- ❌ 預先檢查權限：增加查詢複雜度，延遲回應

---

### 4. 計算欄位 (Computed Columns) 處理

**問題**: 計算欄位無法被 INSERT，如何處理？

**決策**: 自動排除計算欄位，與現有假資料功能一致

**理由**:
- 計算欄位的值由資料庫自動計算，不能手動插入
- 現有 `ColumnMetadata.isComputed` 屬性已可識別
- 重用現有 `getInsertableColumns` 函式

---

### 5. 使用者互動流程

**問題**: 使用者如何輸入筆數、WHERE 條件、ORDER BY？

**決策**: 使用 VS Code 的 `showInputBox` 逐步引導

**流程設計**:
1. 使用者右鍵點擊資料表 → 選擇「Generate Existing Insert Scripts」
2. 彈出 InputBox：「輸入要產生的筆數（預設 100）：」
3. 彈出 InputBox：「輸入 WHERE 條件（選填，不含 WHERE 關鍵字）：」
4. 彈出 InputBox：「輸入 ORDER BY 欄位（選填，不含 ORDER BY 關鍵字）：」
5. 若資料表有 IDENTITY 欄位，彈出 QuickPick：「是否包含 IDENTITY 欄位？」
6. 執行查詢並產生 INSERT 腳本

**理由**:
- 符合 VS Code 擴充套件的標準互動模式
- 無需額外 UI 框架
- 每個步驟獨立，使用者可隨時按 ESC 取消

**考慮的替代方案**:
- ❌ 單一對話框輸入所有參數：VS Code API 不支援複雜表單
- ❌ Webview 表單：增加複雜度，違反簡潔原則
- ❌ 設定檔記憶上次選項：MVP 不實作，未來可考慮

---

### 6. 效能考量

**問題**: 大量資料時如何確保效能？

**決策**: 預設 100 筆，建議上限 1000 筆，MVP 不做分批處理

**理由**:
- 1000 筆資料在記憶體中約 100KB-500KB，對現代電腦無壓力
- 產生的 SQL 字串使用剪貼簿 API，無硬性大小限制
- 分批處理會增加實作複雜度，效益不明顯

**效能評估**:
- 查詢 1000 筆：< 1 秒（取決於網路延遲）
- 格式化 1000 筆 INSERT：< 100ms
- 複製到剪貼簿：< 10ms

**未來優化方向**（不在 MVP 範圍）:
- 超過 1000 筆時顯示警告
- 提供「輸出到檔案」選項
- 進度指示器

---

### 7. 二進位資料處理

**問題**: BINARY/VARBINARY 資料如何轉換為 SQL 字面量？

**決策**: 轉換為 0x 十六進位格式

**理由**:
- SQL Server 標準語法：`0x48656C6C6F`
- mssql 擴充套件的 displayValue 可能已是十六進位字串

**待驗證**:
- mssql 擴充套件對 BINARY 欄位的 displayValue 格式
- 若格式不符，需要額外轉換邏輯

**考慮的替代方案**:
- ❌ 跳過二進位欄位：限制功能，使用者可能需要
- ❌ Base64 編碼：SQL Server 不直接支援

---

### 8. 空資料表處理

**問題**: 當資料表沒有資料或查詢無結果時如何處理？

**決策**: 顯示資訊訊息，不產生任何腳本

**理由**:
- 空資料表產生空腳本沒有意義
- 清楚告知使用者為何沒有輸出

**訊息設計**:
- 資料表無資料：「資料表 [schema].[table] 沒有資料。」
- 查詢無結果：「查詢無符合條件的資料。請檢查 WHERE 條件是否正確。」

---

## 技術風險

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| mssql API displayValue 格式變動 | 產生的 SQL 語法錯誤 | 低 | 優先使用 invariantCultureDisplayValue |
| 二進位資料格式未知 | 需要額外解析邏輯 | 中 | 實作時驗證並調整 |
| 使用者輸入無效 WHERE | 查詢錯誤 | 中 | 捕獲錯誤並顯示清楚訊息 |
| 大量資料造成記憶體問題 | 擴充套件無回應 | 低 | 預設限制 100 筆，文件建議上限 |

---

## 參考資源

- [mssql-tools IQueryResult 定義](https://github.com/microsoft/vscode-mssql)
- [SQL Server SET IDENTITY_INSERT](https://docs.microsoft.com/en-us/sql/t-sql/statements/set-identity-insert-transact-sql)
- [SQL Server Binary Literals](https://docs.microsoft.com/en-us/sql/t-sql/data-types/binary-and-varbinary-transact-sql)

---

## 設計決策總結

| 決策點 | 選擇 | 原因 |
|--------|------|------|
| 查詢限制方式 | SELECT TOP N | SQL Server 原生語法 |
| WHERE/ORDER BY 輸入 | 文字輸入框 | 最大彈性 |
| IDENTITY 處理 | 選項 + SET IDENTITY_INSERT | 支援遷移場景 |
| 預設筆數 | 100 | 平衡實用性與效能 |
| 分批處理 | MVP 不實作 | 複雜度高，效益低 |
