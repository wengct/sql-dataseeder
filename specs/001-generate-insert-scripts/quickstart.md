# Quickstart: Generate Insert Scripts

**功能**: 從資料表右鍵選單自動產生 Insert 語法

## 先決條件

1. 安裝 [SQL Server (mssql)](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) 擴充套件
2. 使用 mssql 擴充套件連線到 SQL Server 資料庫

## 使用方式

### 步驟 1：開啟 Object Explorer

1. 開啟 VS Code
2. 點擊側邊欄的 SQL Server 圖示
3. 展開已連線的伺服器和資料庫

### 步驟 2：選擇資料表

1. 展開「Tables」資料夾
2. 找到目標資料表
3. 在資料表名稱上**點擊右鍵**

### 步驟 3：產生 Insert 語法

1. 從右鍵選單選擇「**Generate Insert Scripts**」
2. 在輸入框中輸入要產生的筆數（預設 10 筆）
3. 按下 Enter 確認

### 步驟 4：使用結果

1. 系統會顯示成功通知
2. Insert 語法已自動複製到剪貼簿
3. 在 SQL 編輯器中貼上 (Ctrl+V / Cmd+V)

## 範例輸出

```sql
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('xK9pLm', 'abc123@test.com', 25, '2025-01-15T10:30:00');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Qw2rTy', 'def456@test.com', 32, '2025-02-20T14:45:00');
INSERT INTO [dbo].[Users] ([Name], [Email], [Age], [CreatedAt]) VALUES ('Mn3bVc', 'ghi789@test.com', 28, '2025-03-10T09:15:00');
```

## 支援的資料類型

| 類型 | 產生的值範例 |
|------|-------------|
| varchar, nvarchar, char, nchar | `'xK9pLm'` |
| int, bigint, smallint, tinyint | `12345` |
| decimal, numeric | `123.45` |
| float, real | `123.456789` |
| datetime, datetime2 | `'2025-01-15T10:30:00'` |
| date | `'2025-01-15'` |
| time | `'10:30:00'` |
| bit | `0` 或 `1` |
| uniqueidentifier | `'a1b2c3d4-e5f6-7890-abcd-ef1234567890'` |

## 注意事項

- **IDENTITY 欄位**：自動排除，不會出現在 Insert 語法中
- **COMPUTED 欄位**：自動排除，不會出現在 Insert 語法中
- **不支援的資料類型**：會被跳過，並在通知中說明哪些欄位被跳過

## 常見問題

### Q: 為什麼看不到「Generate Insert Scripts」選項？

A: 請確認：
1. 您已安裝 mssql 擴充套件
2. 您正在資料表（Table）節點上點擊右鍵，而非資料夾或欄位

### Q: 錯誤訊息：「No active database connection」

A: 請先使用 mssql 擴充套件連線到資料庫：
1. 點擊側邊欄的 SQL Server 圖示
2. 點擊「Add Connection」
3. 輸入伺服器資訊並連線

### Q: 某些欄位沒有出現在 Insert 語法中？

A: 可能的原因：
- 該欄位是 IDENTITY 欄位（自動遞增）
- 該欄位是 COMPUTED 欄位（計算欄位）
- 該欄位的資料類型不支援（如 geography、xml、varbinary 等）

成功通知中會說明哪些欄位被跳過。

## 開發資訊

- **指令 ID**: `sql-dataseeder.generateInsertScripts`
- **右鍵選單條件**: `view == objectExplorer && viewItem =~ /type=Table/`
