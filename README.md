# SQL DataSeeder

快速針對 SQL Server 資料表產生 INSERT 語法的 VS Code 擴充套件。

## 功能

從 Object Explorer 的資料表節點右鍵選單：

- **Generate Insert Scripts**: 產生含有假資料的 INSERT 語法
- **Generate Existing Insert Scripts**: 從資料表現有資料產生可執行的 INSERT 語法


### 主要特點

- 🎯 **一鍵產生**: 右鍵選單直接呼叫，無需複雜設定
- 📋 **自動複製**: 產生的 INSERT 語法自動複製到剪貼簿
- 🧠 **智慧假資料 (Faker.js)**: 依欄位名稱語意產生更真實的字串資料（Email、姓名、電話、地址等）
- ⚡ **高效能**: 100 筆 INSERT 語法在 2 秒內完成

## 先決條件

1. 安裝 [SQL Server (mssql)](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) 擴充套件
2. 使用 mssql 擴充套件連線到 SQL Server 資料庫

## 使用方式

1. 在 VS Code 側邊欄開啟 SQL Server Object Explorer
2. 展開資料庫 → Tables
3. 在目標資料表上**點擊右鍵**
4. 選擇功能：
   - **Generate Insert Scripts**：產生假資料 INSERT 語法
   - **Generate Existing Insert Scripts**：從現有資料產生 INSERT 語法
5. 依提示輸入選項：
   - **筆數**：預設 100 筆
   - **WHERE 條件**（選填）：不含 WHERE 關鍵字
   - **ORDER BY**（選填）：不含 ORDER BY 關鍵字
   - **IDENTITY 欄位**：若資料表有 IDENTITY 欄位，可選擇是否包含
6. INSERT 語法已複製到剪貼簿，直接貼上使用！

## 範例輸出

```sql
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('John Doe', N'john@example.com', 25, '2025-01-15 10:30:00.123');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Jane Smith', N'jane.smith@example.com', 32, '2025-02-20 14:45:00.456');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Alex Wang', N'alex.wang@example.com', 28, '2025-03-10 09:15:00.789');
```

## 支援的資料類型

| 類型 | 產生的值範例 | 說明 |
|------|-------------|------|
| varchar, nvarchar, char, nchar | `'xK9pLm'`、`N'中文'` | Unicode 類型自動加 N 前綴 |
| int, bigint, smallint, tinyint | `12345` | 整數類型 |
| decimal, numeric | `123.45` | 精確數值類型 |
| float, real | `123.4567` | 浮點數類型 |
| datetime, datetime2 | `'2025-01-15 10:30:00.123'` | 日期時間類型 |
| date | `'2025-01-15'` | 僅日期 |
| time | `'10:30:00'` | 僅時間 |
| bit | `0` 或 `1` | 布林類型 |
| uniqueidentifier | `'a1b2c3d4-e5f6-4890-abcd-ef1234567890'` | GUID |
| binary, varbinary | `0x48656C6C6F` | 二進位資料（十六進位格式） |

## 自動排除的欄位

- **IDENTITY 欄位**: 自動遞增欄位不會出現在 INSERT 語法中
- **COMPUTED 欄位**: 計算欄位不會出現在 INSERT 語法中
- **不支援的資料類型**: geography、geometry、xml、image、text、ntext、sql_variant、hierarchyid、timestamp/rowversion

## Faker.js 設定

此功能預設啟用，僅影響字串類型（varchar/nvarchar）。若欄位名稱無法識別，會自動退回原本的隨機英數字串。

- `sqlDataSeeder.faker.enabled`: 是否啟用（預設 true）
- `sqlDataSeeder.faker.locale`: `en` 或 `zh_TW`（預設 en）

## 常見問題

### 看不到「Generate Insert Scripts」選項？

請確認：
- 已安裝 mssql 擴充套件
- 正在「Table」節點上點擊右鍵（不是資料夾或欄位）

### 錯誤：「No active database connection」

請先使用 mssql 擴充套件連線到資料庫。

### 某些欄位沒有出現？

該欄位可能是 IDENTITY、COMPUTED 或不支援的資料類型。成功通知中會說明哪些欄位被跳過。

## Release Notes

### 0.1.1

- 新增 Faker.js 智慧假資料：依欄位名稱語意產生更真實的字串資料
- 新增設定：`sqlDataSeeder.faker.enabled`、`sqlDataSeeder.faker.locale`

### 0.1.0

- 新增「Generate Existing Insert Scripts」功能
  - 從資料表現有資料產生 INSERT 語法
  - 支援 WHERE 條件篩選與 ORDER BY 排序
  - 支援 IDENTITY 欄位選項
- 新增 binary/varbinary 資料類型支援
- 支援 20 種 SQL Server 資料類型

### 0.0.1

- 初始版本
- Generate Insert Scripts：產生假資料 INSERT 語法
- 右鍵選單整合
- 自動複製到剪貼簿

---

**Enjoy!** 🚀
