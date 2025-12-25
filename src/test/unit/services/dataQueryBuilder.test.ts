import * as assert from 'assert';
import { DataQueryBuilder } from '../../../services/dataQueryBuilder';
import { TableMetadata } from '../../../models/tableMetadata';
import { IExistingDataOptions } from '../../../models/existingDataTypes';

describe('DataQueryBuilder', () => {
  const baseOptions: IExistingDataOptions = {
    rowCount: 5,
    whereClause: null,
    orderByClause: null,
    includeIdentity: false
  };

  test('should include database name when present', () => {
    const table: TableMetadata = {
      schemaName: 'dbo',
      tableName: 'Users',
      databaseName: 'MyDatabase',
      columns: [],
      hasIdentityColumn: false
    };

    const builder = new DataQueryBuilder();
    const sql = builder.buildSelectQuery(table, baseOptions);

    assert.ok(sql.includes('FROM [MyDatabase].[dbo].[Users] WITH (NOLOCK)'));
  });

  test('should escape right brackets in identifiers', () => {
    const table: TableMetadata = {
      schemaName: 'sch]ema',
      tableName: 'Tab]le',
      databaseName: 'Db]Name',
      columns: [],
      hasIdentityColumn: false
    };

    const builder = new DataQueryBuilder();
    const sql = builder.buildSelectQuery(table, baseOptions);

    assert.ok(sql.includes('FROM [Db]]Name].[sch]]ema].[Tab]]le] WITH (NOLOCK)'));
  });

  test('should fall back to schema-qualified name when database is missing', () => {
    const table: TableMetadata = {
      schemaName: 'dbo',
      tableName: 'Users',
      columns: [],
      hasIdentityColumn: false
    };

    const builder = new DataQueryBuilder();
    const sql = builder.buildSelectQuery(table, baseOptions);

    assert.ok(sql.includes('FROM [dbo].[Users] WITH (NOLOCK)'));
  });

  test('should throw when WHERE clause contains dangerous SQL', () => {
    const table: TableMetadata = {
      schemaName: 'dbo',
      tableName: 'Users',
      columns: [],
      hasIdentityColumn: false
    };

    const builder = new DataQueryBuilder();

    assert.throws(() => builder.buildSelectQuery(table, {
      ...baseOptions,
      whereClause: '1=1; DROP TABLE Users'
    }), /dangerous SQL/i);
  });

  test('should throw when ORDER BY clause contains dangerous SQL', () => {
    const table: TableMetadata = {
      schemaName: 'dbo',
      tableName: 'Users',
      columns: [],
      hasIdentityColumn: false
    };

    const builder = new DataQueryBuilder();

    assert.throws(() => builder.buildSelectQuery(table, {
      ...baseOptions,
      orderByClause: 'Id DESC -- drop'
    }), /dangerous SQL/i);
  });
});
