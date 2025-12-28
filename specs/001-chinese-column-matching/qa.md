# QA Validation: 中文欄位名稱與同義詞匹配

## QA/驗證集

假設同義詞設定：

```json
{
  "sqlDataSeeder.columnNameSynonyms": [
    ["身分證字號", "證號"],
    ["手機", "行動電話"],
    ["Email", "電子郵件"]
  ]
}
```

| ID | Rule Pattern | Match Type | Column Name | Expected | Notes |
| --- | --- | --- | --- | --- | --- |
| QA-01 | 證號 | literal | 證號 | Match | 中文 literal 等值命中 |
| QA-02 | 身分證字號 | literal | 證號 | Match | 同義詞雙向命中 |
| QA-03 | 身分證字號 | literal | 護照號碼 | No Match | 非同義詞不命中 |
| QA-04 | Email | literal | 使用者Email | Match | 混合欄位包含英文 |
| QA-05 | Email | literal | 使用者email | Match | 大小寫不敏感 |
| QA-06 | 電子郵件 | literal | Email | Match | 同義詞命中 |
| QA-07 | 手機 | literal | 行動電話 | Match | 同義詞命中 |
| QA-08 | 手機 | literal | 家用電話 | No Match | 非同義詞不命中 |
| QA-09 | 收件地址 | literal | 收件地址1 | Match | contains 行為保留 |
| QA-10 | 使用者 | literal | 使用者名稱 | Match | contains 行為保留 |
| QA-11 | 姓名 | literal | 姓名 | Match | 中文 literal 等值 |
| QA-12 | 身分證字號 | literal | 身分證字號 | Match | 同義詞群組內等值 |
| QA-13 | ^is_ | regex | Is_Active | Match | regex i 命中 |
| QA-14 | ^is_ | regex | is_deleted | Match | regex i 命中 |
| QA-15 | ^is_ | regex | status | No Match | regex 不命中 |
| QA-16 | status | literal | OrderStatus | Match | 英文 literal contains |
| QA-17 | password | literal | UserPassword | Match | 英文 literal contains |
| QA-18 | firstname | literal | FirstName | Match | 英文 literal contains |
| QA-19 | country | literal | COUNTRY | Match | 英文大小寫不敏感 |
| QA-20 | mobile | literal | MobilePhone | Match | 英文 literal contains |

## 驗證結果

- 執行方式：對照單元測試與規則匹配邏輯進行人工驗證
- 通過率：20 / 20（100%）

