# Data Model: 從現有資料庫資料產生 INSERT 腳本

**Date**: 2025-12-24  
**Feature**: [spec.md](./spec.md)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       ExistingDataOptions                       │
├─────────────────────────────────────────────────────────────────┤
│ rowCount: number                (預設 100)                      │
│ whereClause: string | null      (選填，不含 WHERE)              │
│ orderByClause: string | null    (選填，不含 ORDER BY)           │
│ includeIdentity: boolean        (預設 false)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          TableMetadata                          │
├─────────────────────────────────────────────────────────────────┤
│ schemaName: string                                              │
│ tableName: string                                               │
│ fullName: string (computed)                                     │
│ columns: ColumnMetadata[]                                       │
│ insertableColumns: ColumnMetadata[] (computed)                  │
│ hasIdentityColumn: boolean (computed)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ColumnMetadata                          │
├─────────────────────────────────────────────────────────────────┤
│ name: string                                                    │
│ dataType: SqlDataType                                           │
│ maxLength: number | null                                        │
│ precision: number | null                                        │
│ scale: number | null                                            │
│ isNullable: boolean                                             │
│ isIdentity: boolean                                             │
│ isComputed: boolean                                             │
│ isInsertable: boolean (computed)                                │
│ isSupported: boolean (computed)                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ describes
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           QueryRow                              │
├─────────────────────────────────────────────────────────────────┤
│ [columnName: string]: QueryCell                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           QueryCell                             │
├─────────────────────────────────────────────────────────────────┤
│ displayValue: string                                            │
│ isNull: boolean                                                 │
│ invariantCultureDisplayValue: string | undefined                │
└─────────────────────────────────────────────────────────────────┘
```

## Entities

### ExistingDataOptions (NEW)

使用者輸入的查詢選項。

| 屬性 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| rowCount | `number` | 要產生的最大筆數 | 100 |
| whereClause | `string \| null` | WHERE 條件（不含 WHERE 關鍵字） | null |
| orderByClause | `string \| null` | ORDER BY 欄位（不含 ORDER BY 關鍵字） | null |
| includeIdentity | `boolean` | 是否包含 IDENTITY 欄位 | false |

### TableMetadata (EXISTING - Extended)

資料表的結構資訊。新增 `hasIdentityColumn` 計算屬性。

| 屬性 | 型別 | 說明 | 狀態 |
|------|------|------|------|
| schemaName | `string` | Schema 名稱 | 現有 |
| tableName | `string` | 資料表名稱 | 現有 |
| fullName | `string` | 完整名稱 `[schemaName].[tableName]` | 現有 |
| columns | `ColumnMetadata[]` | 所有欄位的結構資訊 | 現有 |
| insertableColumns | `ColumnMetadata[]` | 可插入的欄位 | 現有 |
| hasIdentityColumn | `boolean` | 是否有 IDENTITY 欄位 | **NEW** |

### ColumnMetadata (EXISTING)

欄位的結構資訊。沿用現有定義，無需修改。

### QueryCell (NEW)

代表查詢結果中的單一欄位值。對應 mssql 擴充套件的 `IQueryResultCell`。

| 屬性 | 型別 | 說明 |
|------|------|------|
| displayValue | `string` | 顯示值（可能受本地化影響） |
| isNull | `boolean` | 是否為 NULL |
| invariantCultureDisplayValue | `string \| undefined` | 與文化無關的顯示值 |

### QueryRow (NEW)

代表查詢結果中的一筆資料列。

| 屬性 | 型別 | 說明 |
|------|------|------|
| [columnName] | `QueryCell` | 欄位名稱對應到欄位值 |

## Value Objects

### ExistingDataGenerationResult (NEW)

產生結果，擴展現有 GenerationResult。

| 屬性 | 型別 | 說明 |
|------|------|------|
| success | `boolean` | 是否成功 |
| script | `string \| null` | 產生的 INSERT 腳本 |
| rowCount | `number` | 實際產生的筆數 |
| skippedColumns | `string[]` | 被跳過的欄位名稱（不支援的類型） |
| errorMessage | `string \| null` | 錯誤訊息（若失敗） |
| hasIdentityInsert | `boolean` | 是否包含 SET IDENTITY_INSERT | **NEW** |

### DataQuery (NEW)

動態組合的資料查詢。

| 屬性 | 型別 | 說明 |
|------|------|------|
| tableName | `string` | 完整資料表名稱 |
| columns | `string[]` | 要查詢的欄位列表 |
| topN | `number` | TOP N 限制 |
| whereClause | `string \| null` | WHERE 條件 |
| orderByClause | `string \| null` | ORDER BY 條件 |

**toSql() 方法產生的格式**:
```sql
SELECT TOP 100 [Col1], [Col2], [Col3]
FROM [dbo].[TableName]
WHERE Status = 'Active'
ORDER BY CreatedDate DESC
```

## State Transitions

### 產生流程狀態

```
[Idle]
    │
    ▼ (使用者右鍵選擇「Generate Existing Insert Scripts」)
[PromptingRowCount]
    │
    ▼ (使用者輸入筆數或按 Enter 使用預設)
[PromptingWhereClause]
    │
    ▼ (使用者輸入 WHERE 或留空)
[PromptingOrderBy]
    │
    ▼ (使用者輸入 ORDER BY 或留空)
[CheckingIdentity]
    │
    ├─ (無 IDENTITY 欄位) ──────────────────┐
    │                                        │
    ▼ (有 IDENTITY 欄位)                     │
[PromptingIncludeIdentity]                   │
    │                                        │
    ▼ (使用者選擇是否包含)                   │
    ├────────────────────────────────────────┘
    ▼
[QueryingSchema]
    │
    ▼ (取得資料表結構)
[QueryingData]
    │
    ├─ (無資料) ─────────────> [ShowingEmptyMessage] ──> [Idle]
    │
    ▼ (有資料)
[GeneratingScript]
    │
    ▼ (產生 INSERT 腳本)
[CopyingToClipboard]
    │
    ▼ (複製成功)
[ShowingSuccessNotification]
    │
    ▼
[Idle]

錯誤處理：
任何階段 ──(錯誤)──> [ShowingErrorMessage] ──> [Idle]
任何提示階段 ──(使用者按 ESC)──> [Idle]
```

## Validation Rules

### ExistingDataOptions

1. `rowCount` MUST > 0
2. `rowCount` MUST 為整數
3. `whereClause` 若非空，MUST 不以 `WHERE` 開頭（自動移除）
4. `orderByClause` 若非空，MUST 不以 `ORDER BY` 開頭（自動移除）

### QueryCell 值轉換

1. 若 `isNull === true`，輸出 `NULL`，忽略 displayValue
2. Unicode 字串類型（nvarchar, nchar）MUST 加 `N` 前綴
3. 字串值中的單引號 MUST 跳脫為兩個單引號
4. 數值類型優先使用 `invariantCultureDisplayValue`
5. 二進位類型 MUST 輸出 `0x` 前綴

### IDENTITY 處理

1. 若 `includeIdentity === false`：
   - 排除 IDENTITY 欄位於 INSERT 語法
   - 不產生 SET IDENTITY_INSERT
2. 若 `includeIdentity === true`：
   - 包含 IDENTITY 欄位於 INSERT 語法
   - 在腳本開頭加入 `SET IDENTITY_INSERT [table] ON;`
   - 在腳本結尾加入 `SET IDENTITY_INSERT [table] OFF;`

## Data Type Mapping (Extended)

### 新增的型別支援

| SQL Server 類型 | SqlDataType | 格式化方式 | 狀態 |
|-----------------|-------------|------------|------|
| binary | BINARY | `0x...` 十六進位 | **NEW** |
| varbinary | VARBINARY | `0x...` 十六進位 | **NEW** |

### SqlDataType Enum (Extended)

```typescript
enum SqlDataType {
  // 現有型別...
  VARCHAR = 'varchar',
  NVARCHAR = 'nvarchar',
  // ... 略 ...
  
  // 新增二進位型別
  BINARY = 'binary',
  VARBINARY = 'varbinary',
  
  UNSUPPORTED = 'unsupported'
}
```

## Error Messages (Extended)

| 情境 | 錯誤代碼 | 訊息 |
|------|----------|------|
| 資料表無資料 | TABLE_EMPTY | `Table [schema].[table] has no data.` |
| 查詢無結果 | QUERY_NO_RESULTS | `No data matching the specified conditions.` |
| 無效的筆數 | INVALID_ROW_COUNT | `Row count must be a positive integer.` |
| 查詢語法錯誤 | QUERY_SYNTAX_ERROR | `Query failed: {error}. Please check your WHERE/ORDER BY clause.` |

## UI Messages

| 步驟 | 提示文字 | 預設值/提示 |
|------|----------|-------------|
| 筆數輸入 | `Enter the number of rows to generate (default: 100):` | `100` |
| WHERE 輸入 | `Enter WHERE condition (optional, without WHERE keyword):` | - |
| ORDER BY 輸入 | `Enter ORDER BY clause (optional, without ORDER BY keyword):` | - |
| IDENTITY 選擇 | `Include IDENTITY column values?` | `No`, `Yes` |
| 成功通知 | `✓ {n} INSERT statements copied to clipboard.` | - |
| 包含 IDENTITY 成功 | `✓ {n} INSERT statements (with IDENTITY_INSERT) copied to clipboard.` | - |
