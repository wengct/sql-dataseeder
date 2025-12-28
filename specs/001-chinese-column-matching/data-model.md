# Data Model: 中文欄位名稱與同義詞匹配

## Entities

### ColumnName
- rawName: string (原始欄位名稱)
- normalizedName: string (NFKC + 英文小寫)
- displayName: string (原始名稱，僅供 UI/輸出)

### RulePattern
- pattern: string
- matchType: 'literal' | 'regex'
- value: string | number | null
- normalizedPattern: string (matchType = literal 時使用)

### SynonymGroup
- terms: string[] (設定值)
- normalizedTerms: string[] (NFKC + 英文小寫)

### MatchResult
- matched: boolean
- matchedBy: 'synonym' | 'literal' | 'regex' | 'semantic' | 'none'
- matchedPattern: string | null
- matchedValue: string | number | null

## Relationships
- ColumnName 透過 normalizedName 與 RulePattern.normalizedPattern 做等值比對。
- ColumnName 透過 normalizedName 與 SynonymGroup.normalizedTerms 做等值比對。
- SynonymGroup 命中時優先產生 MatchResult（matchedBy = synonym）。

## Validation Rules
- SynonymGroup.terms 必須為非空字串陣列，且每組至少 2 個項目；否則同義詞整體流程跳過。
- RulePattern.matchType = literal 時才使用 normalizedPattern。
- Regex 仍維持既有大小寫不敏感規則。
