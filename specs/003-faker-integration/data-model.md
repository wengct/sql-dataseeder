# Data Model: 整合 Faker.js 提供更真實的假資料生成

**Feature Branch**: `003-faker-integration`  
**Date**: 2025-12-25

## 1. 核心型別定義

### 1.1 FieldCategory（欄位類別）

```typescript
/**
 * 欄位語意類別
 * 用於分類欄位名稱模式對應的假資料類型
 */
export type FieldCategory =
  | 'person'      // 人名相關（FirstName, LastName, FullName）
  | 'contact'     // 聯繫資訊（Email, Phone, Mobile）
  | 'location'    // 地址相關（Address, City, Country）
  | 'company'     // 公司相關（Company, CompanyName）
  | 'internet'    // 網路相關（URL, Website, Username, Password）
  | 'text'        // 文字內容（Description, Notes）
  | 'unknown';    // 無法識別（退回原有邏輯）
```

### 1.2 FieldPattern（欄位模式）

```typescript
/**
 * 欄位名稱模式定義
 * 描述如何匹配欄位名稱並對應至 Faker 方法
 */
export interface FieldPattern {
  /** 模式識別碼 */
  readonly id: string;
  
  /** 
   * 匹配模式（支援 * 萬用字元）
   * 例如: '*email*', '*firstname*'
   */
  readonly pattern: string;
  
  /** 編譯後的正規表示式（內部使用） */
  readonly regex: RegExp;
  
  /** 模式長度（不含萬用字元，用於優先排序） */
  readonly patternLength: number;
  
  /** 欄位類別 */
  readonly category: FieldCategory;
  
  /** 
   * Faker 方法識別碼
   * 例如: 'person.firstName', 'internet.email'
   */
  readonly fakerMethod: FakerMethodId;
}

/**
 * Faker 方法識別碼
 * 限定支援的 Faker 方法，確保型別安全
 */
export type FakerMethodId =
  | 'person.firstName'
  | 'person.lastName'
  | 'person.fullName'
  | 'internet.email'
  | 'phone.number'
  | 'location.streetAddress'
  | 'location.city'
  | 'location.country'
  | 'company.name'
  | 'internet.url'
  | 'internet.username'
  | 'internet.password'
  | 'lorem.paragraph';
```

### 1.3 FieldMatchResult（匹配結果）

```typescript
/**
 * 欄位名稱匹配結果
 */
export interface FieldMatchResult {
  /** 是否匹配成功 */
  readonly matched: boolean;
  
  /** 匹配到的模式（若 matched = true） */
  readonly pattern?: FieldPattern;
  
  /** 原始欄位名稱 */
  readonly columnName: string;
}
```

### 1.4 FakerConfig（Faker 設定）

```typescript
/**
 * Faker.js 功能設定
 */
export interface FakerConfig {
  /** 是否啟用智慧假資料功能 */
  readonly enabled: boolean;
  
  /** 假資料語系 */
  readonly locale: FakerLocale;
}

/**
 * 支援的語系
 */
export type FakerLocale = 'en' | 'zh_TW';

/**
 * 預設設定
 */
export const DEFAULT_FAKER_CONFIG: FakerConfig = {
  enabled: true,
  locale: 'en'
};
```

---

## 2. 預設欄位模式定義

```typescript
/**
 * 預設欄位模式對應表
 * 依 spec FR-002 定義
 */
export const DEFAULT_FIELD_PATTERNS: readonly FieldPattern[] = [
  // Person 類別 - 姓名相關
  {
    id: 'firstname',
    pattern: '*firstname*',
    regex: /firstname/i,
    patternLength: 9,
    category: 'person',
    fakerMethod: 'person.firstName'
  },
  {
    id: 'lastname',
    pattern: '*lastname*',
    regex: /lastname/i,
    patternLength: 8,
    category: 'person',
    fakerMethod: 'person.lastName'
  },
  {
    id: 'name',
    pattern: '*name*',
    regex: /name/i,
    patternLength: 4,
    category: 'person',
    fakerMethod: 'person.fullName'
  },
  
  // Contact 類別 - 聯繫資訊
  {
    id: 'email',
    pattern: '*email*',
    regex: /email/i,
    patternLength: 5,
    category: 'contact',
    fakerMethod: 'internet.email'
  },
  {
    id: 'phone',
    pattern: '*phone*',
    regex: /phone/i,
    patternLength: 5,
    category: 'contact',
    fakerMethod: 'phone.number'
  },
  {
    id: 'mobile',
    pattern: '*mobile*',
    regex: /mobile/i,
    patternLength: 6,
    category: 'contact',
    fakerMethod: 'phone.number'
  },
  
  // Location 類別 - 地址相關
  {
    id: 'address',
    pattern: '*address*',
    regex: /address/i,
    patternLength: 7,
    category: 'location',
    fakerMethod: 'location.streetAddress'
  },
  {
    id: 'city',
    pattern: '*city*',
    regex: /city/i,
    patternLength: 4,
    category: 'location',
    fakerMethod: 'location.city'
  },
  {
    id: 'country',
    pattern: '*country*',
    regex: /country/i,
    patternLength: 7,
    category: 'location',
    fakerMethod: 'location.country'
  },
  
  // Company 類別
  {
    id: 'company',
    pattern: '*company*',
    regex: /company/i,
    patternLength: 7,
    category: 'company',
    fakerMethod: 'company.name'
  },
  
  // Internet 類別
  {
    id: 'url',
    pattern: '*url*',
    regex: /url/i,
    patternLength: 3,
    category: 'internet',
    fakerMethod: 'internet.url'
  },
  {
    id: 'website',
    pattern: '*website*',
    regex: /website/i,
    patternLength: 7,
    category: 'internet',
    fakerMethod: 'internet.url'
  },
  {
    id: 'username',
    pattern: '*username*',
    regex: /username/i,
    patternLength: 8,
    category: 'internet',
    fakerMethod: 'internet.username'
  },
  {
    id: 'password',
    pattern: '*password*',
    regex: /password/i,
    patternLength: 8,
    category: 'internet',
    fakerMethod: 'internet.password'
  },
  
  // Text 類別
  {
    id: 'description',
    pattern: '*description*',
    regex: /description/i,
    patternLength: 11,
    category: 'text',
    fakerMethod: 'lorem.paragraph'
  },
  {
    id: 'notes',
    pattern: '*notes*',
    regex: /notes/i,
    patternLength: 5,
    category: 'text',
    fakerMethod: 'lorem.paragraph'
  }
];
```

---

## 3. 服務介面定義

### 3.1 IFieldPatternMatcher

```typescript
/**
 * 欄位模式匹配服務介面
 */
export interface IFieldPatternMatcher {
  /**
   * 匹配欄位名稱
   * @param columnName 欄位名稱
   * @returns 匹配結果
   */
  match(columnName: string): FieldMatchResult;
  
  /**
   * 取得所有已註冊的模式
   */
  getPatterns(): readonly FieldPattern[];
}
```

### 3.2 IFakerConfigService

```typescript
/**
 * Faker 設定服務介面
 */
export interface IFakerConfigService {
  /**
   * 取得當前設定
   */
  getConfig(): FakerConfig;
  
  /**
   * 檢查功能是否啟用
   */
  isEnabled(): boolean;
  
  /**
   * 取得當前語系
   */
  getLocale(): FakerLocale;
}
```

---

## 4. 現有型別擴展

### 4.1 ColumnMetadata（無需修改）

現有的 `ColumnMetadata` 介面已包含所需資訊（`name`, `dataType`, `maxLength`），無需修改。

---

## 5. 狀態轉換

本功能無狀態轉換需求。欄位模式匹配為純函式運算，Faker 設定由 VS Code 設定 API 管理。

---

## 6. 驗證規則

| 規則 | 說明 | 來源 |
|------|------|------|
| 語系有效性 | locale 必須為 'en' 或 'zh_TW'，否則退回 'en' | FR-004, Edge Case |
| 字串長度限制 | 產生的假資料不得超過欄位 maxLength | FR-007 |
| 模式優先順序 | 多模式匹配時採用最長匹配優先 | Edge Case |

---

## 7. 實體關係圖

```
┌─────────────────┐     ┌──────────────────┐
│  ColumnMetadata │     │   FakerConfig    │
├─────────────────┤     ├──────────────────┤
│ name            │     │ enabled          │
│ dataType        │     │ locale           │
│ maxLength       │     └────────┬─────────┘
└────────┬────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│           FakeDataService               │
├─────────────────────────────────────────┤
│ generateValue(column): string           │
└─────────────────────────────────────────┘
         │
         │ 1. 檢查設定
         │ 2. 嘗試模式匹配
         │ 3. 產生假資料 / 退回原邏輯
         ▼
┌─────────────────────────────────────────┐
│        FieldPatternMatcher              │
├─────────────────────────────────────────┤
│ match(columnName): FieldMatchResult     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          FieldPattern[]                 │
├─────────────────────────────────────────┤
│ pattern, regex, fakerMethod, category   │
└─────────────────────────────────────────┘
```
