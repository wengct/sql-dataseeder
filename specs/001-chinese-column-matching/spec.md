# Feature Specification: 支援中文欄位名稱與同義詞匹配

**Feature Branch**: `001-chinese-column-matching`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: User description: "支援中文欄位名稱與同義詞匹配，提升欄位名稱匹配成功率與一致性。"

## Clarifications

### Session 2025-12-27

- Q: 同義詞清單的來源/管理方式要採哪一種？ → A: 由使用者在 VS Code 設定 `sqlDataSeeder.*` 中自訂清單。
- Q: 同義詞匹配的比對規則要採哪一種？ → A: 完整欄位名稱等值匹配（完全相同才算命中）。
- Q: 欄位名稱比對前是否需要正規化（如全形/半形）？ → A: 以 Unicode 正規化（NFKC）後再比對。
- Q: 英文欄位名稱的比對是否大小寫敏感？ → A: 大小寫不敏感。
- Q: 是否需要明確的效能目標？ → A: 不需要。
- Q: 同義詞設定在 `sqlDataSeeder.*` 中的資料格式要採哪一種？ → A: 以群組陣列表示（例如 `[["證號","身分證字號"],["手機","行動電話"]]`）。
- Q: 當同義詞匹配與既有語意/模式匹配同時命中時，優先順序要採哪一種？ → A: 同義詞匹配優先。
- Q: 是否需要新增 UI/指令讓使用者管理同義詞？ → A: 不需要新增 UI/指令，僅透過設定管理。
- Q: 若同義詞設定格式錯誤，系統應如何處理？ → A: 一律跳過同義詞匹配。

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 中文欄位名稱規則命中 (Priority: P1)

使用者在規則中設定中文欄位名稱時，系統仍能正確比對並套用規則值。

**Why this priority**: 中文欄位是主要痛點，若無法命中將直接阻斷自動產生/覆寫規則的價值。

**Independent Test**: 設定一條中文 pattern 規則並以含中文欄位的資料表進行匹配，確認規則被命中且輸出值正確。

**Acceptance Scenarios**:

1. **Given** 使用者設定 pattern 為「證號」的固定值規則，**When** 欄位名稱為「證號」進行匹配，**Then** 規則被命中並套用固定值。
2. **Given** 欄位名稱含任何中文或中英混合字元，**When** 執行欄位名稱匹配流程，**Then** 不會因非 ASCII 字元而失敗或跳過匹配。
3. **Given** 既有語意/模式匹配可辨識的中文欄位名稱，**When** 執行匹配流程，**Then** 會套用與既有英文欄位一致的語意類別結果。

---

### User Story 2 - 同義詞也能命中 (Priority: P2)

使用者使用同義詞設定規則時，系統能將實際欄位名稱視為匹配成功。

**Why this priority**: 不同團隊或資料庫的欄位命名差異會導致匹配失敗，同義詞能力可顯著提升成功率。

**Independent Test**: 設定「身分證字號」規則並以「證號」欄位測試匹配成功（反向亦同）。

**Acceptance Scenarios**:

1. **Given** 規則 pattern 為「身分證字號」，**When** 欄位名稱為「證號」進行匹配，**Then** 視為命中並套用規則值。
2. **Given** 規則 pattern 為「身分證字號」，**When** 欄位名稱為非同義詞（例如「護照號碼」）進行匹配，**Then** 不視為命中。

---

### User Story 3 - 英文欄位匹配維持一致 (Priority: P3)

系統新增中文與同義詞能力後，既有英文欄位的匹配結果不應改變。

**Why this priority**: 必須維持既有使用者的結果一致性，避免回歸風險。

**Independent Test**: 以既有英文欄位的回歸案例執行匹配，確認輸出完全一致。

**Acceptance Scenarios**:

1. **Given** 一組既有英文欄位與規則案例，**When** 執行匹配流程，**Then** 匹配結果與過去版本一致。

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- 欄位名稱包含中英混合與數字（例如「使用者Email」、「收件地址1」）時仍可進行匹配。
- 欄位名稱包含全形或特殊符號時，不應導致匹配流程失敗。
- 欄位名稱不在同義詞清單內時，不應被錯誤匹配成同義詞。

## Requirements *(mandatory)*

Assumptions: Existing column-name matching workflows and rule configurations remain in place; column name metadata is available from the current data source.  
Dependencies: Access to table/column names provided by existing schema discovery.

### Functional Requirements

- **FR-001**: System MUST support Unicode column names during all column-name matching workflows and MUST not fail or skip matching solely due to non-ASCII characters in a column name.
- **FR-003**: System MUST apply user-defined fixed-value pattern rules to Chinese and mixed-language column names.
- **FR-004**: System MUST apply existing semantic/intent-based matching to Chinese and mixed-language column names.
- **FR-005**: When the user-defined synonym list includes 「身分證字號」 and 「證號」 in the same group, the system MUST treat them as synonyms for matching purposes.
- **FR-006**: System MUST ensure synonym matching is bidirectional and deterministic for the same inputs.
- **FR-007**: System MUST preserve existing English-only matching results for identical inputs.
- **FR-008**: System MUST limit synonym matching to the explicitly defined synonym list and must not infer additional unrelated synonyms.
- **FR-009**: System MUST load the synonym list from user-defined configuration under `sqlDataSeeder.*`.
- **FR-010**: System MUST treat synonym matching as exact full column-name equality (no partial or fuzzy matching).
- **FR-011**: System MUST normalize column names using Unicode NFKC before matching.
- **FR-012**: System MUST treat English column-name matching as case-insensitive.
- **FR-013**: System MUST define synonyms in configuration as an array of synonym groups (array of string arrays).
- **FR-014**: System MUST prioritize synonym matching over existing semantic/intent-based matching when both match.
- **FR-015**: System MUST manage synonyms via configuration only and MUST NOT add new UI or commands for synonym management.
- **FR-016**: System MUST skip synonym matching when the synonym configuration is invalid.

### Key Entities *(include if feature involves data)*

- **Column Name**: The field name from a database table, potentially containing Unicode or mixed characters.
- **Rule Pattern**: A user-defined pattern used to determine whether a rule applies to a column.
- **Synonym Group**: A set of terms treated as equivalent for matching (e.g., 「身分證字號」 and 「證號」).
- **Match Result**: The outcome of matching a column name to a rule pattern (matched or not matched).

### Non-Functional Requirements

- **NFR-001**: No explicit performance or latency targets are defined for this feature; prioritize correctness and regression consistency.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: In a QA dataset with at least 5 schemas containing Chinese or mixed-language column names, 100% of expected rule matches succeed without errors.
- **SC-002**: Synonym matching passes 2/2 directional tests for 「身分證字號」 and 「證號」 (both directions).
- **SC-003**: English-only regression cases show 0 changes in match outcomes compared to the previous baseline.
- **SC-004**: In a validation set of at least 20 configured rules involving Chinese column names, at least 95% of expected matches are achieved.




