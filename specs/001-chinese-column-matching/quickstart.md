# Quickstart: 中文欄位名稱與同義詞匹配

## 1) 設定同義詞清單
在 VS Code `settings.json` 新增：

```json
{
  "sqlDataSeeder.columnNameSynonyms": [
    ["身分證字號", "證號"],
    ["手機", "行動電話"]
  ]
}
```

規則：
- 每個群組至少 2 個非空字串。
- 若設定格式錯誤，系統將完全跳過同義詞匹配。
- 欄位名稱與同義詞會先做 NFKC 正規化 + 英文小寫統一後再比對。

## 2) 確認規則 pattern 可命中中文欄位
既有 `sqlDataSeeder.customKeywordValues.rules` 規則維持不變，中文與混合欄位名稱將以 NFKC 正規化 + 英文小寫統一後比對。

## 3) 匹配優先序
同義詞命中優先於既有語意/模式匹配；英文欄位匹配結果維持一致。

## 4) 範例流程
- 欄位名稱：`證號`
- 規則 pattern：`身分證字號` (literal)
- 結果：視為命中並套用規則值

