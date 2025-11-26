# SQL DataSeeder

快速針對 SQL Server 資料表產生 INSERT 語法的 VS Code 擴充套件。

## 功能

從 Object Explorer 的資料表節點右鍵選單，快速產生含有假資料的 INSERT 語法，並自動複製到剪貼簿。


### 主要特點

- 🎯 **一鍵產生**: 右鍵選單直接呼叫，無需複雜設定
- 📋 **自動複製**: 產生的 INSERT 語法自動複製到剪貼簿
- 🎲 **智慧假資料**: 根據欄位類型自動產生合適的假資料
- ⚡ **高效能**: 100 筆 INSERT 語法在 2 秒內完成

## 先決條件

1. 安裝 [SQL Server (mssql)](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) 擴充套件
2. 使用 mssql 擴充套件連線到 SQL Server 資料庫

## 使用方式

1. 在 VS Code 側邊欄開啟 SQL Server Object Explorer
2. 展開資料庫 → Tables
3. 在目標資料表上**點擊右鍵**
4. 選擇「**Generate Insert Scripts**」
5. 輸入要產生的筆數（預設 10 筆，最大 1000 筆）
6. INSERT 語法已複製到剪貼簿，直接貼上使用！

## 範例輸出

```sql
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('xK9pLm2w', N'abc123def', 25, '2025-01-15 10:30:00.123');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Qw2rTy8x', N'def456ghi', 32, '2025-02-20 14:45:00.456');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Mn3bVc5z', N'ghi789jkl', 28, '2025-03-10 09:15:00.789');
```

## 支援的資料類型

| 類型 | 產生的值範例 |
|------|-------------|
| varchar, nvarchar, char, nchar | `'xK9pLm'` (英數字元) |
| int, bigint, smallint, tinyint | `12345` |
| decimal, numeric | `123.45` |
| float, real | `123.4567` |
| datetime, datetime2 | `'2025-01-15 10:30:00.123'` |
| date | `'2025-01-15'` |
| time | `'10:30:00'` |
| bit | `0` 或 `1` |
| uniqueidentifier | `'a1b2c3d4-e5f6-4890-abcd-ef1234567890'` |

## 自動排除的欄位

- **IDENTITY 欄位**: 自動遞增欄位不會出現在 INSERT 語法中
- **COMPUTED 欄位**: 計算欄位不會出現在 INSERT 語法中
- **不支援的資料類型**: geography、geometry、xml、varbinary、image、text、ntext、sql_variant、hierarchyid、timestamp/rowversion

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

### 0.0.1

- 初始版本
- 支援 18 種 SQL Server 資料類型
- 右鍵選單整合
- 自動複製到剪貼簿

---

**Enjoy!** 🚀
