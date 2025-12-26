# VS Code Configuration Contract

本功能透過 VS Code 設定系統提供 API，無傳統 REST/GraphQL 端點。

## Configuration Schema (package.json)

```json
{
  "contributes": {
    "configuration": {
      "title": "SQL DataSeeder",
      "properties": {
        "sqlDataSeeder.faker.enabled": {
          "type": "boolean",
          "default": true,
          "description": "啟用智慧假資料產生功能。啟用後，系統會根據欄位名稱自動產生語意相符的假資料（如 Email、姓名、電話等）。",
          "scope": "resource"
        },
        "sqlDataSeeder.faker.locale": {
          "type": "string",
          "enum": ["en", "zh_TW"],
          "enumDescriptions": [
            "English - 產生英文假資料",
            "繁體中文 - 產生繁體中文假資料"
          ],
          "default": "en",
          "description": "假資料產生使用的語系。影響姓名、地址等資料的語言與格式。",
          "scope": "resource"
        }
      }
    }
  }
}
```

## TypeScript API

### FakerConfigService

```typescript
/**
 * 取得 Faker 功能設定
 */
interface FakerConfigService {
  /**
   * 取得完整設定
   * @returns FakerConfig 物件
   */
  getConfig(): FakerConfig;
  
  /**
   * 檢查功能是否啟用
   * @returns boolean
   */
  isEnabled(): boolean;
  
  /**
   * 取得當前語系
   * @returns 'en' | 'zh_TW'
   */
  getLocale(): FakerLocale;
}
```

### FieldPatternMatcher

```typescript
/**
 * 欄位模式匹配服務
 */
interface FieldPatternMatcher {
  /**
   * 匹配欄位名稱至對應的假資料模式
   * 
   * @param columnName - 欄位名稱（大小寫不敏感）
   * @returns FieldMatchResult 物件
   * 
   * @example
   * matcher.match('UserEmail')
   * // => { matched: true, pattern: { fakerMethod: 'internet.email', ... }, columnName: 'UserEmail' }
   * 
   * @example
   * matcher.match('XYZ123')
   * // => { matched: false, columnName: 'XYZ123' }
   */
  match(columnName: string): FieldMatchResult;
}
```

## Settings Flow

```
┌──────────────────────┐
│  VS Code Settings    │
│  (settings.json)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  vscode.workspace    │
│  .getConfiguration() │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ FakerConfigService   │
│ - getConfig()        │
│ - isEnabled()        │
│ - getLocale()        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  FakeDataService     │
│  (使用設定產生資料)  │
└──────────────────────┘
```

## Error Handling

| 情境 | 處理方式 |
|------|----------|
| 無效語系值 | 退回使用 'en' |
| 設定讀取失敗 | 使用預設值 `{ enabled: true, locale: 'en' }` |

## Configuration Change Detection

使用 `vscode.workspace.onDidChangeConfiguration` 監聽設定變更，無需重啟擴充套件即可生效。

```typescript
vscode.workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('sqlDataSeeder.faker')) {
    // 重新載入設定
    this.reloadConfig();
  }
});
```
