# Research: 整合 Faker.js 提供更真實的假資料生成

**Feature Branch**: `003-faker-integration`  
**Date**: 2025-12-25

## 1. Faker.js 版本與安裝策略

### Decision
使用 `@faker-js/faker` v9.x（官方維護版本）

### Rationale
- **官方維護**: `@faker-js/faker` 是 faker.js 的官方社群維護分支，原始 faker.js 已被棄用
- **TypeScript 支援**: 提供完整的 TypeScript 型別定義，符合專案的 Type Safety First 原則
- **活躍開發**: 持續更新、bug 修復頻繁，社群活躍
- **模組化**: 支援 tree-shaking，但本專案選擇完整打包確保功能完整性

### Alternatives Considered
| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| chance.js | 輕量 | 功能較少、缺乏多語系支援 | 不採用 |
| casual | 簡單 API | 已停止維護 | 不採用 |
| faker（原始版本） | 知名度高 | 已被棄用、安全疑慮 | 不採用 |
| @faker-js/faker | 完整功能、活躍維護 | 套件較大（~2-3MB） | ✅ 採用 |

---

## 2. 欄位名稱模式匹配策略

### Decision
使用可配置的對應表（Map）實作大小寫不敏感的模糊匹配，採用最長匹配優先原則

### Rationale
- **可擴展性**: 對應表結構易於新增/修改匹配規則
- **可測試性**: 純函式設計便於單元測試
- **效能**: 一次編譯正規表示式，匹配時 O(n) 複雜度（n = 規則數量）
- **優先順序**: 最長匹配優先避免歧義（如 `HomePhoneNumber` 匹配 `*phonenumber*` 而非 `*phone*`）

### Implementation Pattern

```typescript
interface FieldPattern {
  pattern: RegExp;           // 匹配模式（已轉換為 RegExp）
  patternLength: number;     // 模式長度（用於優先排序）
  fakerMethod: string;       // 對應的 Faker 方法路徑
  category: FieldCategory;   // 欄位類別
}

type FieldCategory = 
  | 'person'      // 姓名相關
  | 'contact'     // 聯繫資訊
  | 'location'    // 地址相關
  | 'company'     // 公司相關
  | 'internet'    // 網路相關
  | 'finance'     // 金融相關
  | 'text';       // 文字內容
```

### Alternatives Considered
| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| 硬編碼 switch/case | 簡單 | 難擴展、測試困難 | 不採用 |
| 外部設定檔 | 使用者可自訂 | 增加複雜度、需驗證 | 未來考慮 |
| 對應表 + 正規表示式 | 可擴展、可測試、內建於程式碼 | 需維護對應表 | ✅ 採用 |

---

## 3. Faker.js 語系（Locale）整合

### Decision
支援英文 (`en`) 與繁體中文 (`zh_TW`) 兩種語系，使用 VS Code 設定管理

### Rationale
- **需求導向**: spec 明確指定僅需支援 en 與 zh_TW
- **打包考量**: 僅包含兩種語系可控制套件大小
- **使用者體驗**: 透過 VS Code 標準設定 UI，無需學習額外介面

### Implementation Pattern

```typescript
import { Faker, en, zh_TW, base } from '@faker-js/faker';

// 根據設定建立 Faker 實例
function createFakerInstance(locale: 'en' | 'zh_TW'): Faker {
  const localeData = locale === 'zh_TW' ? [zh_TW, en, base] : [en, base];
  return new Faker({ locale: localeData });
}
```

### Locale Fallback Chain
- `zh_TW` → `en` → `base`（繁體中文缺失時退回英文）
- `en` → `base`（英文缺失時使用基礎資料）

### Alternatives Considered
| 方案 | 優點 | 缺點 | 結論 |
|------|------|------|------|
| 支援所有語系 | 最大相容性 | 大幅增加套件大小（20MB+） | 不採用 |
| 僅英文 | 最小套件 | 不符合 spec 需求 | 不採用 |
| en + zh_TW | 符合需求、可控大小 | 有限語系支援 | ✅ 採用 |

---

## 4. VS Code 設定整合

### Decision
使用 `contributes.configuration` 在 package.json 宣告設定項目

### Rationale
- **標準做法**: VS Code 擴充套件的標準設定方式
- **類型安全**: 可定義 enum 限制可選值
- **UI 整合**: 自動出現在 VS Code 設定介面

### Configuration Schema

```json
{
  "sqlDataSeeder.faker.enabled": {
    "type": "boolean",
    "default": true,
    "description": "啟用智慧假資料產生功能"
  },
  "sqlDataSeeder.faker.locale": {
    "type": "string",
    "enum": ["en", "zh_TW"],
    "default": "en",
    "description": "假資料產生使用的語系"
  }
}
```

---

## 5. 字串長度處理策略

### Decision
當 Faker 產生的資料超過欄位最大長度時，進行截斷處理

### Rationale
- **資料完整性**: 避免 INSERT 語句執行失敗
- **使用者體驗**: 使用者無需手動處理長度問題
- **spec 要求**: FR-007 明確要求處理長度限制

### Implementation Pattern

```typescript
function truncateToMaxLength(value: string, maxLength: number | null): string {
  if (maxLength === null || maxLength === -1) {
    return value; // varchar(max) 不限制
  }
  return value.length > maxLength ? value.substring(0, maxLength) : value;
}
```

---

## 6. 欄位模式對應表

### Decision
實作以下 14+ 種欄位模式識別（依 spec FR-002）

| 模式 | Faker 方法 | 範例輸出 |
|------|-----------|---------|
| `*firstname*` | `faker.person.firstName()` | John |
| `*lastname*` | `faker.person.lastName()` | Smith |
| `*name*` (不含 first/last) | `faker.person.fullName()` | John Smith |
| `*email*` | `faker.internet.email()` | john@example.com |
| `*phone*`, `*mobile*` | `faker.phone.number()` | 555-123-4567 |
| `*address*` | `faker.location.streetAddress()` | 123 Main St |
| `*city*` | `faker.location.city()` | New York |
| `*country*` | `faker.location.country()` | United States |
| `*company*` | `faker.company.name()` | Acme Corp |
| `*url*`, `*website*` | `faker.internet.url()` | https://example.com |
| `*description*`, `*notes*` | `faker.lorem.paragraph()` | Lorem ipsum... |
| `*username*` | `faker.internet.username()` | john_doe |
| `*password*` | `faker.internet.password()` | aF55c_8O9kZa |
| `*date*`, `*created*`, `*updated*` | (維持原有日期產生邏輯) | N/A |
| `*price*`, `*amount*`, `*cost*` | (維持原有數值產生邏輯) | N/A |

### Matching Priority
1. 轉換欄位名稱為小寫
2. 依模式長度降序排列所有規則
3. 找到第一個匹配的規則即返回

---

## 7. 向下相容策略

### Decision
新功能作為可選功能層疊加在現有邏輯之上，不修改現有的 fallback 行為

### Rationale
- **SC-005**: 所有現有測試需通過
- **SC-006**: 無法識別的欄位需 100% 退回原邏輯
- **Constitution VI**: 避免破壞現有功能

### Implementation Pattern

```typescript
class FakeDataService {
  generateValue(column: ColumnMetadata): string {
    // 1. 檢查功能開關
    if (!this.config.fakerEnabled) {
      return this.generateOriginalValue(column);
    }
    
    // 2. 嘗試智慧欄位識別（僅字串類型）
    if (this.isStringType(column.dataType)) {
      const fakerValue = this.tryGenerateFakerValue(column);
      if (fakerValue !== null) {
        return fakerValue;
      }
    }
    
    // 3. Fallback 至原有邏輯
    return this.generateOriginalValue(column);
  }
}
```

---

## 8. 測試策略

### Decision
採用單元測試為主，確保欄位模式匹配與假資料產生正確性

### Test Coverage Plan

| 測試類別 | 測試重點 | 預估案例數 |
|----------|----------|-----------|
| FieldPatternMatcher | 模式匹配正確性、優先順序 | 20+ |
| FakeDataService (新功能) | Faker 整合、長度截斷 | 15+ |
| FakerConfigService | 設定讀取、語系切換 | 5+ |
| Integration | 完整 INSERT 產生流程 | 10+ |

### Key Test Scenarios
1. 各欄位模式匹配正確性
2. 大小寫不敏感匹配
3. 最長匹配優先驗證
4. 語系切換驗證
5. 功能開關切換驗證
6. 長度截斷驗證
7. Fallback 行為驗證

---

## References

- [@faker-js/faker GitHub](https://github.com/faker-js/faker)
- [@faker-js/faker 文件](https://fakerjs.dev/)
- [VS Code Extension API - Configuration](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)
