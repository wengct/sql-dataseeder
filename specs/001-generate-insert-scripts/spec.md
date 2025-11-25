# Feature Specification: Generate Insert Scripts

**Feature Branch**: `001-generate-insert-scripts`  
**Created**: 2025-11-25  
**Status**: Draft  
**Input**: User description: "根據資料表結構自動產生 Insert 語法的功能"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 從資料表右鍵選單產生 Insert 語法 (Priority: P1)

使用者在 VS Code 中使用 mssql 擴充套件連線到 SQL Server 資料庫後，可以在資料表節點上點選右鍵，從選單中選擇「Generate Insert Scripts」功能。系統會自動查詢該資料表的結構，產生指定筆數的 Insert 語法，並將結果複製到剪貼簿。

**Why this priority**: 這是核心功能，直接解決使用者手動編寫 Insert 語法耗時的痛點。沒有此功能，整個擴充套件就沒有價值。

**Independent Test**: 可透過在任一資料表上右鍵選擇功能，確認產生的 Insert 語法正確且已複製到剪貼簿來獨立測試。

**Acceptance Scenarios**:

1. **Given** 使用者已連線到 SQL Server 資料庫且在 Object Explorer 中看到資料表, **When** 在資料表名稱上點選右鍵並選擇「Generate Insert Scripts」, **Then** 顯示輸入框讓使用者指定要產生的筆數（預設 10 筆）
2. **Given** 使用者已輸入要產生的筆數（或使用預設值）, **When** 確認執行, **Then** 系統產生對應筆數的 Insert 語法，自動複製到剪貼簿，並顯示成功通知
3. **Given** 使用者已輸入要產生的筆數（或使用預設值）, **When** 確認執行, **Then** 產生的 Insert 語法包含該資料表的所有欄位，且每個欄位的值符合其資料類型

---

### User Story 2 - 根據欄位類型產生合理的假資料 (Priority: P1)

系統根據資料表各欄位的資料類型（如 varchar、int、datetime、bit 等）、長度限制、是否可為 NULL 等屬性，產生符合該欄位定義的假資料。

**Why this priority**: 假資料的品質直接影響工具的實用性，不合理的假資料會導致 Insert 語法執行失敗。

**Independent Test**: 可透過對包含多種資料類型欄位的資料表測試，確認各欄位產生的值都符合其定義。

**Acceptance Scenarios**:

1. **Given** 資料表有 varchar(50) 欄位, **When** 產生 Insert 語法, **Then** 該欄位的值為不超過 50 個字元的隨機字元組合字串
2. **Given** 資料表有 int 欄位, **When** 產生 Insert 語法, **Then** 該欄位的值為整數
3. **Given** 資料表有 datetime 欄位, **When** 產生 Insert 語法, **Then** 該欄位的值為有效的日期時間格式
4. **Given** 資料表有 bit 欄位, **When** 產生 Insert 語法, **Then** 該欄位的值為 0 或 1
5. **Given** 資料表有可為 NULL 的欄位, **When** 產生 Insert 語法, **Then** 該欄位永遠產生有效值（不產生 NULL）
6. **Given** 資料表有 NOT NULL 欄位, **When** 產生 Insert 語法, **Then** 該欄位一定產生非 NULL 的有效值

---

### User Story 3 - 錯誤處理與使用者回饋 (Priority: P2)

當發生錯誤時（如未連線到資料庫、無法取得資料表結構等），系統顯示清楚的錯誤訊息，說明問題原因並提供解決建議。

**Why this priority**: 良好的錯誤處理提升使用者體驗，但非核心功能。

**Independent Test**: 可透過模擬各種錯誤情境（斷開連線、無權限等）來測試錯誤訊息是否清楚。

**Acceptance Scenarios**:

1. **Given** 使用者未連線到資料庫, **When** 嘗試使用「Generate Insert Scripts」功能, **Then** 顯示錯誤訊息說明需要先連線到資料庫
2. **Given** 使用者連線的資料庫已斷線, **When** 嘗試使用「Generate Insert Scripts」功能, **Then** 顯示錯誤訊息說明連線已中斷，建議重新連線
3. **Given** 使用者對資料表沒有 SELECT 權限, **When** 嘗試使用「Generate Insert Scripts」功能, **Then** 顯示錯誤訊息說明權限不足

---

### Edge Cases

- 使用者輸入非正整數的筆數時，系統應顯示錯誤訊息並要求重新輸入有效的正整數
- 資料表沒有任何可插入的欄位時（所有欄位都是 IDENTITY 或 COMPUTED），系統應顯示錯誤訊息說明無法為此資料表產生 Insert 語法
- 資料表有 IDENTITY 欄位時，產生的 Insert 語法應排除 IDENTITY 欄位
- 資料表有 COMPUTED 欄位時，產生的 Insert 語法應排除 COMPUTED 欄位
- 欄位有 DEFAULT 值且為 NOT NULL 時，產生假資料而非依賴 DEFAULT 值
- 資料表有不支援的資料類型欄位時（如 geography、xml、varbinary、image 等），跳過該欄位並在成功通知中說明哪些欄位被跳過

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST 在 mssql 擴充套件的 Object Explorer 資料表節點上註冊右鍵選單項目「Generate Insert Scripts」
- **FR-002**: System MUST 在使用者選擇功能後，顯示輸入框讓使用者指定要產生的 Insert 語法筆數
- **FR-003**: System MUST 將產生筆數的預設值設為 10 筆
- **FR-004**: System MUST 使用 INFORMATION_SCHEMA 或 sys.* 系統檢視查詢資料表結構
- **FR-005**: System MUST 根據欄位的資料類型產生符合該類型的假資料
- **FR-005a**: System MUST 對字串類型欄位（varchar、nvarchar、char、nchar）產生隨機字元組合作為假資料
- **FR-006**: System MUST 根據欄位的長度限制產生不超過該長度的假資料
- **FR-007**: System MUST 對所有欄位（包含可為 NULL 的欄位）永遠產生有效值，不產生 NULL
- **FR-008**: System MUST 將產生的 Insert 語法自動複製到剪貼簿
- **FR-009**: System MUST 在成功產生語法後顯示通知告知使用者
- **FR-010**: System MUST 在發生錯誤時顯示清楚的錯誤訊息並提供解決建議
- **FR-011**: System MUST 排除 IDENTITY 欄位和 COMPUTED 欄位，不在 Insert 語法中包含這些欄位
- **FR-012**: System MUST 支援常見的 SQL Server 資料類型（varchar、nvarchar、char、nchar、int、bigint、smallint、tinyint、decimal、numeric、float、real、datetime、datetime2、date、time、bit、uniqueidentifier）
- **FR-013**: System MUST 跳過不支援的資料類型欄位，並在成功通知中說明哪些欄位被跳過

### Key Entities

- **TableMetadata**: 資料表的結構資訊，包含資料表名稱、Schema 名稱、欄位清單
- **ColumnMetadata**: 欄位的結構資訊，包含欄位名稱、資料類型、長度、精確度、小數位數、是否可為 NULL、是否為 IDENTITY、是否為 COMPUTED
- **FakeDataGenerator**: 假資料產生器，根據 ColumnMetadata 產生符合欄位定義的假資料

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 使用者可在 3 個步驟內完成產生 Insert 語法（右鍵選擇功能 → 輸入筆數 → 確認）
- **SC-002**: 產生的 Insert 語法可在 SQL Server 2016+ 上直接執行，成功率達 95% 以上
- **SC-003**: 支援至少 15 種常見的 SQL Server 資料類型
- **SC-004**: 錯誤訊息能讓使用者理解問題並採取行動，不需查閱額外文件

## Assumptions

- 使用者已安裝 mssql 擴充套件 (ms-mssql.mssql) 並成功連線到 SQL Server 資料庫
- 使用者對目標資料表有 SELECT 權限（用於查詢資料表結構）
- 目標資料庫為 SQL Server 2016 或更新版本
- 系統嘗試使用 mssql 擴充套件 API 取得連線資訊；若 API 不可用或有重大變動，則優雅降級並顯示錯誤訊息引導使用者

## Clarifications

### Session 2025-11-25

- Q: mssql 擴充套件整合方式為何？ → A: 嘗試使用 mssql API，若不可用則優雅降級顯示錯誤訊息
- Q: 可為 NULL 欄位產生 NULL 值的機率為何？ → A: 永遠產生有效值，不產生 NULL
- Q: 產生筆數的上限為何？ → A: 不設上限，讓使用者自行決定
- Q: 不支援的資料類型如何處理？ → A: 跳過該欄位，在通知中說明哪些欄位被跳過
- Q: 字串類型假資料的內容風格為何？ → A: 使用隨機字元組合
