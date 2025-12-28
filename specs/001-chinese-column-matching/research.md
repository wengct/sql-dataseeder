# Research Findings: 中文欄位名稱與同義詞匹配

## Decision 1: Unicode 正規化策略
- Decision: 以 `String.prototype.normalize('NFKC')` 對欄位名稱、規則 pattern、同義詞詞彙做一致正規化後再比對。
- Rationale: 符合規格需求，並能消除全形/半形等視覺相同但字碼不同的差異。
- Alternatives considered: 不正規化（無法滿足 FR-011）、僅針對欄位名稱正規化（規則/同義詞仍可能失配）。

## Decision 2: 英文大小寫不敏感
- Decision: 正規化後以 `toLocaleLowerCase('en-US')` 進行大小寫統一，再做字串等值比較。
- Rationale: 符合 FR-012，且對非英文欄位不會造成破壞性影響。
- Alternatives considered: 僅使用 `toLowerCase()`（行為較不明確）、改用區域性敏感比對（複雜度不必要）。

## Decision 3: 同義詞設定結構與驗證
- Decision: 新增設定 `sqlDataSeeder.columnNameSynonyms`，型別為 `string[][]`，每個群組至少 2 個非空字串；若格式不符，完全跳過同義詞匹配流程。
- Rationale: 符合 FR-009、FR-013、FR-016，並降低錯誤設定對既有行為的影響。
- Alternatives considered: 單一 map 格式（不符合群組需求）、部分群組可用（違反「格式錯誤一律跳過」）。

## Decision 4: 匹配優先序
- Decision: 同義詞命中後直接視為規則命中，優先於既有語意/模式匹配。
- Rationale: 符合 FR-014，提升一致性。
- Alternatives considered: 先跑語意匹配再覆寫（行為難以預期）。

## Decision 5: 比對方式
- Decision: 同義詞與規則 pattern 皆採「完整欄位名稱等值」比對，不做部分或模糊匹配。
- Rationale: 符合 FR-010，避免誤判。
- Alternatives considered: contains/regex（會引入非預期命中）。
