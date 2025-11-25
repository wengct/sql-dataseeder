# Data Model: Generate Insert Scripts

**Date**: 2025-11-25  
**Feature**: [spec.md](./spec.md)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          TableMetadata                          │
├─────────────────────────────────────────────────────────────────┤
│ schemaName: string                                              │
│ tableName: string                                               │
│ fullName: string (computed: [schemaName].[tableName])           │
│ columns: ColumnMetadata[]                                       │
│ insertableColumns: ColumnMetadata[] (computed: filtered)        │
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
│ isInsertable: boolean (computed: !isIdentity && !isComputed)    │
│ isSupported: boolean (computed: based on dataType)              │
└─────────────────────────────────────────────────────────────────┘
```

## Entities

### TableMetadata

資料表的結構資訊。

| 屬性 | 型別 | 說明 |
|------|------|------|
| schemaName | `string` | Schema 名稱（如 dbo） |
| tableName | `string` | 資料表名稱 |
| fullName | `string` | 完整名稱，格式為 `[schemaName].[tableName]` |
| columns | `ColumnMetadata[]` | 所有欄位的結構資訊 |
| insertableColumns | `ColumnMetadata[]` | 可插入的欄位（排除 IDENTITY、COMPUTED、不支援類型） |

### ColumnMetadata

欄位的結構資訊。

| 屬性 | 型別 | 說明 |
|------|------|------|
| name | `string` | 欄位名稱 |
| dataType | `SqlDataType` | SQL Server 資料類型 |
| maxLength | `number \| null` | 最大長度（字元數），null 表示無限制或不適用 |
| precision | `number \| null` | 精確度（用於 decimal/numeric） |
| scale | `number \| null` | 小數位數（用於 decimal/numeric） |
| isNullable | `boolean` | 是否可為 NULL |
| isIdentity | `boolean` | 是否為 IDENTITY 欄位 |
| isComputed | `boolean` | 是否為 COMPUTED 欄位 |
| isInsertable | `boolean` | 是否可插入（計算屬性） |
| isSupported | `boolean` | 是否為支援的資料類型（計算屬性） |

### SqlDataType (Enum)

支援的 SQL Server 資料類型。

```typescript
enum SqlDataType {
  // 字串類型
  VARCHAR = 'varchar',
  NVARCHAR = 'nvarchar',
  CHAR = 'char',
  NCHAR = 'nchar',
  
  // 整數類型
  INT = 'int',
  BIGINT = 'bigint',
  SMALLINT = 'smallint',
  TINYINT = 'tinyint',
  
  // 浮點數類型
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  FLOAT = 'float',
  REAL = 'real',
  
  // 日期時間類型
  DATETIME = 'datetime',
  DATETIME2 = 'datetime2',
  DATE = 'date',
  TIME = 'time',
  
  // 其他類型
  BIT = 'bit',
  UNIQUEIDENTIFIER = 'uniqueidentifier',
  
  // 不支援的類型（用於識別）
  UNSUPPORTED = 'unsupported'
}
```

## Value Objects

### GenerationOptions

產生 Insert 語法的選項。

| 屬性 | 型別 | 說明 | 預設值 |
|------|------|------|--------|
| rowCount | `number` | 要產生的筆數 | 10 |

### GenerationResult

產生結果。

| 屬性 | 型別 | 說明 |
|------|------|------|
| success | `boolean` | 是否成功 |
| script | `string \| null` | 產生的 Insert 語法 |
| rowCount | `number` | 實際產生的筆數 |
| skippedColumns | `string[]` | 被跳過的欄位名稱（不支援的類型） |
| errorMessage | `string \| null` | 錯誤訊息（若失敗） |

## State Transitions

### 產生流程狀態

```
[Idle] ──(使用者選擇功能)──> [Prompting]
                                │
                                ▼
[Prompting] ──(使用者輸入筆數)──> [Connecting]
                                │
                                ▼
[Connecting] ──(取得連線)──> [Querying]
    │                           │
    │                           ▼
    │           [Querying] ──(查詢結構)──> [Generating]
    │               │                          │
    │               │                          ▼
    │               │          [Generating] ──(產生語法)──> [Copying]
    │               │              │                          │
    │               │              │                          ▼
    │               │              │              [Copying] ──(複製到剪貼簿)──> [Completed]
    │               │              │                  │
    │               │              │                  ▼
    │               │              │              [ShowingNotification]
    │               │              │                  │
    │               │              │                  ▼
    │               │              │              [Idle]
    │               │              │
    └───────────────┴──────────────┴──(錯誤)──> [Error] ──> [Idle]
```

## Validation Rules

### ColumnMetadata

1. `isInsertable` = `!isIdentity && !isComputed && isSupported`
2. `isSupported` = `dataType !== SqlDataType.UNSUPPORTED`
3. 對於 nvarchar/nchar，`maxLength` 需要從 bytes 轉換為字元數（除以 2）
4. `maxLength` 為 -1 表示 MAX（如 varchar(max)）

### GenerationOptions

1. `rowCount` MUST > 0
2. `rowCount` MUST 為整數

### TableMetadata

1. `insertableColumns.length` MUST > 0，否則無法產生 Insert 語法

## Data Type Mapping

### 資料庫類型到 SqlDataType 的映射

| SQL Server 類型 | SqlDataType | 說明 |
|-----------------|-------------|------|
| varchar | VARCHAR | - |
| nvarchar | NVARCHAR | maxLength 需除以 2 |
| char | CHAR | - |
| nchar | NCHAR | maxLength 需除以 2 |
| int | INT | - |
| bigint | BIGINT | - |
| smallint | SMALLINT | - |
| tinyint | TINYINT | - |
| decimal | DECIMAL | 使用 precision 和 scale |
| numeric | NUMERIC | 使用 precision 和 scale |
| float | FLOAT | - |
| real | REAL | - |
| datetime | DATETIME | - |
| datetime2 | DATETIME2 | - |
| date | DATE | - |
| time | TIME | - |
| bit | BIT | - |
| uniqueidentifier | UNIQUEIDENTIFIER | - |
| 其他 | UNSUPPORTED | 將被跳過 |
