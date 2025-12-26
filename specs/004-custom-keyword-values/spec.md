# Feature Specification: 自定義關鍵字與固定值設定

**Feature Branch**: `feature/004-custom-keyword-values`  
**Created**: 2025-12-26  
**Status**: Draft  
**Input**: 使用者描述：參考 `.github\\PRD\\PRD-004.md`，新增「自定義關鍵字（欄位名稱模式）對應固定值」的設定，並在資料產生時優先套用。

## Clarifications

### Session 2025-12-26

- Q: `pattern` 要如何判定是「一般字串」或「正規表達式」？ → A: 每筆規則新增欄位 `matchType: "literal" | "regex"`（或等價的 `isRegex`）由使用者明確指定
- Q: 規則的 `value` 要如何轉成 SQL 欄位值（引號/跳脫/NULL/數字）？ → A: 自動推斷型別（null/number/string）；字串自動加引號並 SQL 跳脫；若 `value` 含 `;`、`--`、`/*`、`*/` 等疑似危險 token，則強制視為字串處理
- Q: 同一欄位同時命中多筆規則時，衝突解決規則？ → A: 以設定清單順序為準（最先出現者優先 / first match wins）
- Q: 當 `matchType: "regex"` 但 `pattern` 是無效正規表達式時，要怎麼處理？ → A: 忽略該筆規則（不套用），並輸出 warning/診斷訊息
- Q: `pattern` 比對的「目標字串」是什麼？ → A: 只比對欄位名稱（column name），不含表名
- Q: 當 `matchType: "literal"` 時，`pattern` 的匹配語意為何？ → A: 不分大小寫的「包含/子字串」匹配（column name contains pattern）
- Q: 當 `matchType: "regex"` 時，是否一律不分大小寫？ → A: 是；系統編譯 regex 時固定採用不分大小寫（等同 flags `i`）
- Q: 規則的 `value` 是否允許 raw SQL 表達式（如 `GETDATE()`）？ → A: 否；`value` 一律視為 literal（依 FR-010 推斷 null/number/string，字串加引號並跳脫）
- Q: 警示/診斷訊息應輸出到哪裡？ → A: 主要寫到 VS Code Output Channel；重大問題（如無效 regex）可額外跳一次通知
- Q: 無效規則（空 `pattern` / 缺必要欄位）要如何處理？ → A: 視為無效規則，忽略該筆、不套用，並輸出 warning/診斷

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 以自定義固定值覆寫欄位產生 (Priority: P1)

作為使用者，我希望能在設定中定義「欄位名稱匹配規則（pattern）→ 固定值（value）」清單，讓產生 SQL 腳本時，凡是欄位名稱符合規則者都使用固定值，避免每次都要手動修改。

**Why this priority**: 這是功能核心價值，能直接滿足「特定業務代碼/固定測試資料」需求，並降低後續人工修正成本。

**Independent Test**: 僅需設定 1 筆 pattern/value，產生一次 SQL 腳本並確認匹配欄位使用固定值，即可完整驗證此故事並交付可用 MVP。

**Acceptance Scenarios**:

1. **Given** 使用者已設定一筆 pattern 與固定值，**When** 產生資料時遇到欄位名稱符合該 pattern，**Then** 該欄位輸出值必須等於使用者設定的固定值。
2. **Given** 同時存在自定義固定值與既有的智慧產生規則都可能套用的情境，**When** 欄位名稱符合自定義 pattern，**Then** 系統必須優先使用自定義固定值。

---

### User Story 2 - 支援多筆規則與可預期的匹配行為 (Priority: P2)

作為使用者，我希望能設定多筆規則，並且匹配行為具備一致性（例如不分大小寫、可預期的衝突處理），讓我能穩定地在不同資料表/欄位命名下重複使用。

**Why this priority**: 多數實際使用情境會需要多個固定欄位；一致性可降低「看似有設定但沒生效」的困擾。

**Independent Test**: 設定多筆規則並用一組欄位名稱測試（含大小寫差異與同時匹配）即可驗證。

**Acceptance Scenarios**:

1. **Given** 使用者設定多筆 pattern/value，**When** 產生資料時遇到不同欄位名稱分別命中不同規則，**Then** 每個命中的欄位都應使用各自對應的固定值。
2. **Given** 欄位名稱大小寫不同但語意相同，**When** 欄位名稱與 pattern 比對，**Then** 系統必須採用不分大小寫的匹配方式。
3. **Given** 多筆規則同時匹配同一個欄位名稱，**When** 系統決定要使用哪個固定值，**Then** 必須以「設定清單順序（最先出現者優先）」的方式選擇。

---

### User Story 3 - 支援進階匹配（正規表達式）並具備容錯 (Priority: P3)

作為使用者，我希望 pattern 能支援正規表達式，以便更彈性地涵蓋欄位命名差異；同時若設定錯誤，也不應導致整體腳本產生失敗。

**Why this priority**: 進階匹配可提升覆蓋率，但不應提高失敗風險；容錯能避免設定瑕疵阻斷主要工作流程。

**Independent Test**: 使用一筆「可被解讀為正規表達式」的 pattern 搭配一筆無效 pattern，確認系統仍可完成產生且有效規則生效。

**Acceptance Scenarios**:

1. **Given** 使用者設定一筆正規表達式 pattern，**When** 欄位名稱符合該正規表達式，**Then** 系統必須使用對應固定值。
2. **Given** 使用者設定中存在無效的匹配規則（例如 regex 無法編譯），**When** 產生 SQL 腳本，**Then** 系統不得因此導致整體產生失敗，且該筆規則不得套用，並應提供可理解的錯誤/警示資訊。

---

### Edge Cases

- 當自定義設定清單為空或未設定時，系統應維持既有行為（不套用任何固定值覆寫）。
- 當多筆規則同時匹配同一欄位名稱時，系統應以設定清單順序決定（最先出現者優先）。
- 當固定值為空字串或包含特殊字元時，系統應仍能產生可用的腳本輸出（不得造成產生流程中斷）。
- 當規則缺少必要欄位或 `pattern` 為空字串時，系統應忽略該筆規則並輸出 warning/診斷（不得視為 match-all）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 提供可由使用者在編輯器設定中管理的「pattern/value 規則清單」（設定 key：`sqlDataSeeder.customKeywordValues.rules`）。
- **FR-002**: 每一筆規則 MUST 至少包含：pattern（欄位名稱匹配模式）與 value（固定值）。
- **FR-003**: 系統 MUST 以不分大小寫的方式將欄位名稱（column name；不含表名）與 pattern 進行匹配。
- **FR-004**: 系統 MUST 支援將 pattern 作為「一般字串匹配」或「正規表達式匹配」使用，且 MUST 由每筆規則明確指定 `matchType: "literal" | "regex"`（或等價旗標）以避免自動誤判。
- **FR-004a**: 當 `matchType: "literal"` 時，系統 MUST 以不分大小寫的「包含/子字串」語意進行匹配（column name contains pattern）。
- **FR-004b**: 當 `matchType: "regex"` 時，系統 MUST 以不分大小寫的方式編譯與匹配（等同 regex flags `i`）。
- **FR-005**: 在產生欄位值時，系統 MUST 依下列優先順序決定輸出： (1) 自定義固定值規則 → (2) 既有智慧產生規則 → (3) 預設保底產生方式。
- **FR-006**: 系統 MUST 支援多筆自定義規則，並能在同一次資料產生中同時套用至不同欄位。
- **FR-007**: 若多筆自定義規則同時匹配同一欄位名稱，系統 MUST 以設定清單順序決定（最先出現者優先 / first match wins）。
- **FR-008**: 若自定義規則設定有誤（例如 regex 無法編譯），系統 MUST 不影響整體資料產生完成，並 MUST 忽略該筆規則（不套用），且 MUST 提供可理解的錯誤/警示資訊。
- **FR-008a**: 錯誤/警示資訊 MUST 主要輸出到 VS Code Output Channel；對於重大設定問題（例如無效 regex、或規則清單全數無效）MAY 額外顯示一次 notification（每次產生流程最多一次）。
- **FR-008b**: 若規則缺少必要欄位（pattern/value/matchType）或 `pattern` 為空字串，系統 MUST 視為無效規則並忽略（不套用），且 MUST 輸出 warning/診斷；不得視為 match-all。
- **FR-009**: 當未命中任何自定義規則時，系統 MUST 不改變既有的資料產生結果（相對於未啟用本功能時）。
- **FR-010**: 系統 MUST 將規則的 `value` 視為 literal 並轉成 SQL 欄位值時自動推斷型別：`null`/數字/字串；字串 MUST 自動加引號並進行 SQL 跳脫；若欄位型別為 Unicode 字串（nchar/nvarchar/ntext），字串 literal MUST 使用 `N'...'`，否則使用 `'...'`；若 `value` 含 `;`、`--`、`/*`、`*/` 等疑似危險 token，則 MUST 強制視為字串處理；本功能不支援輸入 raw SQL expression（如 `GETDATE()`）直接輸出。

### Key Entities *(include if feature involves data)*

- **Custom Keyword Value Rule**: 代表一筆使用者定義規則；包含 pattern、matchType（literal/regex；其中 literal = 不分大小寫的包含/子字串匹配）、value（自動推斷 null/number/string；字串自動加引號並跳脫；疑似危險 token 強制當字串）、順序（用於衝突解決）。
- **Generation Configuration**: 代表資料產生時讀取的使用者設定集合；包含自定義規則清單與其他既有產生相關設定。

### Assumptions

- 當多筆規則同時匹配同一欄位名稱時，系統採用「設定清單中最先出現者優先」作為衝突解決規則。
- 未特別指定安全/合規需求；固定值僅用於測試資料產生，不應被視為敏感資料儲存機制。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者能在 2 分鐘內完成新增/修改至少 3 筆規則，並在下一次產生中觀察到對應欄位值被固定值覆寫。
- **SC-002**: 在 95% 的常見使用情境中，產生 1,000 筆資料的腳本輸出不因啟用本功能而顯著變慢（相對於未啟用時，完成時間增加不超過 10%）。常見使用情境定義：依 quickstart 的設定方式，選取 1–3 張具代表性的資料表各產生 1,000 筆，於相同環境/相同連線條件下量測 end-to-end 產生時間並比較啟用前後差異。
- **SC-003**: 當自定義規則未命中任何欄位時，產生結果與未啟用本功能時一致（以回歸測試或比對輸出驗證）。
- **SC-004**: 針對需要固定欄位值的測試資料情境，使用者手動修改產出腳本的時間相較於未使用本功能降低至少 50%（以使用者回饋或量測作為依據；非阻塞指標，不作為自動化品質閘門）。

