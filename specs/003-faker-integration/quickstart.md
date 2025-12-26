# Quickstart: 整合 Faker.js 提供更真實的假資料生成

## 開發環境設定

### 1. 安裝相依套件

```bash
# 安裝 Faker.js
npm install @faker-js/faker

# 安裝開發依賴（已存在則跳過）
npm install
```

### 2. 驗證 TypeScript 設定

確認 `tsconfig.json` 已啟用嚴格模式（專案已配置）：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## 主要修改檔案

### 新增檔案

| 檔案路徑 | 說明 |
|----------|------|
| `src/models/fieldPattern.ts` | 欄位模式型別定義 |
| `src/services/fieldPatternMatcher.ts` | 欄位名稱模式匹配服務 |
| `src/services/fakerConfigService.ts` | Faker 設定管理服務 |
| `src/test/unit/fieldPatternMatcher.test.ts` | 欄位模式匹配測試 |

### 修改檔案

| 檔案路徑 | 修改內容 |
|----------|----------|
| `package.json` | 新增 `@faker-js/faker` 依賴、VS Code 設定宣告 |
| `src/services/fakeDataService.ts` | 整合 Faker.js 與欄位模式匹配 |
| `src/models/index.ts` | 匯出新型別 |

---

## 開發流程

### Step 1: 新增型別定義

建立 `src/models/fieldPattern.ts`：

```typescript
export type FieldCategory = 'person' | 'contact' | 'location' | 'company' | 'internet' | 'text' | 'unknown';

export type FakerMethodId = 
  | 'person.firstName' | 'person.lastName' | 'person.fullName'
  | 'internet.email' | 'internet.url' | 'internet.username' | 'internet.password'
  | 'phone.number'
  | 'location.streetAddress' | 'location.city' | 'location.country'
  | 'company.name'
  | 'lorem.paragraph';

export interface FieldPattern {
  readonly id: string;
  readonly pattern: string;
  readonly regex: RegExp;
  readonly patternLength: number;
  readonly category: FieldCategory;
  readonly fakerMethod: FakerMethodId;
}

export interface FieldMatchResult {
  readonly matched: boolean;
  readonly pattern?: FieldPattern;
  readonly columnName: string;
}
```

### Step 2: 實作欄位模式匹配

建立 `src/services/fieldPatternMatcher.ts`：

```typescript
import { FieldPattern, FieldMatchResult, DEFAULT_FIELD_PATTERNS } from '../models/fieldPattern';

export class FieldPatternMatcher {
  private readonly patterns: readonly FieldPattern[];
  
  constructor(patterns: readonly FieldPattern[] = DEFAULT_FIELD_PATTERNS) {
    // 依模式長度降序排列，確保最長匹配優先
    this.patterns = [...patterns].sort((a, b) => b.patternLength - a.patternLength);
  }
  
  match(columnName: string): FieldMatchResult {
    const lowerName = columnName.toLowerCase();
    
    for (const pattern of this.patterns) {
      if (pattern.regex.test(lowerName)) {
        return { matched: true, pattern, columnName };
      }
    }
    
    return { matched: false, columnName };
  }
}
```

### Step 3: 實作設定服務

建立 `src/services/fakerConfigService.ts`：

```typescript
import * as vscode from 'vscode';
import { FakerConfig, FakerLocale, DEFAULT_FAKER_CONFIG } from '../models/fieldPattern';

export class FakerConfigService {
  getConfig(): FakerConfig {
    const config = vscode.workspace.getConfiguration('sqlDataSeeder.faker');
    return {
      enabled: config.get<boolean>('enabled', DEFAULT_FAKER_CONFIG.enabled),
      locale: this.validateLocale(config.get<string>('locale', DEFAULT_FAKER_CONFIG.locale))
    };
  }
  
  isEnabled(): boolean {
    return this.getConfig().enabled;
  }
  
  getLocale(): FakerLocale {
    return this.getConfig().locale;
  }
  
  private validateLocale(locale: string): FakerLocale {
    return locale === 'zh_TW' ? 'zh_TW' : 'en';
  }
}
```

### Step 4: 修改 FakeDataService

在 `src/services/fakeDataService.ts` 整合 Faker.js。

---

## 測試驗證

### 執行單元測試

```bash
npm run pretest
npm run test
```

### 手動測試步驟

1. 按 F5 啟動擴充套件偵錯
2. 連線至 SQL Server 資料庫
3. 在 Object Explorer 右鍵點擊資料表
4. 選擇「Generate Insert Scripts」
5. 驗證產生的 INSERT 語句中：
   - Email 欄位包含有效電子郵件格式
   - FirstName 欄位包含真實姓名
   - Phone 欄位包含電話號碼格式

### 設定切換測試

1. 開啟 VS Code 設定（Ctrl+,）
2. 搜尋「sqlDataSeeder.faker」
3. 切換 `enabled` 設定為 `false`
4. 重新產生 INSERT 語句，驗證退回使用隨機英數字串
5. 切換 `locale` 設定為 `zh_TW`
6. 重新產生 INSERT 語句，驗證姓名為繁體中文

---

## 常見問題

### Q: Webpack 打包時 Faker.js 過大？

Faker.js 包含所有語系資料。專案僅需 `en` 與 `zh_TW`，可透過 Webpack 設定優化：

```javascript
// webpack.config.js
resolve: {
  alias: {
    '@faker-js/faker': '@faker-js/faker/locale/en'
  }
}
```

但本專案選擇完整打包以確保功能完整性。

### Q: 如何新增支援的欄位模式？

在 `DEFAULT_FIELD_PATTERNS` 陣列中新增 `FieldPattern` 物件：

```typescript
{
  id: 'newpattern',
  pattern: '*newpattern*',
  regex: /newpattern/i,
  patternLength: 10,
  category: 'text',
  fakerMethod: 'lorem.paragraph'
}
```

### Q: 如何支援新語系？

1. 在 `FakerLocale` 型別新增語系代碼
2. 修改 `package.json` 設定 enum
3. 更新 `createFakerInstance()` 函式
