# Feature Specification: 從現有資料庫資料產生 INSERT 腳本

**Feature Branch**: `002-existing-data-insert`  
**Created**: 2025-12-24  
**Status**: Draft  
**Input**: 使用者希望能從資料庫中現有的資料產生 INSERT 腳本，而非僅依賴假資料生成。

---

## Overview

目前 `sql-dataseeder` 擴充套件僅支援根據欄位型別自動產生假資料。為了提升工具的靈活性與真實性，本功能將新增「從資料庫讀取現有資料」的能力，讓使用者可以將實際資料轉換為 INSERT 語法。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 從資料表產生基本 INSERT 腳本 (Priority: P1)

作為一位資料庫開發者，我想要從目前連線的資料庫中選取一張資料表，並將該資料表的現有資料轉換成 INSERT 語法，以便我能快速建立測試資料腳本或資料遷移腳本。

**Why this priority**: 這是功能的核心價值，沒有這個能力，其他進階功能都無法運作。使用者最基本的需求就是能將資料表資料轉為 INSERT 語法。

**Independent Test**: 可以透過選取任一資料表並執行指令來驗證，產生的 INSERT 語法應能正確插入回資料庫。

**Acceptance Scenarios**:

1. **Given** 使用者已連線至 MSSQL 資料庫且資料表有資料，**When** 使用者執行「Generate Existing Insert Scripts」指令並選取資料表，**Then** 系統產生該資料表所有資料的 INSERT 語法並複製到剪貼簿
2. **Given** 使用者選取的資料表沒有任何資料，**When** 執行指令，**Then** 系統顯示提示訊息告知資料表為空
3. **Given** 產生的 INSERT 語法，**When** 使用者執行該 SQL，**Then** 資料能正確插入且與原始資料相同

---

### User Story 2 - 限制產生的資料筆數 (Priority: P2)

作為一位資料庫開發者，我想要指定只產生前 N 筆資料的 INSERT 語法，以便在資料量龐大時只取得部分樣本資料。

**Why this priority**: 資料表可能有成千上萬筆資料，全部產生會造成效能問題且不實用。限制筆數是常見需求。

**Independent Test**: 指定筆數後，驗證產生的 INSERT 語法數量符合指定值。

**Acceptance Scenarios**:

1. **Given** 資料表有 1000 筆資料，**When** 使用者指定只產生前 10 筆，**Then** 系統產生 10 筆 INSERT 語法
2. **Given** 資料表有 5 筆資料，**When** 使用者指定產生前 100 筆，**Then** 系統產生 5 筆 INSERT 語法（實際資料量）
3. **Given** 使用者未指定筆數，**When** 執行指令，**Then** 系統使用預設值（100 筆）

---

### User Story 3 - 使用條件篩選資料 (Priority: P3)

作為一位資料庫開發者，我想要透過 WHERE 條件篩選要產生的資料，以便只產生符合特定條件的 INSERT 語法。

**Why this priority**: 進階功能，讓使用者能更精確地控制輸出資料，但基本功能已能滿足大部分需求。

**Independent Test**: 輸入 WHERE 條件後，驗證產生的資料皆符合該條件。

**Acceptance Scenarios**:

1. **Given** 資料表有各種狀態的資料，**When** 使用者輸入 `Status = 'Active'` 條件，**Then** 系統只產生狀態為 Active 的資料 INSERT 語法
2. **Given** 使用者輸入的條件沒有符合的資料，**When** 執行指令，**Then** 系統顯示提示訊息告知沒有符合條件的資料
3. **Given** 使用者輸入無效的 SQL 條件，**When** 執行指令，**Then** 系統顯示錯誤訊息並引導使用者修正

---

### User Story 4 - 指定資料排序 (Priority: P3)

作為一位資料庫開發者，我想要指定資料的排序方式，以便產生的 INSERT 語法有一致的順序。

**Why this priority**: 輔助功能，增強可預測性，但非核心需求。

**Independent Test**: 指定排序欄位後，驗證產生的 INSERT 語法順序符合排序。

**Acceptance Scenarios**:

1. **Given** 使用者指定以 `CreatedDate DESC` 排序，**When** 執行指令，**Then** 產生的 INSERT 語法按建立日期降序排列
2. **Given** 使用者未指定排序，**When** 執行指令，**Then** 系統使用資料庫預設排序

---

### Edge Cases

- 資料表包含 NULL 值時，INSERT 語法應正確產生 `NULL` 關鍵字
- 字串欄位包含單引號（'）時，應正確跳脫為兩個單引號（''）
- 日期時間欄位應轉換為符合 MSSQL 格式的字串
- 二進位資料（BINARY、VARBINARY）應轉換為十六進位表示
- GUID/UNIQUEIDENTIFIER 欄位應轉換為標準 GUID 格式字串（'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'）
- IDENTITY 欄位應在 INSERT 語法中排除或加上 SET IDENTITY_INSERT 選項
- 計算欄位（Computed Columns）應自動排除
- 資料庫連線中斷時，應顯示適當的錯誤訊息

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 提供「Generate Existing Insert Scripts」指令供使用者從命令選擇區執行
- **FR-002**: 系統 MUST 允許使用者從目前連線的資料庫中選取一張資料表（每次執行僅限單一資料表）
- **FR-003**: 系統 MUST 從選定的資料表讀取現有資料並轉換為 INSERT 語法
- **FR-004**: 系統 MUST 將產生的 INSERT 語法自動複製到剪貼簿
- **FR-005**: 系統 MUST 正確處理各種 SQL 資料型別的轉換：
  - 字串型別：加上單引號並跳脫特殊字元
  - 數值型別：直接輸出數值
  - 日期時間型別：轉換為 MSSQL 相容的日期格式
  - NULL 值：輸出 NULL 關鍵字
  - 布林型別：轉換為 0 或 1
  - 二進位型別：轉換為十六進位格式
- **FR-006**: 系統 MUST 允許使用者指定要產生的最大資料筆數（預設 100 筆）
- **FR-007**: 系統 MUST 允許使用者輸入 WHERE 條件篩選資料（選填）
- **FR-008**: 系統 MUST 允許使用者指定 ORDER BY 排序欄位（選填）
- **FR-009**: 系統 MUST 自動排除無法插入的欄位（計算欄位）
- **FR-010**: 系統 MUST 在執行時提供選項讓使用者選擇是否包含 IDENTITY 欄位值；若選擇包含，則自動加上 `SET IDENTITY_INSERT ON/OFF` 語法；若選擇排除，則不輸出 IDENTITY 欄位
- **FR-011**: 系統 MUST 維持與現有假資料產生功能一致的 SQL 排版風格
- **FR-012**: 系統 MUST 在資料表無資料或查詢無結果時顯示適當提示訊息
- **FR-013**: 系統 MUST 在資料庫連線失敗或查詢錯誤時顯示錯誤訊息
- **FR-014**: 系統 MUST 在處理資料時使用 VS Code 進度條通知（withProgress）顯示處理進度百分比

### Key Entities

- **DataSourceConfig**: 代表資料來源的設定，包含目標資料表、筆數限制、WHERE 條件、ORDER BY 欄位等屬性
- **QueryResult**: 代表從資料庫查詢的結果集，包含欄位定義和資料列
- **InsertScript**: 代表產生的 INSERT 語法，包含完整的 SQL 語句和相關的設定（如 IDENTITY_INSERT）

---

## Clarifications

### Session 2025-12-24

- Q: 使用者是否需要一次選擇多張資料表來產生 INSERT 腳本？ → A: 每次只選擇單一資料表
- Q: 當資料表包含 IDENTITY 欄位時，產生的 INSERT 腳本應如何處理？ → A: 讓使用者選擇是否包含 IDENTITY 值
- Q: 當資料量較大時，系統應如何向使用者提供進度回饋？ → A: 使用 VS Code 進度條通知顯示處理進度
- Q: 產生的 INSERT 腳本應採用何種輸出格式？ → A: 與現有假資料功能一致（欄位值換行對齊，可讀性優先）
- Q: 使用者未指定筆數時，預設產生的最大資料筆數應該是多少？ → A: 100 筆

---

## Assumptions

以下假設用於填補規格中未明確說明的細節：

1. **資料庫類型**：本功能僅支援 MSSQL 資料庫（與現有功能一致）
2. **連線方式**：使用現有的 mssql-tools 擴充套件連線機制
3. **預設筆數**：未指定筆數時，預設產生 100 筆資料
4. **日期格式**：使用 ISO 8601 格式（'YYYY-MM-DDTHH:MM:SS'）
5. **錯誤處理**：使用 VS Code 的通知系統顯示錯誤訊息
6. **指令名稱**：使用「Generate Existing Insert Scripts」作為指令名稱

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者能在 30 秒內完成從選取資料表到取得 INSERT 腳本的完整流程（在本地資料庫環境下，資料量 ≤ 100 筆）
- **SC-002**: 產生的 INSERT 語法 100% 能在 MSSQL 資料庫中成功執行
- **SC-003**: 處理 1000 筆以內的資料時，產生時間不超過 5 秒
- **SC-004**: 所有支援的資料型別皆能正確轉換，包含：字串（CHAR、VARCHAR、NCHAR、NVARCHAR、TEXT、NTEXT）、數值（INT、BIGINT、DECIMAL、FLOAT、MONEY）、日期時間（DATE、DATETIME、DATETIME2、TIME）、布林（BIT）、二進位（BINARY、VARBINARY）、GUID（UNIQUEIDENTIFIER）、NULL 值
- **SC-005**: 使用者能透過條件篩選精確取得需要的資料子集
- **SC-006**: 產生的 SQL 格式與現有假資料功能一致，使用者無需重新學習

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

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

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]  
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

*Example of marking unclear requirements:*

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
