import * as assert from 'assert';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { TableMetadata, getInsertableColumns, getFullTableName } from '../../../models/tableMetadata';

suite('TableMetadata', () => {
  const createColumn = (
    name: string,
    dataType: SqlDataType,
    options: Partial<ColumnMetadata> = {}
  ): ColumnMetadata => ({
    name,
    dataType,
    maxLength: options.maxLength ?? null,
    precision: options.precision ?? null,
    scale: options.scale ?? null,
    isNullable: options.isNullable ?? false,
    isIdentity: options.isIdentity ?? false,
    isComputed: options.isComputed ?? false
  });

  suite('getFullTableName', () => {
    test('should format table name with brackets', () => {
      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns: [],
        hasIdentityColumn: false
      };

      assert.strictEqual(getFullTableName(table), '[dbo].[Users]');
    });

    test('should handle different schema names', () => {
      const table: TableMetadata = {
        schemaName: 'sales',
        tableName: 'Orders',
        columns: [],
        hasIdentityColumn: false
      };

      assert.strictEqual(getFullTableName(table), '[sales].[Orders]');
    });

    test('should handle table names with special characters', () => {
      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'User Details',
        columns: [],
        hasIdentityColumn: false
      };

      assert.strictEqual(getFullTableName(table), '[dbo].[User Details]');
    });
  });

  suite('getInsertableColumns', () => {
    test('should return all columns when all are insertable', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('Email', SqlDataType.NVARCHAR, { maxLength: 255 }),
        createColumn('Age', SqlDataType.INT)
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns,
        hasIdentityColumn: false
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 3);
      assert.deepStrictEqual(insertable.map(c => c.name), ['Name', 'Email', 'Age']);
    });

    test('should filter out IDENTITY columns', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('Email', SqlDataType.NVARCHAR, { maxLength: 255 })
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 2);
      assert.ok(!insertable.some(c => c.name === 'Id'));
    });

    test('should filter out COMPUTED columns', () => {
      const columns: ColumnMetadata[] = [
        createColumn('FirstName', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('LastName', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('FullName', SqlDataType.VARCHAR, { maxLength: 100, isComputed: true })
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 2);
      assert.ok(!insertable.some(c => c.name === 'FullName'));
    });

    test('should filter out UNSUPPORTED type columns', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('Location', SqlDataType.UNSUPPORTED), // geography
        createColumn('Data', SqlDataType.UNSUPPORTED) // xml
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Places',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 1);
      assert.strictEqual(insertable[0].name, 'Name');
    });

    test('should filter out multiple exclusion types', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('FullName', SqlDataType.VARCHAR, { maxLength: 200, isComputed: true }),
        createColumn('Location', SqlDataType.UNSUPPORTED),
        createColumn('Email', SqlDataType.NVARCHAR, { maxLength: 255 })
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 2);
      assert.deepStrictEqual(insertable.map(c => c.name), ['Name', 'Email']);
    });

    test('should return empty array when no columns are insertable', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Data', SqlDataType.UNSUPPORTED)
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Special',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.strictEqual(insertable.length, 0);
    });

    test('should preserve column order', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('ZName', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('AEmail', SqlDataType.NVARCHAR, { maxLength: 255 }),
        createColumn('MAge', SqlDataType.INT)
      ];

      const table: TableMetadata = {
        schemaName: 'dbo',
        tableName: 'Users',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      const insertable = getInsertableColumns(table);
      assert.deepStrictEqual(insertable.map(c => c.name), ['ZName', 'AEmail', 'MAge']);
    });
  });

  suite('TableMetadata structure', () => {
    test('should correctly store table properties', () => {
      const columns: ColumnMetadata[] = [
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 })
      ];

      const table: TableMetadata = {
        schemaName: 'sales',
        tableName: 'Customers',
        columns,
        hasIdentityColumn: columns.some(c => c.isIdentity)
      };

      assert.strictEqual(table.schemaName, 'sales');
      assert.strictEqual(table.tableName, 'Customers');
      assert.strictEqual(table.columns.length, 2);
    });
  });
});
