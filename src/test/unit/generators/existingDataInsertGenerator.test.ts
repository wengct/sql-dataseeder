import * as assert from 'assert';
import { ExistingDataInsertGenerator } from '../../../generators/existingDataInsertGenerator';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { TableMetadata } from '../../../models/tableMetadata';
import { IQueryRow, IExistingDataOptions } from '../../../models/existingDataTypes';

suite('ExistingDataInsertGenerator', () => {
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
    isNullable: options.isNullable ?? true,
    isIdentity: options.isIdentity ?? false,
    isComputed: options.isComputed ?? false
  });

  const createTable = (columns: ColumnMetadata[]): TableMetadata => ({
    schemaName: 'dbo',
    tableName: 'Users',
    columns,
    hasIdentityColumn: columns.some(c => c.isIdentity)
  });

  const createRow = (cells: Record<string, { displayValue: string; isNull?: boolean; invariantCultureDisplayValue?: string }>): IQueryRow => {
    const row: Record<string, any> = {};
    for (const [k, v] of Object.entries(cells)) {
      row[k] = {
        displayValue: v.displayValue,
        isNull: v.isNull ?? false,
        invariantCultureDisplayValue: v.invariantCultureDisplayValue
      };
    }
    return row as IQueryRow;
  };

  test('should generate INSERT statements with consistent formatting', () => {
    const generator = new ExistingDataInsertGenerator();

    const columns: ColumnMetadata[] = [
      createColumn('Id', SqlDataType.INT, { isIdentity: true }),
      createColumn('Name', SqlDataType.VARCHAR, { maxLength: 50 }),
      createColumn('Note', SqlDataType.NVARCHAR, { maxLength: 50 }),
      createColumn('Data', SqlDataType.VARBINARY)
    ];

    const table = createTable(columns);

    const rows: IQueryRow[] = [
      createRow({
        Id: { displayValue: '1' },
        Name: { displayValue: "O'Brien" },
        Note: { displayValue: '中文' },
        Data: { displayValue: '0xAB' }
      }),
      createRow({
        Id: { displayValue: '2' },
        Name: { displayValue: 'Alice' },
        Note: { displayValue: 'Hello' },
        Data: { displayValue: 'ABCD' }
      })
    ];

    const options: IExistingDataOptions = {
      rowCount: 100,
      whereClause: null,
      orderByClause: null,
      includeIdentity: false
    };

    const result = generator.generate(table, rows, options);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.rowCount, 2);

    // IDENTITY excluded by default
    assert.ok(result.script?.includes('INSERT INTO [dbo].[Users] ([Name], [Note], [Data]) VALUES'));
    assert.ok(result.script?.includes("('O''Brien', N'中文', 0xAB);"));
    assert.ok(result.script?.includes("('Alice', N'Hello', 0xABCD);"));
  });

  test('should include IDENTITY column and wrap with SET IDENTITY_INSERT when requested', () => {
    const generator = new ExistingDataInsertGenerator();

    const columns: ColumnMetadata[] = [
      createColumn('Id', SqlDataType.INT, { isIdentity: true }),
      createColumn('Name', SqlDataType.VARCHAR, { maxLength: 50 })
    ];

    const table = createTable(columns);
    const rows: IQueryRow[] = [
      createRow({
        Id: { displayValue: '1' },
        Name: { displayValue: 'Alice' }
      })
    ];

    const options: IExistingDataOptions = {
      rowCount: 100,
      whereClause: null,
      orderByClause: null,
      includeIdentity: true
    };

    const result = generator.generate(table, rows, options);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.hasIdentityInsert, true);
    assert.ok(result.script?.startsWith('SET IDENTITY_INSERT [dbo].[Users] ON;'));
    assert.ok(result.script?.includes('INSERT INTO [dbo].[Users] ([Id], [Name]) VALUES (1, \'Alice\');'));
    assert.ok(result.script?.trimEnd().endsWith('SET IDENTITY_INSERT [dbo].[Users] OFF;'));
  });

  test('should return error when no insertable columns', () => {
    const generator = new ExistingDataInsertGenerator();

    const table = createTable([
      createColumn('Id', SqlDataType.INT, { isIdentity: true }),
      createColumn('Calc', SqlDataType.VARCHAR, { isComputed: true }),
      createColumn('Geo', SqlDataType.UNSUPPORTED)
    ]);

    const options: IExistingDataOptions = {
      rowCount: 100,
      whereClause: null,
      orderByClause: null,
      includeIdentity: false
    };

    const result = generator.generate(table, [createRow({})], options);

    assert.strictEqual(result.success, false);
    assert.ok(result.errorMessage);
  });
});
