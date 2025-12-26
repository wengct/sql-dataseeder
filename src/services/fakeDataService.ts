import { Faker, base, en, zh_TW } from '@faker-js/faker';
import { ColumnMetadata } from '../models/columnMetadata';
import { FakerLocale, FakerMethodId } from '../models/fieldPattern';
import { SqlDataType, SUPPORTED_DATA_TYPES, parseSqlDataType } from '../models/sqlDataType';
import { escapeSqlString } from '../utils/sqlEscape';
import { FakerConfigService } from './fakerConfigService';
import { FieldPatternMatcher } from './fieldPatternMatcher';

/**
 * 假資料產生服務
 * 負責產生符合欄位定義的假資料
 */
export class FakeDataService {
  /** 英數字元集 (a-zA-Z0-9) */
  private static readonly ALPHANUMERIC_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  /** varchar(max) 的預設最大長度 */
  private static readonly DEFAULT_MAX_STRING_LENGTH = 100;

  /** 預設字串長度 */
  private static readonly DEFAULT_STRING_LENGTH = 10;

  private readonly fieldPatternMatcher: Pick<FieldPatternMatcher, 'match'>;
  private readonly fakerConfigService: Pick<FakerConfigService, 'isEnabled' | 'getLocale'>;
  private readonly fakerFactory: (locale: FakerLocale) => Faker;
  private readonly fakerCache = new Map<FakerLocale, Faker>();

  constructor(
    fieldPatternMatcher: Pick<FieldPatternMatcher, 'match'> = new FieldPatternMatcher(),
    fakerConfigService: Pick<FakerConfigService, 'isEnabled' | 'getLocale'> = new FakerConfigService(),
    fakerFactory: (locale: FakerLocale) => Faker = FakeDataService.createFakerInstance
  ) {
    this.fieldPatternMatcher = fieldPatternMatcher;
    this.fakerConfigService = fakerConfigService;
    this.fakerFactory = fakerFactory;
  }

  /**
   * 為指定欄位產生假資料
   * @param column 欄位結構資訊
   * @returns 假資料值（已格式化為 SQL 語法）
   */
  generateValue(column: ColumnMetadata): string {
    switch (column.dataType) {
      // 字串類型
      case SqlDataType.VARCHAR:
        return this.generateVarcharValue(column);
      case SqlDataType.NVARCHAR:
        return this.generateNvarcharValue(column);
      case SqlDataType.CHAR:
        return this.generateCharValue(column);
      case SqlDataType.NCHAR:
        return this.generateNcharValue(column);

      // 整數類型
      case SqlDataType.INT:
        return this.generateIntValue();
      case SqlDataType.BIGINT:
        return this.generateBigintValue();
      case SqlDataType.SMALLINT:
        return this.generateSmallintValue();
      case SqlDataType.TINYINT:
        return this.generateTinyintValue();

      // 浮點數類型
      case SqlDataType.DECIMAL:
      case SqlDataType.NUMERIC:
        return this.generateDecimalValue(column.precision, column.scale);
      case SqlDataType.FLOAT:
        return this.generateFloatValue();
      case SqlDataType.REAL:
        return this.generateRealValue();

      // 日期時間類型
      case SqlDataType.DATETIME:
      case SqlDataType.DATETIME2:
        return this.generateDatetimeValue();
      case SqlDataType.DATE:
        return this.generateDateValue();
      case SqlDataType.TIME:
        return this.generateTimeValue();

      // 其他類型
      case SqlDataType.BIT:
        return this.generateBitValue();
      case SqlDataType.UNIQUEIDENTIFIER:
        return this.generateUniqueidentifierValue();
      case SqlDataType.BINARY:
      case SqlDataType.VARBINARY:
        return this.generateBinaryValue(column.maxLength);

      default:
        // 不應該執行到這裡，因為 UNSUPPORTED 類型應該在呼叫前被過濾
        return 'NULL';
    }
  }

  /**
   * 檢查資料類型是否支援
   * @param dataType 資料類型名稱
   * @returns 是否支援
   */
  isSupported(dataType: string): boolean {
    const parsed = parseSqlDataType(dataType);
    return SUPPORTED_DATA_TYPES.includes(parsed);
  }

  // ============================================
  // 字串類型產生器
  // ============================================

  private generateVarcharValue(column: ColumnMetadata): string {
    const fakerValue = this.tryGenerateFakerValue(column);
    if (fakerValue !== null) {
      const value = this.truncateToMaxLength(fakerValue, column.maxLength);
      return `'${escapeSqlString(value)}'`;
    }

    const length = this.calculateStringLength(column.maxLength, false);
    const value = this.generateRandomString(length);
    return `'${escapeSqlString(value)}'`;
  }

  private generateNvarcharValue(column: ColumnMetadata): string {
    const fakerValue = this.tryGenerateFakerValue(column);
    if (fakerValue !== null) {
      const value = this.truncateToMaxLength(fakerValue, column.maxLength);
      return `N'${escapeSqlString(value)}'`;
    }

    const length = this.calculateStringLength(column.maxLength, false);
    const value = this.generateRandomString(length);
    return `N'${escapeSqlString(value)}'`;
  }

  private generateCharValue(column: ColumnMetadata): string {
    const length = this.calculateStringLength(column.maxLength, true);
    const value = this.generateRandomString(length);
    return `'${escapeSqlString(value)}'`;
  }

  private generateNcharValue(column: ColumnMetadata): string {
    const length = this.calculateStringLength(column.maxLength, true);
    const value = this.generateRandomString(length);
    return `N'${escapeSqlString(value)}'`;
  }

  private getFaker(locale: FakerLocale): Faker {
    const cached = this.fakerCache.get(locale);
    if (cached) {
      return cached;
    }

    const faker = this.fakerFactory(locale);
    this.fakerCache.set(locale, faker);
    return faker;
  }

  private tryGenerateFakerValue(column: ColumnMetadata): string | null {
    if (!this.fakerConfigService.isEnabled()) {
      return null;
    }

    const matchResult = this.fieldPatternMatcher.match(column.name);
    if (!matchResult.matched || !matchResult.pattern) {
      return null;
    }

    const locale = this.fakerConfigService.getLocale();
    const faker = this.getFaker(locale);
    return this.generateValueByFakerMethod(faker, matchResult.pattern.fakerMethod, locale);
  }

  private truncateToMaxLength(value: string, maxLength: number | null): string {
    const effectiveMaxLength =
      maxLength === null
        ? FakeDataService.DEFAULT_STRING_LENGTH
        : maxLength === -1
          ? FakeDataService.DEFAULT_MAX_STRING_LENGTH
          : maxLength;

    return value.length > effectiveMaxLength ? value.substring(0, effectiveMaxLength) : value;
  }

  private static createFakerInstance(locale: FakerLocale): Faker {
    const localeData = locale === 'zh_TW' ? [zh_TW, en, base] : [en, base];
    return new Faker({ locale: localeData });
  }

  private generateValueByFakerMethod(faker: Faker, method: FakerMethodId, locale: FakerLocale): string {
    switch (method) {
      case 'person.firstName':
        return faker.person.firstName();
      case 'person.lastName':
        return faker.person.lastName();
      case 'person.fullName':
        return faker.person.fullName();
      case 'internet.email':
        return faker.internet.email();
      case 'phone.number':
        return faker.phone.number();
      case 'location.streetAddress':
        return faker.location.streetAddress();
      case 'location.city':
        return faker.location.city();
      case 'location.country':
        return faker.location.country();
      case 'company.name':
        return faker.company.name();
      case 'internet.url':
        return faker.internet.url();
      case 'internet.username':
        // zh_TW 的 username 常產生英文/無意義字串；改用中文姓名更符合「使用者名稱」欄位期待
        return locale === 'zh_TW' ? faker.person.fullName() : faker.internet.username();
      case 'internet.password':
        return faker.internet.password();
      case 'lorem.paragraph':
        return faker.lorem.paragraph();
    }
  }

  /**
   * 計算字串長度
   * @param maxLength 最大長度（-1 表示 MAX，null 表示未指定）
   * @param isFixedLength 是否為固定長度類型 (char/nchar)
   */
  private calculateStringLength(maxLength: number | null, isFixedLength: boolean): number {
    if (maxLength === null) {
      return FakeDataService.DEFAULT_STRING_LENGTH;
    }

    if (maxLength === -1) {
      // varchar(max) / nvarchar(max)
      return FakeDataService.DEFAULT_MAX_STRING_LENGTH;
    }

    if (isFixedLength) {
      // char/nchar 需要剛好的長度
      return maxLength;
    }

    // varchar/nvarchar 取 min(maxLength, DEFAULT_STRING_LENGTH)
    return Math.min(maxLength, FakeDataService.DEFAULT_STRING_LENGTH);
  }

  /**
   * 產生隨機英數字串
   */
  private generateRandomString(length: number): string {
    let result = '';
    const chars = FakeDataService.ALPHANUMERIC_CHARS;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ============================================
  // 整數類型產生器
  // ============================================

  private generateIntValue(): string {
    // int: -2,147,483,648 to 2,147,483,647
    // 只產生正數以簡化
    const value = Math.floor(Math.random() * 2147483647);
    return value.toString();
  }

  private generateBigintValue(): string {
    // bigint: 超出 JS Number 安全範圍，使用較小範圍
    const value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    return value.toString();
  }

  private generateSmallintValue(): string {
    // smallint: -32,768 to 32,767
    const value = Math.floor(Math.random() * 32767);
    return value.toString();
  }

  private generateTinyintValue(): string {
    // tinyint: 0 to 255
    const value = Math.floor(Math.random() * 256);
    return value.toString();
  }

  // ============================================
  // 浮點數類型產生器
  // ============================================

  private generateDecimalValue(precision: number | null, scale: number | null): string {
    const p = precision ?? 18;
    const s = scale ?? 2;

    // 整數部分最大位數
    const integerDigits = p - s;

    // 產生整數部分
    const maxInteger = Math.pow(10, Math.min(integerDigits, 9)) - 1;
    const integerPart = Math.floor(Math.random() * maxInteger);

    if (s === 0) {
      return integerPart.toString();
    }

    // 產生小數部分
    const maxDecimal = Math.pow(10, s) - 1;
    const decimalPart = Math.floor(Math.random() * maxDecimal);

    return `${integerPart}.${decimalPart.toString().padStart(s, '0')}`;
  }

  private generateFloatValue(): string {
    const value = Math.random() * 10000;
    return value.toFixed(4);
  }

  private generateRealValue(): string {
    const value = Math.random() * 1000;
    return value.toFixed(2);
  }

  // ============================================
  // 日期時間類型產生器
  // ============================================

  private generateDatetimeValue(): string {
    const date = this.generateRandomDateWithinPastYear();
    const isoString = date.toISOString().replace('T', ' ').substring(0, 23);
    return `'${isoString}'`;
  }

  private generateDateValue(): string {
    const date = this.generateRandomDateWithinPastYear();
    const dateString = date.toISOString().substring(0, 10);
    return `'${dateString}'`;
  }

  private generateTimeValue(): string {
    const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    const seconds = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    return `'${hours}:${minutes}:${seconds}'`;
  }

  /**
   * 產生過去 365 天內的隨機日期
   */
  private generateRandomDateWithinPastYear(): Date {
    const now = new Date();
    const pastYear = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds
    const randomTime = Math.floor(Math.random() * pastYear);
    return new Date(now.getTime() - randomTime);
  }

  // ============================================
  // 其他類型產生器
  // ============================================

  private generateBitValue(): string {
    return Math.random() < 0.5 ? '0' : '1';
  }

  private generateUniqueidentifierValue(): string {
    const uuid = this.generateUUID();
    return `'${uuid}'`;
  }

  private generateBinaryValue(maxLength: number | null): string {
    const byteLength = maxLength === null || maxLength === -1 ? 8 : Math.max(1, Math.min(maxLength, 8));
    let hex = '';
    for (let i = 0; i < byteLength; i++) {
      hex += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    }
    return `0x${hex}`;
  }

  /**
   * 產生 UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
