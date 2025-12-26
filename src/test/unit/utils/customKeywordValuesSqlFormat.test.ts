import * as assert from 'assert';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { SqlDataType } from '../../../models/sqlDataType';
import { formatCustomKeywordValueForSql } from '../../../utils/sqlEscape';

suite('customKeywordValues SQL format', () => {
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

  test('should format null as NULL', () => {
    assert.strictEqual(formatCustomKeywordValueForSql(null, createColumn(SqlDataType.VARCHAR)), 'NULL');
  });

  test('should format number without quotes', () => {
    assert.strictEqual(formatCustomKeywordValueForSql(123, createColumn(SqlDataType.INT)), '123');
  });

  test('should format string as quoted literal and escape quotes', () => {
    assert.strictEqual(
      formatCustomKeywordValueForSql("O'Brien", createColumn(SqlDataType.VARCHAR)),
      "'O''Brien'"
    );
  });

  test('should use N prefix for nvarchar', () => {
    assert.strictEqual(formatCustomKeywordValueForSql('中文', createColumn(SqlDataType.NVARCHAR)), "N'中文'");
  });

  test('should keep dangerous tokens as string literal', () => {
    assert.strictEqual(
      formatCustomKeywordValueForSql('1; DROP TABLE Users; --', createColumn(SqlDataType.VARCHAR)),
      "'1; DROP TABLE Users; --'"
    );
  });
});
