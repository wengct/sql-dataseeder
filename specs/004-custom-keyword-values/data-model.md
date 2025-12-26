# Phase 1：Data Model（自定義關鍵字固定值）

## Entities

### 1) CustomKeywordValueRule

代表一筆「欄位名稱匹配 → 固定值」規則。

| 欄位 | 型別 | 必填 | 說明 | 驗證/規則 |
|---|---|---:|---|---|
| pattern | string | ✅ | 欄位名稱匹配模式 | 不可為空字串；`matchType=literal` 時做不分大小寫 `contains` |
| matchType | "literal" \| "regex" | ✅ | 匹配方式 | 只能是兩者其一；不得自動推斷 |
| value | string \| number \| null | ✅ | 固定值（literal） | 不支援 raw SQL expression；輸出時依欄位型別決定 `'...'` 或 `N'...'` |
| order | number | ✅（隱含） | 規則順位 | 由 rules array index 決定（first match wins） |

**Relationships**: `GenerationConfiguration 1 -- * CustomKeywordValueRule`

### 2) GenerationConfiguration（既有概念，增補）

| 欄位 | 型別 | 說明 |
|---|---|---|
| faker | { enabled: boolean; locale: "en" \| "zh-TW" } | 既有 Faker 設定 |
| customKeywordValues | { rules: CustomKeywordValueRule[] } | 本功能新增設定 |

## Validation Rules（對應 Requirements）

- **FR-003**：column name 與 pattern 比對一律不分大小寫。
- **FR-004/004a/004b**：matchType 由使用者指定；literal=contains；regex 固定 i。
- **FR-007**：多筆命中 → 取最先出現規則。
- **FR-008/008b**：無效規則忽略且產生 warning；不得造成整體流程失敗。
- **FR-010**：value 視為 literal，推斷 null/number/string；字串加引號並跳脫；不支援 raw SQL。

## State Transitions

本功能為「純設定 + 套用」流程，無明確 state machine；主要狀態為：

1. 讀取設定
2. 驗證/過濾規則（收集 warnings）
3. 產生每欄位值時，依優先序套用：固定值規則 → Faker → 型別預設
