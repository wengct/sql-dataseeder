# Phase 0：Research（自定義關鍵字固定值）

本文件用來把 Technical Context 中的決策點整理成可執行的設計依據（含取捨）。

## 1) 設定結構（VS Code Settings）

- **Decision**: 新增設定節點 `sqlDataSeeder.customKeywordValues.rules`（array），每筆規則包含：
  - `pattern: string`
  - `matchType: "literal" | "regex"`
  - `value: string | number | null`
- **Rationale**: 與既有 `sqlDataSeeder.faker.*` 同層級一致，且便於未來擴充（例如：啟用旗標、套用範圍）。
- **Alternatives considered**:
  - `sqlDataSeeder.customKeywordValueRules`（單一 key 放整個 array）：可行但較不利於未來加入子設定。
  - 以「偵測是否為 regex」自動判定：依 spec 明確禁止（避免誤判）。

## 2) 匹配語意與衝突解決

- **Decision**:
  - 只比對 **column name**（不含表名）。
  - 一律 **不分大小寫**。
  - `matchType: literal` → `contains` 子字串匹配。
  - `matchType: regex` → `new RegExp(pattern, 'i')`。
  - 多筆命中採 **first match wins**（以設定清單順序）。
- **Rationale**: 符合 FR-003/004/004a/004b/007 並維持使用者可預期性。
- **Alternatives considered**:
  - longest match / most specific wins：規則複雜度與心智負擔較高。
  - regex 允許 flags：會引入額外 UI/驗證複雜度，本次不需要。

## 3) 無效規則容錯與診斷輸出

- **Decision**:
  - 無效規則（缺欄位、空 pattern、未知 matchType）→ 忽略 + warning。
  - regex 編譯失敗（`new RegExp` throw）→ 忽略 + warning。
  - warning **主要寫到 VS Code Output Channel**；重大問題可額外 `showWarningMessage` 一次。
- **Rationale**: 符合 FR-008/008a/008b，避免設定瑕疵阻斷主要產生流程。
- **Alternatives considered**:
  - 直接 throw 中止：違反 FR-008。
  - 靜默忽略：會讓使用者難以理解「為什麼沒生效」。

## 4) 固定值 → SQL literal 的推斷與安全策略（FR-010）

- **Decision**:
  - `null` → `NULL`
  - number → 直接輸出（例如 `123`）
  - string → 一律當作 literal 字串處理：
    - `VARCHAR/CHAR` → `'...'`
    - `NVARCHAR/NCHAR` → `N'...'`
    - 單引號以 `''` 跳脫
  - 若字串包含 `;`, `--`, `/*`, `*/` 等疑似危險 token：仍視為字串（不可當作 raw SQL），只是在推斷上 **禁止** 嘗試把它當成 SQL expression。
- **Rationale**: 明確禁止 raw SQL expression（例如 `GETDATE()`）可降低 SQL 注入/語法風險並符合規格。
- **Alternatives considered**:
  - 允許 raw SQL：雖彈性高，但安全與可預期性差，且與 spec 結論衝突。

## 5) 效能考量

- **Decision**: regex 建議在單次產生中做快取（pattern → compiled RegExp），避免對每個欄位、每列重複編譯；匹配流程採「先驗證/預處理規則，再套用」。
- **Rationale**: 支援 SC-002（1000 筆資料不應顯著變慢）。
- **Alternatives considered**:
  - 不快取、直接每次 new RegExp：簡單但可能在大量欄位/列時退化。

### SC-002 回歸量測建議（可重複）

1. 選 1–3 張具代表性資料表（欄位數量中等/偏多各一）。
2. **Baseline**：將 `sqlDataSeeder.customKeywordValues.rules` 設為 `[]`，對每張表產生 `rowCount=1000`。
3. **Enabled**：設定至少 1 筆 `literal` + 1 筆 `regex` 規則（例如 `^is_`），同樣產生 `rowCount=1000`。
4. 以碼錶或其他工具量測 end-to-end 時間（從點擊命令到出現「已複製到剪貼簿」通知/完成提示）。
5. 建議每種設定各跑 3 次，取平均。

記錄格式（建議）：

```text
table=<schema.table> rows=1000 baselineMs=____ enabledMs=____ deltaPct=____%
```

> 實作備註：Matcher 內已對 `matchType=regex` 做 compiled RegExp cache，以降低大量欄位/列產生時的重複編譯成本。

