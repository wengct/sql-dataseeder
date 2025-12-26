# Quickstart：自定義關鍵字固定值

本功能讓你在產生 INSERT 腳本時，針對「欄位名稱符合條件」的欄位直接輸出指定固定值（優先於 Faker/既有產生邏輯）。

## 1) 在 VS Code 設定新增 rules

在 `settings.json` 加上：

```jsonc
{
  "sqlDataSeeder.customKeywordValues.rules": [
    {
      "pattern": "tenantid",
      "matchType": "literal",
      "value": 1
    },
    {
      "pattern": "^is_",
      "matchType": "regex",
      "value": 0
    },
    {
      "pattern": "createdat",
      "matchType": "literal",
      "value": null
    },
    {
      "pattern": "status",
      "matchType": "literal",
      "value": "ACTIVE"
    }
  ]
}
```

### 規則說明

- `matchType: "literal"`：不分大小寫、子字串包含（column name contains pattern）。
- `matchType: "regex"`：不分大小寫（等同 `/i`）。
- 多筆同時命中：以 rules 順序為準（最先出現者優先）。

## 2) 產生腳本

在 Object Explorer 對資料表右鍵：

- **Generate Insert Scripts**（產生假資料）

產生結果會自動複製到剪貼簿並顯示通知。

## 3) 驗證是否生效

- 任一欄位名稱若符合 `pattern`，該欄位輸出應直接等於 `value`。
- 若你的 `pattern` 是無效 regex，系統會忽略該規則並在 Output Channel 提示原因，但不會讓整體產生失敗。

## 4) 常見注意事項

- `value` 一律視為 **literal**：不支援輸入 `GETDATE()` 之類 raw SQL expression。
- 字串會自動加引號並做 SQL 跳脫（單引號會變成兩個單引號）。
