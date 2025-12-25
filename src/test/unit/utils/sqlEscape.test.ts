import * as assert from 'assert';
import { escapeSqlString, formatValueForSql } from '../../../utils/sqlEscape';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { IQueryCell } from '../../../models/existingDataTypes';

suite('escapeSqlString', () => {
  test('should return empty string for empty input', () => {
    assert.strictEqual(escapeSqlString(''), '');
  });

  test('should return same string when no single quotes present', () => {
    assert.strictEqual(escapeSqlString('Hello World'), 'Hello World');
    assert.strictEqual(escapeSqlString('abc123'), 'abc123');
    assert.strictEqual(escapeSqlString('Test Value'), 'Test Value');
  });

  test('should escape single quote to double single quotes', () => {
    assert.strictEqual(escapeSqlString("O'Brien"), "O''Brien");
    assert.strictEqual(escapeSqlString("It's"), "It''s");
  });

  test('should escape multiple single quotes', () => {
    assert.strictEqual(escapeSqlString("'test'"), "''test''");
    assert.strictEqual(escapeSqlString("a'b'c"), "a''b''c");
  });

  test('should handle string with only single quotes', () => {
    assert.strictEqual(escapeSqlString("'"), "''");
    assert.strictEqual(escapeSqlString("'''"), "''''''");
  });

  test('should preserve other special characters', () => {
    assert.strictEqual(escapeSqlString('Hello\nWorld'), 'Hello\nWorld');
    assert.strictEqual(escapeSqlString('Tab\there'), 'Tab\there');
    assert.strictEqual(escapeSqlString('Back\\slash'), 'Back\\slash');
  });

  test('should handle alphanumeric strings (current fake data)', () => {
    // Current implementation generates only alphanumeric characters
    // This test ensures escaping doesn't affect such strings
    assert.strictEqual(escapeSqlString('abcABC123'), 'abcABC123');
    assert.strictEqual(escapeSqlString('XyZ789'), 'XyZ789');
  });
});

suite('formatValueForSql', () => {
  const createCell = (value: Partial<IQueryCell>): IQueryCell => ({
    displayValue: value.displayValue ?? '',
    isNull: value.isNull ?? false,
    invariantCultureDisplayValue: value.invariantCultureDisplayValue
  });

  const createColumn = (dataType: SqlDataType): ColumnMetadata => ({
    name: 'Col',
    dataType,
    maxLength: null,
    precision: null,
    scale: null,
    isNullable: true,
    isIdentity: false,
    isComputed: false
  });

  test('should return NULL when cell is null', () => {
    const cell = createCell({ isNull: true, displayValue: 'ignored' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.VARCHAR)), 'NULL');
  });

  test('should format varchar as quoted string and escape quotes', () => {
    const cell = createCell({ displayValue: "O'Brien" });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.VARCHAR)), "'O''Brien'");
  });

  test('should format nvarchar with N prefix', () => {
    const cell = createCell({ displayValue: '中文' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.NVARCHAR)), "N'中文'");
  });

  test('should format numbers without quotes (prefer invariantCultureDisplayValue)', () => {
    const cell = createCell({ displayValue: '123,45', invariantCultureDisplayValue: '123.45' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.DECIMAL)), '123.45');
  });

  test('should format datetime as quoted literal', () => {
    const cell = createCell({ displayValue: '2025-12-24T10:30:00' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.DATETIME2)), "'2025-12-24T10:30:00'");
  });

  test('should format bit as 0/1', () => {
    const trueCell = createCell({ displayValue: 'true' });
    const falseCell = createCell({ displayValue: 'false' });
    assert.strictEqual(formatValueForSql(trueCell, createColumn(SqlDataType.BIT)), '1');
    assert.strictEqual(formatValueForSql(falseCell, createColumn(SqlDataType.BIT)), '0');
  });

  test('should format uniqueidentifier as quoted literal', () => {
    const cell = createCell({ displayValue: 'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11' });
    assert.strictEqual(
      formatValueForSql(cell, createColumn(SqlDataType.UNIQUEIDENTIFIER)),
      "'A0EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'"
    );
  });

  test('should format varbinary as 0x hex literal', () => {
    const cell = createCell({ displayValue: '48656C6C6F' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.VARBINARY)), '0x48656C6C6F');
  });

  test('should keep existing 0x prefix for binary', () => {
    const cell = createCell({ displayValue: '0x48656C6C6F' });
    assert.strictEqual(formatValueForSql(cell, createColumn(SqlDataType.BINARY)), '0x48656C6C6F');
  });
});
