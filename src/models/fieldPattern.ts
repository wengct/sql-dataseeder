/**
 * 欄位語意類別
 * 用於分類欄位名稱模式對應的假資料類型
 */
export type FieldCategory =
  | 'person'
  | 'contact'
  | 'location'
  | 'company'
  | 'internet'
  | 'text'
  | 'unknown';

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

/**
 * 欄位名稱模式定義
 */
export interface FieldPattern {
  readonly id: string;
  readonly pattern: string;
  readonly regex: RegExp;
  readonly patternLength: number;
  readonly category: FieldCategory;
  readonly fakerMethod: FakerMethodId;
}

/**
 * 欄位名稱匹配結果
 */
export interface FieldMatchResult {
  readonly matched: boolean;
  readonly pattern?: FieldPattern;
  readonly columnName: string;
}

/**
 * Faker.js 功能設定
 */
export interface FakerConfig {
  readonly enabled: boolean;
  readonly locale: FakerLocale;
}

/**
 * 支援的語系
 */
export type FakerLocale = 'en' | 'zh_TW';

export const DEFAULT_FAKER_CONFIG: FakerConfig = {
  enabled: true,
  locale: 'en'
};

/**
 * 預設欄位模式對應表（依 spec FR-002）
 */
export const DEFAULT_FIELD_PATTERNS: readonly FieldPattern[] = [
  // Person
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
    id: 'fullname',
    pattern: '*fullname*',
    regex: /fullname/i,
    patternLength: 8,
    category: 'person',
    fakerMethod: 'person.fullName'
  },

  // Contact
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

  // Location
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

  // Company
  {
    id: 'company',
    pattern: '*company*',
    regex: /company/i,
    patternLength: 7,
    category: 'company',
    fakerMethod: 'company.name'
  },

  // Internet
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

  // Text
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
