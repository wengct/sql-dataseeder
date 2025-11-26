import * as assert from 'assert';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata, isColumnInsertable, isColumnSupported } from '../../../models/columnMetadata';

suite('ColumnMetadata', () => {
  suite('isColumnSupported', () => {
    test('should return true for all supported data types', () => {
      const supportedTypes = [
        SqlDataType.VARCHAR, SqlDataType.NVARCHAR, SqlDataType.CHAR, SqlDataType.NCHAR,
        SqlDataType.INT, SqlDataType.BIGINT, SqlDataType.SMALLINT, SqlDataType.TINYINT,
        SqlDataType.DECIMAL, SqlDataType.NUMERIC, SqlDataType.FLOAT, SqlDataType.REAL,
        SqlDataType.DATETIME, SqlDataType.DATETIME2, SqlDataType.DATE, SqlDataType.TIME,
        SqlDataType.BIT, SqlDataType.UNIQUEIDENTIFIER
      ];

      for (const dataType of supportedTypes) {
        assert.strictEqual(
          isColumnSupported(dataType),
          true,
          `${dataType} should be supported`
        );
      }
    });

    test('should return false for UNSUPPORTED data type', () => {
      assert.strictEqual(isColumnSupported(SqlDataType.UNSUPPORTED), false);
    });
  });

  suite('isColumnInsertable', () => {
    test('should return true for regular column with supported type', () => {
      const column: ColumnMetadata = {
        name: 'Name',
        dataType: SqlDataType.VARCHAR,
        maxLength: 100,
        precision: null,
        scale: null,
        isNullable: false,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(isColumnInsertable(column), true);
    });

    test('should return false for IDENTITY column', () => {
      const column: ColumnMetadata = {
        name: 'Id',
        dataType: SqlDataType.INT,
        maxLength: null,
        precision: null,
        scale: null,
        isNullable: false,
        isIdentity: true,
        isComputed: false
      };

      assert.strictEqual(isColumnInsertable(column), false);
    });

    test('should return false for COMPUTED column', () => {
      const column: ColumnMetadata = {
        name: 'FullName',
        dataType: SqlDataType.VARCHAR,
        maxLength: 200,
        precision: null,
        scale: null,
        isNullable: true,
        isIdentity: false,
        isComputed: true
      };

      assert.strictEqual(isColumnInsertable(column), false);
    });

    test('should return false for UNSUPPORTED data type', () => {
      const column: ColumnMetadata = {
        name: 'GeoLocation',
        dataType: SqlDataType.UNSUPPORTED,
        maxLength: null,
        precision: null,
        scale: null,
        isNullable: true,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(isColumnInsertable(column), false);
    });

    test('should return false for IDENTITY + UNSUPPORTED (multiple exclusion reasons)', () => {
      const column: ColumnMetadata = {
        name: 'Special',
        dataType: SqlDataType.UNSUPPORTED,
        maxLength: null,
        precision: null,
        scale: null,
        isNullable: false,
        isIdentity: true,
        isComputed: false
      };

      assert.strictEqual(isColumnInsertable(column), false);
    });

    test('should return true for nullable column with supported type', () => {
      const column: ColumnMetadata = {
        name: 'Description',
        dataType: SqlDataType.NVARCHAR,
        maxLength: 500,
        precision: null,
        scale: null,
        isNullable: true,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(isColumnInsertable(column), true);
    });
  });

  suite('ColumnMetadata structure', () => {
    test('should correctly store string type properties', () => {
      const column: ColumnMetadata = {
        name: 'Email',
        dataType: SqlDataType.NVARCHAR,
        maxLength: 255,
        precision: null,
        scale: null,
        isNullable: false,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(column.name, 'Email');
      assert.strictEqual(column.dataType, SqlDataType.NVARCHAR);
      assert.strictEqual(column.maxLength, 255);
      assert.strictEqual(column.precision, null);
      assert.strictEqual(column.scale, null);
      assert.strictEqual(column.isNullable, false);
      assert.strictEqual(column.isIdentity, false);
      assert.strictEqual(column.isComputed, false);
    });

    test('should correctly store decimal type properties', () => {
      const column: ColumnMetadata = {
        name: 'Price',
        dataType: SqlDataType.DECIMAL,
        maxLength: null,
        precision: 18,
        scale: 2,
        isNullable: false,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(column.name, 'Price');
      assert.strictEqual(column.dataType, SqlDataType.DECIMAL);
      assert.strictEqual(column.maxLength, null);
      assert.strictEqual(column.precision, 18);
      assert.strictEqual(column.scale, 2);
    });

    test('should handle varchar(max) with maxLength -1', () => {
      const column: ColumnMetadata = {
        name: 'LongText',
        dataType: SqlDataType.VARCHAR,
        maxLength: -1, // varchar(max)
        precision: null,
        scale: null,
        isNullable: true,
        isIdentity: false,
        isComputed: false
      };

      assert.strictEqual(column.maxLength, -1);
      assert.strictEqual(isColumnInsertable(column), true);
    });
  });
});
