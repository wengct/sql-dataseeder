# Feature Specification: 整合 Faker.js 提供更真實的假資料生成

**Feature Branch**: `003-faker-integration`  
**Created**: 2025-12-25  
**Status**: Draft  
**Input**: 整合 Faker.js 至 SQL DataSeeder 擴充套件，讓產生的測試資料更加真實、有意義

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 智慧欄位識別產生真實資料 (Priority: P1)

身為一位開發者，我希望在產生 INSERT 語句時，系統能根據欄位名稱自動產生對應的真實假資料，例如 `Email` 欄位產生合理的電子郵件格式，`FirstName` 欄位產生真實的人名，讓測試資料更具可讀性與真實性。

**Why this priority**: 這是本功能的核心價值，解決目前無意義隨機字串的主要問題，能大幅提升測試資料品質與開發者體驗。

**Independent Test**: 可透過選取包含常見欄位名稱（如 Email、FirstName、Phone）的資料表定義，執行產生 INSERT 語句功能，驗證產生的值是否符合該欄位的語意。

**Acceptance Scenarios**:

1. **Given** 資料表包含名為 `Email` 的字串欄位，**When** 使用者執行產生 INSERT 語句，**Then** 該欄位產生符合電子郵件格式的值（如 `john.doe@example.com`）
2. **Given** 資料表包含名為 `FirstName` 的字串欄位，**When** 使用者執行產生 INSERT 語句，**Then** 該欄位產生真實的人名（如 `John`、`Mary`）
3. **Given** 資料表包含名為 `Phone` 的字串欄位，**When** 使用者執行產生 INSERT 語句，**Then** 該欄位產生符合電話號碼格式的值（如 `555-123-4567`）
4. **Given** 資料表包含無法識別的欄位名稱（如 `XYZ123`），**When** 使用者執行產生 INSERT 語句，**Then** 該欄位退回使用原本的隨機英數字串產生邏輯

---

### User Story 2 - 多語系假資料支援 (Priority: P2)

身為一位開發者，我希望能設定假資料的語系，讓產生的資料符合我的地區需求，例如產生繁體中文的姓名與地址。

**Why this priority**: 增強功能的國際化能力，對於非英語系使用者有顯著價值，但核心功能（智慧識別）需先完成。

**Independent Test**: 可透過變更 VS Code 設定中的語系選項，執行產生 INSERT 語句，驗證產生的資料是否符合指定語系。

**Acceptance Scenarios**:

1. **Given** 使用者設定語系為 `zh_TW`，**When** 對包含 `FirstName` 欄位的資料表執行產生 INSERT 語句，**Then** 產生的姓名為繁體中文人名
2. **Given** 使用者未設定語系（使用預設值），**When** 執行產生 INSERT 語句，**Then** 產生的資料為英文
3. **Given** 使用者設定語系為 `ja`（日文），**When** 對包含 `Address` 欄位的資料表執行產生 INSERT 語句，**Then** 產生的地址為日文格式

---

### User Story 3 - 功能開關控制 (Priority: P3)

身為一位開發者，我希望能透過設定開關選擇是否啟用智慧假資料功能，以便在需要時退回使用原本的隨機字串行為。

**Why this priority**: 提供使用者彈性選擇，屬於輔助功能，在核心功能穩定後再實作。

**Independent Test**: 可透過變更 VS Code 設定中的功能開關，執行產生 INSERT 語句，驗證是否正確切換假資料產生策略。

**Acceptance Scenarios**:

1. **Given** 使用者將功能開關設為「停用」，**When** 執行產生 INSERT 語句，**Then** 所有字串欄位使用原本的隨機英數字串邏輯
2. **Given** 使用者將功能開關設為「啟用」（預設），**When** 執行產生 INSERT 語句，**Then** 系統使用智慧欄位識別產生假資料

---

### Edge Cases

- 當欄位名稱包含多個關鍵字時（如 `HomePhoneNumber`），系統採用最長匹配優先原則（`phonenumber` > `phone` > `number`），若長度相同則依模式定義順序選擇
- 當欄位長度限制小於產生的假資料長度時，系統截斷至欄位允許的最大長度
- 當設定的語系不被支援時，系統退回使用英文 (`en`)
- 當欄位類型為非字串（如數值、日期）時，原有的資料產生邏輯應保持不變

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統必須根據欄位名稱模式自動識別並選擇適當的假資料產生策略
- **FR-002**: 系統必須支援以下欄位名稱模式的識別：
  - `*name*`、`*firstname*` → 產生名字
  - `*lastname*` → 產生姓氏
  - `*email*` → 產生電子郵件
  - `*phone*`、`*mobile*` → 產生電話號碼
  - `*address*` → 產生街道地址
  - `*city*` → 產生城市名稱
  - `*country*` → 產生國家名稱
  - `*company*` → 產生公司名稱
  - `*url*`、`*website*` → 產生網址
  - `*description*`、`*notes*` → 產生文字段落
  - `*username*` → 產生使用者名稱
  - `*password*` → 產生密碼（8-16 字元，包含大小寫字母與數字）
  - `*date*`、`*created*`、`*updated*` → 產生日期（ISO 8601 格式：YYYY-MM-DD，範圍：過去 5 年內）
  - `*price*`、`*amount*`、`*cost*` → 產生金額（0.00 - 99999.99，小數點後 2 位）
- **FR-003**: 系統必須在無法識別欄位名稱時，退回使用現有的隨機英數字串產生邏輯
- **FR-004**: 系統必須支援英文 (`en`) 與繁體中文 (`zh_TW`) 兩種語系的假資料產生，預設為英文
- **FR-005**: 使用者必須能透過 VS Code 設定 `sqlDataSeeder.faker.locale` 變更假資料語系
- **FR-006**: 使用者必須能透過 VS Code 設定 `sqlDataSeeder.faker.enabled` 開關啟用或停用智慧假資料功能（預設啟用）
- **FR-007**: 系統必須確保產生的假資料不超過資料庫欄位定義的長度限制
- **FR-008**: 系統必須保持所有現有的非字串資料類型產生邏輯不變（如數值、日期、布林值等）

### Key Entities

- **欄位名稱解析規則**: 定義欄位名稱模式與對應假資料類型的對應關係，支援模糊匹配（如 `*email*` 匹配 `UserEmail`、`EmailAddress` 等）
- **語系設定**: 使用者偏好的假資料語系設定，影響產生資料的語言與格式
- **功能開關**: 控制是否啟用智慧假資料功能的布林值設定

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 對於包含可識別欄位名稱（Email、FirstName、Phone 等）的資料表，90% 以上的字串欄位能產生語意相符的假資料
- **SC-002**: 產生的假資料 100% 符合各資料類型的格式規範（如 Email 格式、電話號碼格式）
- **SC-003**: 功能開關切換後，下一次產生的 INSERT 語句立即反映新設定
- **SC-004**: 語系變更後，下一次產生的假資料立即反映新語系
- **SC-005**: 所有現有的測試案例在功能整合後仍能通過（向下相容）
- **SC-006**: 無法識別的欄位名稱 100% 退回使用原有隨機字串邏輯

## Clarifications

### Session 2025-12-25

- Q: Faker.js 套件版本選擇？ → A: 使用 `@faker-js/faker` v9.x（最新版本，社群活躍維護）
- Q: 欄位名稱匹配策略實作方式？ → A: 使用可設定的對應表（Map/Object），支援未來擴展自訂規則
- Q: 套件打包策略？ → A: 將 Faker.js 完整打包進擴充套件（增加約 2-3 MB）
- Q: VS Code 設定項目命名空間？ → A: `sqlDataSeeder.faker.enabled` / `sqlDataSeeder.faker.locale`
- Q: 預設支援的語系清單範圍？ → A: 僅支援英文（en）與繁體中文（zh_TW）

## Assumptions

- 使用 `@faker-js/faker` v9.x 作為假資料產生套件
- 欄位名稱匹配採用可設定對應表實作，便於未來擴展自訂規則
- Faker.js 完整打包進擴充套件，確保離線可用且不依賴外部資源
- 支援語系範圍限定為 en（英文）與 zh_TW（繁體中文），其他語系輸入自動退回使用英文
- 欄位名稱比對採用大小寫不敏感的模糊匹配
- 當欄位名稱符合多個模式時，採用最長匹配優先原則
- 不支援的語系自動退回使用英文
- 假資料產生不需要確保唯一性（如需唯一性，由使用者自行處理）
- 電話號碼格式採用通用格式，不針對特定國家碼格式化
