import * as assert from 'assert';
import { SqlDataType, SUPPORTED_DATA_TYPES, parseSqlDataType } from '../../../models/sqlDataType';

suite('SqlDataType', () => {
  suite('SqlDataType enum', () => {
    test('should have all string types defined', () => {
      assert.strictEqual(SqlDataType.VARCHAR, 'varchar');
      assert.strictEqual(SqlDataType.NVARCHAR, 'nvarchar');
      assert.strictEqual(SqlDataType.CHAR, 'char');
      assert.strictEqual(SqlDataType.NCHAR, 'nchar');
    });

    test('should have all integer types defined', () => {
      assert.strictEqual(SqlDataType.INT, 'int');
      assert.strictEqual(SqlDataType.BIGINT, 'bigint');
      assert.strictEqual(SqlDataType.SMALLINT, 'smallint');
      assert.strictEqual(SqlDataType.TINYINT, 'tinyint');
    });

    test('should have all decimal types defined', () => {
      assert.strictEqual(SqlDataType.DECIMAL, 'decimal');
      assert.strictEqual(SqlDataType.NUMERIC, 'numeric');
      assert.strictEqual(SqlDataType.FLOAT, 'float');
      assert.strictEqual(SqlDataType.REAL, 'real');
    });

    test('should have all datetime types defined', () => {
      assert.strictEqual(SqlDataType.DATETIME, 'datetime');
      assert.strictEqual(SqlDataType.DATETIME2, 'datetime2');
      assert.strictEqual(SqlDataType.DATE, 'date');
      assert.strictEqual(SqlDataType.TIME, 'time');
    });

    test('should have other supported types defined', () => {
      assert.strictEqual(SqlDataType.BIT, 'bit');
      assert.strictEqual(SqlDataType.UNIQUEIDENTIFIER, 'uniqueidentifier');
    });

    test('should have UNSUPPORTED type defined', () => {
      assert.strictEqual(SqlDataType.UNSUPPORTED, 'unsupported');
    });
  });

  suite('SUPPORTED_DATA_TYPES', () => {
    test('should contain all supported types except UNSUPPORTED', () => {
      const expectedTypes = [
        'varchar', 'nvarchar', 'char', 'nchar',
        'int', 'bigint', 'smallint', 'tinyint',
        'decimal', 'numeric', 'float', 'real',
        'datetime', 'datetime2', 'date', 'time',
        'bit', 'uniqueidentifier'
      ];
      
      for (const type of expectedTypes) {
        assert.ok(
          SUPPORTED_DATA_TYPES.includes(type as SqlDataType),
          `${type} should be in SUPPORTED_DATA_TYPES`
        );
      }
    });

    test('should not contain UNSUPPORTED type', () => {
      assert.ok(
        !SUPPORTED_DATA_TYPES.includes(SqlDataType.UNSUPPORTED),
        'UNSUPPORTED should not be in SUPPORTED_DATA_TYPES'
      );
    });

    test('should have exactly 18 supported types', () => {
      assert.strictEqual(SUPPORTED_DATA_TYPES.length, 18);
    });
  });

  suite('parseSqlDataType', () => {
    test('should parse known types correctly', () => {
      assert.strictEqual(parseSqlDataType('varchar'), SqlDataType.VARCHAR);
      assert.strictEqual(parseSqlDataType('nvarchar'), SqlDataType.NVARCHAR);
      assert.strictEqual(parseSqlDataType('int'), SqlDataType.INT);
      assert.strictEqual(parseSqlDataType('datetime'), SqlDataType.DATETIME);
      assert.strictEqual(parseSqlDataType('bit'), SqlDataType.BIT);
      assert.strictEqual(parseSqlDataType('uniqueidentifier'), SqlDataType.UNIQUEIDENTIFIER);
    });

    test('should be case-insensitive', () => {
      assert.strictEqual(parseSqlDataType('VARCHAR'), SqlDataType.VARCHAR);
      assert.strictEqual(parseSqlDataType('VarChar'), SqlDataType.VARCHAR);
      assert.strictEqual(parseSqlDataType('INT'), SqlDataType.INT);
    });

    test('should return UNSUPPORTED for unknown types', () => {
      assert.strictEqual(parseSqlDataType('geography'), SqlDataType.UNSUPPORTED);
      assert.strictEqual(parseSqlDataType('xml'), SqlDataType.UNSUPPORTED);
      assert.strictEqual(parseSqlDataType('varbinary'), SqlDataType.UNSUPPORTED);
      assert.strictEqual(parseSqlDataType('text'), SqlDataType.UNSUPPORTED);
      assert.strictEqual(parseSqlDataType('image'), SqlDataType.UNSUPPORTED);
      assert.strictEqual(parseSqlDataType('unknown_type'), SqlDataType.UNSUPPORTED);
    });

    test('should handle empty string', () => {
      assert.strictEqual(parseSqlDataType(''), SqlDataType.UNSUPPORTED);
    });
  });
});
