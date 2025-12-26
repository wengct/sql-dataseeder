import * as assert from 'assert';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { SqlDataType } from '../../../models/sqlDataType';
import { FakeDataService } from '../../../services/fakeDataService';
import { FieldPatternMatcher } from '../../../services/fieldPatternMatcher';

suite('FakeDataService', () => {
  let service: FakeDataService;

  setup(() => {
    service = new FakeDataService();
  });

  const createColumn = (
    dataType: SqlDataType,
    options: Partial<ColumnMetadata> = {}
  ): ColumnMetadata => ({
    name: options.name ?? 'TestColumn',
    dataType,
    maxLength: options.maxLength ?? null,
    precision: options.precision ?? null,
    scale: options.scale ?? null,
    isNullable: options.isNullable ?? false,
    isIdentity: options.isIdentity ?? false,
    isComputed: options.isComputed ?? false
  });

  suite('String types', () => {
    test('should generate varchar value with correct length', () => {
      const column = createColumn(SqlDataType.VARCHAR, { maxLength: 10 });
      const value = service.generateValue(column);

      // Should be quoted string
      assert.ok(value.startsWith("'"), 'Should start with single quote');
      assert.ok(value.endsWith("'"), 'Should end with single quote');

      // Extract inner value
      const innerValue = value.slice(1, -1);
      assert.ok(innerValue.length <= 10, `Length ${innerValue.length} should be <= 10`);
      assert.ok(innerValue.length > 0, 'Should not be empty');
    });

    test('should generate nvarchar value', () => {
      const column = createColumn(SqlDataType.NVARCHAR, { maxLength: 50 });
      const value = service.generateValue(column);

      assert.ok(value.startsWith("N'"), 'nvarchar should start with N\'');
      assert.ok(value.endsWith("'"), 'Should end with single quote');
    });

    test('should generate char value with exact length', () => {
      const column = createColumn(SqlDataType.CHAR, { maxLength: 5 });
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      assert.strictEqual(innerValue.length, 5, 'char should have exact length');
    });

    test('should generate nchar value with exact length', () => {
      const column = createColumn(SqlDataType.NCHAR, { maxLength: 5 });
      const value = service.generateValue(column);

      // N'xxxxx'
      const innerValue = value.slice(2, -1);
      assert.strictEqual(innerValue.length, 5, 'nchar should have exact length');
    });

    test('should use alphanumeric characters only (a-zA-Z0-9)', () => {
      const column = createColumn(SqlDataType.VARCHAR, { maxLength: 100 });

      // Generate multiple values to test randomness
      for (let i = 0; i < 10; i++) {
        const value = service.generateValue(column);
        const innerValue = value.slice(1, -1);
        assert.ok(
          /^[a-zA-Z0-9]*$/.test(innerValue),
          `Value "${innerValue}" should only contain alphanumeric characters`
        );
      }
    });

    test('should handle varchar(max) with default length', () => {
      const column = createColumn(SqlDataType.VARCHAR, { maxLength: -1 });
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      // Default max length for varchar(max) should be reasonable (e.g., 100)
      assert.ok(innerValue.length <= 100, 'varchar(max) should use default max length');
      assert.ok(innerValue.length > 0, 'Should not be empty');
    });
  });

  suite('Faker integration', () => {
    test('should override faker value when custom keyword value matches', () => {
      const stubFaker = {
        internet: {
          email: () => 'john@example.com',
          url: () => 'https://example.com',
          username: () => 'john_doe',
          password: () => 'p@ssw0rd'
        },
        person: {
          firstName: () => 'John',
          lastName: () => 'Doe',
          fullName: () => 'John Doe'
        },
        phone: { number: () => '555-1234' },
        location: {
          streetAddress: () => '123 Main St',
          city: () => 'Taipei',
          country: () => 'Taiwan'
        },
        company: { name: () => 'Acme Corp' },
        lorem: { paragraph: () => 'Lorem ipsum' }
      } as any;

      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => true, getLocale: () => 'en' as const };
      const fakerFactory = () => stubFaker;
      const customKeywordValuesConfigService = {
        getConfig: () => ({
          rules: [{ pattern: 'email', matchType: 'literal', value: 'FIXED' }],
          warnings: []
        })
      };

      const fakerService = new FakeDataService(
        matcher,
        config as any,
        fakerFactory as any,
        customKeywordValuesConfigService as any
      );

      const column = createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 100 });
      const value = fakerService.generateValue(column);

      assert.strictEqual(value, "'FIXED'");
    });

    test('should not change existing behavior when rules are empty', () => {
      const stubFaker = {
        internet: {
          email: () => 'john@example.com',
          url: () => 'https://example.com',
          username: () => 'john_doe',
          password: () => 'p@ssw0rd'
        },
        person: {
          firstName: () => 'John',
          lastName: () => 'Doe',
          fullName: () => 'John Doe'
        },
        phone: { number: () => '555-1234' },
        location: {
          streetAddress: () => '123 Main St',
          city: () => 'Taipei',
          country: () => 'Taiwan'
        },
        company: { name: () => 'Acme Corp' },
        lorem: { paragraph: () => 'Lorem ipsum' }
      } as any;

      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => true, getLocale: () => 'en' as const };
      const fakerFactory = () => stubFaker;
      const customKeywordValuesConfigService = {
        getConfig: () => ({ rules: [], warnings: [] })
      };

      const fakerService = new FakeDataService(
        matcher,
        config as any,
        fakerFactory as any,
        customKeywordValuesConfigService as any
      );

      const column = createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 100 });
      const value = fakerService.generateValue(column);

      assert.strictEqual(value, "'john@example.com'");
    });

    test('should use faker value when enabled and column name matches', () => {
      const stubFaker = {
        internet: {
          email: () => 'john@example.com',
          url: () => 'https://example.com',
          username: () => 'john_doe',
          password: () => 'p@ssw0rd'
        },
        person: {
          firstName: () => 'John',
          lastName: () => 'Doe',
          fullName: () => 'John Doe'
        },
        phone: { number: () => '555-1234' },
        location: {
          streetAddress: () => '123 Main St',
          city: () => 'Taipei',
          country: () => 'Taiwan'
        },
        company: { name: () => 'Acme Corp' },
        lorem: { paragraph: () => 'Lorem ipsum' }
      } as any;

      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => true, getLocale: () => 'en' as const };
      const fakerFactory = () => stubFaker;
      const fakerService = new FakeDataService(matcher, config as any, fakerFactory as any);

      const column = createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 100 });
      const value = fakerService.generateValue(column);

      assert.strictEqual(value, "'john@example.com'");
    });

    test('should truncate faker value to maxLength', () => {
      const stubFaker = {
        internet: { email: () => 'averylongemail@example.com' },
        person: { firstName: () => 'John', lastName: () => 'Doe', fullName: () => 'John Doe' },
        phone: { number: () => '555-1234' },
        location: { streetAddress: () => '123 Main St', city: () => 'Taipei', country: () => 'Taiwan' },
        company: { name: () => 'Acme Corp' },
        lorem: { paragraph: () => 'Lorem ipsum' }
      } as any;

      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => true, getLocale: () => 'en' as const };
      const fakerService = new FakeDataService(matcher, config as any, (() => stubFaker) as any);

      const column = createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 5 });
      const value = fakerService.generateValue(column);

      assert.strictEqual(value, "'avery'");
    });

    test('should skip faker generation when disabled', () => {
      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => false, getLocale: () => 'en' as const };
      const fakerFactory = () => {
        throw new Error('fakerFactory should not be called when disabled');
      };
      const fakerService = new FakeDataService(matcher, config as any, fakerFactory as any);

      const column = createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 100 });
      const value = fakerService.generateValue(column);

      assert.ok(!value.includes('@'), 'Fallback random string should not include @');
    });

    test('should not throw when invalid rules exist', () => {
      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => false, getLocale: () => 'en' as const };
      const customKeywordValuesConfigService = {
        getConfig: () => ({
          rules: [{ pattern: '[', matchType: 'regex', value: 1 }],
          warnings: []
        })
      };

      const serviceWithInvalidRules = new FakeDataService(
        matcher,
        config as any,
        (() => ({}) as any) as any,
        customKeywordValuesConfigService as any
      );

      const column = createColumn(SqlDataType.INT, { name: 'Is_Active' });
      const value = serviceWithInvalidRules.generateValue(column);
      assert.ok(typeof value === 'string' && value.length > 0);
    });

    test('should request faker instance using configured locale', () => {
      const matcher = new FieldPatternMatcher();
      const config = { isEnabled: () => true, getLocale: () => 'zh_TW' as const };
      let requestedLocale: string | null = null;

      const stubFaker = {
        internet: { email: () => 'john@example.com' },
        person: { firstName: () => 'John', lastName: () => 'Doe', fullName: () => 'John Doe' },
        phone: { number: () => '555-1234' },
        location: { streetAddress: () => '123 Main St', city: () => 'Taipei', country: () => 'Taiwan' },
        company: { name: () => 'Acme Corp' },
        lorem: { paragraph: () => 'Lorem ipsum' }
      } as any;

      const fakerFactory = (locale: string) => {
        requestedLocale = locale;
        return stubFaker;
      };

      const fakerService = new FakeDataService(matcher, config as any, fakerFactory as any);
      fakerService.generateValue(createColumn(SqlDataType.VARCHAR, { name: 'Email', maxLength: 100 }));

      assert.strictEqual(requestedLocale, 'zh_TW');
    });
  });

  suite('Integer types', () => {
    test('should generate int value', () => {
      const column = createColumn(SqlDataType.INT);
      const value = service.generateValue(column);

      const num = parseInt(value, 10);
      assert.ok(!isNaN(num), 'Should be a valid integer');
      assert.ok(num >= 0, 'Should be non-negative');
      assert.ok(num <= 2147483647, 'Should be within int range');
    });

    test('should generate bigint value', () => {
      const column = createColumn(SqlDataType.BIGINT);
      const value = service.generateValue(column);

      const num = parseInt(value, 10);
      assert.ok(!isNaN(num), 'Should be a valid integer');
    });

    test('should generate smallint value', () => {
      const column = createColumn(SqlDataType.SMALLINT);
      const value = service.generateValue(column);

      const num = parseInt(value, 10);
      assert.ok(!isNaN(num), 'Should be a valid integer');
      assert.ok(num >= 0 && num <= 32767, 'Should be within smallint range');
    });

    test('should generate tinyint value', () => {
      const column = createColumn(SqlDataType.TINYINT);
      const value = service.generateValue(column);

      const num = parseInt(value, 10);
      assert.ok(!isNaN(num), 'Should be a valid integer');
      assert.ok(num >= 0 && num <= 255, 'Should be within tinyint range');
    });
  });

  suite('Decimal types', () => {
    test('should generate decimal value with precision and scale', () => {
      const column = createColumn(SqlDataType.DECIMAL, { precision: 10, scale: 2 });
      const value = service.generateValue(column);

      const num = parseFloat(value);
      assert.ok(!isNaN(num), 'Should be a valid number');

      // Check decimal places
      const parts = value.split('.');
      if (parts.length === 2) {
        assert.ok(parts[1].length <= 2, 'Should have at most 2 decimal places');
      }
    });

    test('should generate numeric value', () => {
      const column = createColumn(SqlDataType.NUMERIC, { precision: 18, scale: 4 });
      const value = service.generateValue(column);

      const num = parseFloat(value);
      assert.ok(!isNaN(num), 'Should be a valid number');
    });

    test('should generate float value', () => {
      const column = createColumn(SqlDataType.FLOAT);
      const value = service.generateValue(column);

      const num = parseFloat(value);
      assert.ok(!isNaN(num), 'Should be a valid number');
    });

    test('should generate real value', () => {
      const column = createColumn(SqlDataType.REAL);
      const value = service.generateValue(column);

      const num = parseFloat(value);
      assert.ok(!isNaN(num), 'Should be a valid number');
    });
  });

  suite('DateTime types', () => {
    test('should generate datetime value in ISO format', () => {
      const column = createColumn(SqlDataType.DATETIME);
      const value = service.generateValue(column);

      assert.ok(value.startsWith("'"), 'Should be quoted');
      assert.ok(value.endsWith("'"), 'Should be quoted');

      // Should be parseable as date
      const innerValue = value.slice(1, -1);
      const date = new Date(innerValue);
      assert.ok(!isNaN(date.getTime()), 'Should be a valid date');
    });

    test('should generate datetime2 value', () => {
      const column = createColumn(SqlDataType.DATETIME2);
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      const date = new Date(innerValue);
      assert.ok(!isNaN(date.getTime()), 'Should be a valid date');
    });

    test('should generate date value (date only, no time)', () => {
      const column = createColumn(SqlDataType.DATE);
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      // Should match YYYY-MM-DD format
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(innerValue), `Date format should be YYYY-MM-DD, got: ${innerValue}`);
    });

    test('should generate time value (time only, no date)', () => {
      const column = createColumn(SqlDataType.TIME);
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      // Should match HH:MM:SS format
      assert.ok(/^\d{2}:\d{2}:\d{2}$/.test(innerValue), `Time format should be HH:MM:SS, got: ${innerValue}`);
    });

    test('should generate datetime within past 365 days', () => {
      const column = createColumn(SqlDataType.DATETIME);
      const value = service.generateValue(column);

      const innerValue = value.slice(1, -1);
      const date = new Date(innerValue);
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      assert.ok(date >= oneYearAgo, 'Date should be within past year');
      assert.ok(date <= now, 'Date should not be in future');
    });
  });

  suite('Other types', () => {
    test('should generate bit value (0 or 1)', () => {
      const column = createColumn(SqlDataType.BIT);

      // Generate multiple values to ensure we get both 0 and 1
      const values = new Set<string>();
      for (let i = 0; i < 20; i++) {
        values.add(service.generateValue(column));
      }

      assert.ok(values.has('0') || values.has('1'), 'Should generate 0 or 1');
      // Each individual value should be 0 or 1
      for (const v of values) {
        assert.ok(v === '0' || v === '1', `Bit value should be 0 or 1, got: ${v}`);
      }
    });

    test('should generate uniqueidentifier value (UUID format)', () => {
      const column = createColumn(SqlDataType.UNIQUEIDENTIFIER);
      const value = service.generateValue(column);

      assert.ok(value.startsWith("'"), 'Should be quoted');
      assert.ok(value.endsWith("'"), 'Should be quoted');

      const innerValue = value.slice(1, -1);
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      assert.ok(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(innerValue),
        `Should be valid UUID format, got: ${innerValue}`
      );
    });
  });

  suite('isSupported', () => {
    test('should return true for all supported types', () => {
      const supportedTypes = [
        'varchar', 'nvarchar', 'char', 'nchar',
        'int', 'bigint', 'smallint', 'tinyint',
        'decimal', 'numeric', 'float', 'real',
        'datetime', 'datetime2', 'date', 'time',
        'bit', 'uniqueidentifier', 'binary', 'varbinary'
      ];

      for (const type of supportedTypes) {
        assert.ok(service.isSupported(type), `${type} should be supported`);
      }
    });

    test('should return false for unsupported types', () => {
      const unsupportedTypes = [
        'geography', 'geometry', 'xml',
        'image', 'text', 'ntext', 'sql_variant',
        'hierarchyid', 'timestamp', 'rowversion'
      ];

      for (const type of unsupportedTypes) {
        assert.ok(!service.isSupported(type), `${type} should not be supported`);
      }
    });

    test('should be case-insensitive', () => {
      assert.ok(service.isSupported('VARCHAR'), 'Should handle uppercase');
      assert.ok(service.isSupported('VarChar'), 'Should handle mixed case');
    });
  });

  suite('Edge cases', () => {
    test('should handle null maxLength for string types', () => {
      const column = createColumn(SqlDataType.VARCHAR, { maxLength: null });
      const value = service.generateValue(column);

      assert.ok(value.startsWith("'"), 'Should still generate quoted string');
    });

    test('should handle zero precision for decimal', () => {
      const column = createColumn(SqlDataType.DECIMAL, { precision: 0, scale: 0 });
      const value = service.generateValue(column);

      const num = parseFloat(value);
      assert.ok(!isNaN(num), 'Should be a valid number');
    });
  });
});
