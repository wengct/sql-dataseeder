import * as assert from 'assert';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { TableMetadata } from '../../../models/tableMetadata';
import { GenerationOptions } from '../../../models/generationTypes';
import { InsertScriptGenerator } from '../../../generators/insertScriptGenerator';
import { FakeDataService } from '../../../services/fakeDataService';

suite('InsertScriptGenerator', () => {
  let generator: InsertScriptGenerator;
  let fakeDataService: FakeDataService;

  setup(() => {
    fakeDataService = new FakeDataService();
    generator = new InsertScriptGenerator(fakeDataService);
  });

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

  const createTable = (columns: ColumnMetadata[]): TableMetadata => ({
    schemaName: 'dbo',
    tableName: 'TestTable',
    columns,
    hasIdentityColumn: columns.some(c => c.isIdentity)
  });

  suite('generate', () => {
    test('should generate correct number of INSERT statements', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 })
      ]);
      const options: GenerationOptions = { rowCount: 5 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rowCount, 5);

      // Count INSERT statements
      const insertCount = (result.script?.match(/INSERT INTO/g) || []).length;
      assert.strictEqual(insertCount, 5);
    });

    test('should include table name with schema in INSERT statement', () => {
      const table: TableMetadata = {
        schemaName: 'sales',
        tableName: 'Orders',
        columns: [createColumn('OrderId', SqlDataType.INT)],
        hasIdentityColumn: false
      };
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(result.script?.includes('[sales].[Orders]'), 'Should include schema and table name');
    });

    test('should include column names in INSERT statement', () => {
      const table = createTable([
        createColumn('FirstName', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('LastName', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('Age', SqlDataType.INT)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(result.script?.includes('[FirstName]'), 'Should include FirstName column');
      assert.ok(result.script?.includes('[LastName]'), 'Should include LastName column');
      assert.ok(result.script?.includes('[Age]'), 'Should include Age column');
    });

    test('should skip IDENTITY columns', () => {
      const table = createTable([
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 })
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(!result.script?.includes('[Id]'), 'Should not include Id column');
      assert.ok(result.script?.includes('[Name]'), 'Should include Name column');
    });

    test('should skip COMPUTED columns', () => {
      const table = createTable([
        createColumn('FirstName', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('FullName', SqlDataType.VARCHAR, { maxLength: 100, isComputed: true })
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(result.script?.includes('[FirstName]'), 'Should include FirstName column');
      assert.ok(!result.script?.includes('[FullName]'), 'Should not include FullName column');
    });

    test('should skip UNSUPPORTED type columns and report them', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('Location', SqlDataType.UNSUPPORTED)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(!result.script?.includes('[Location]'), 'Should not include Location column');
      assert.ok(result.skippedColumns.includes('Location'), 'Should report Location as skipped');
    });

    test('should report multiple skipped columns', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 }),
        createColumn('Geo', SqlDataType.UNSUPPORTED),
        createColumn('Xml', SqlDataType.UNSUPPORTED)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.skippedColumns.length, 2);
      assert.ok(result.skippedColumns.includes('Geo'));
      assert.ok(result.skippedColumns.includes('Xml'));
    });

    test('should generate VALUES with correct data format', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 50 }),
        createColumn('Age', SqlDataType.INT),
        createColumn('Active', SqlDataType.BIT)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      // Check VALUES clause exists
      assert.ok(result.script?.includes('VALUES'), 'Should include VALUES clause');
      assert.ok(result.script?.includes('('), 'Should have opening parenthesis');
      assert.ok(result.script?.includes(')'), 'Should have closing parenthesis');
    });

    test('should end each INSERT statement with semicolon', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 100 })
      ]);
      const options: GenerationOptions = { rowCount: 3 };

      const result = generator.generate(table, options);

      const lines = result.script?.split('\n').filter((l: string) => l.trim()) || [];
      for (const line of lines) {
        assert.ok(line.endsWith(';'), `Line should end with semicolon: ${line}`);
      }
    });

    test('should return error when no insertable columns', () => {
      const table = createTable([
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Geo', SqlDataType.UNSUPPORTED)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.script, null);
      assert.ok(result.errorMessage?.includes('No insertable columns'));
    });

    test('should handle table with all column types', () => {
      const table = createTable([
        createColumn('Id', SqlDataType.INT, { isIdentity: true }),
        createColumn('Name', SqlDataType.NVARCHAR, { maxLength: 100 }),
        createColumn('Age', SqlDataType.INT),
        createColumn('Salary', SqlDataType.DECIMAL, { precision: 18, scale: 2 }),
        createColumn('JoinDate', SqlDataType.DATE),
        createColumn('IsActive', SqlDataType.BIT),
        createColumn('UniqueId', SqlDataType.UNIQUEIDENTIFIER),
        createColumn('FullName', SqlDataType.VARCHAR, { maxLength: 200, isComputed: true }),
        createColumn('Location', SqlDataType.UNSUPPORTED)
      ]);
      const options: GenerationOptions = { rowCount: 2 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rowCount, 2);

      // Should include insertable columns
      assert.ok(result.script?.includes('[Name]'));
      assert.ok(result.script?.includes('[Age]'));
      assert.ok(result.script?.includes('[Salary]'));
      assert.ok(result.script?.includes('[JoinDate]'));
      assert.ok(result.script?.includes('[IsActive]'));
      assert.ok(result.script?.includes('[UniqueId]'));

      // Should skip non-insertable columns
      assert.ok(!result.script?.includes('[Id]'));
      assert.ok(!result.script?.includes('[FullName]'));
      assert.ok(!result.script?.includes('[Location]'));

      // Should report skipped columns (only unsupported, not identity/computed)
      assert.ok(result.skippedColumns.includes('Location'));
    });
  });

  suite('Edge cases', () => {
    test('should handle single column table', () => {
      const table = createTable([
        createColumn('Value', SqlDataType.INT)
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.success, true);
      assert.ok(result.script?.includes('[Value]'));
    });

    test('should handle rowCount of 1', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 50 })
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.rowCount, 1);
      const insertCount = (result.script?.match(/INSERT INTO/g) || []).length;
      assert.strictEqual(insertCount, 1);
    });

    test('should handle large rowCount', () => {
      const table = createTable([
        createColumn('Name', SqlDataType.VARCHAR, { maxLength: 50 })
      ]);
      const options: GenerationOptions = { rowCount: 100 };

      const result = generator.generate(table, options);

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.rowCount, 100);
    });

    test('should handle column names with spaces', () => {
      const table = createTable([
        createColumn('First Name', SqlDataType.VARCHAR, { maxLength: 50 })
      ]);
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(result.script?.includes('[First Name]'), 'Should wrap column name with spaces in brackets');
    });

    test('should handle schema names with spaces', () => {
      const table: TableMetadata = {
        schemaName: 'My Schema',
        tableName: 'My Table',
        columns: [createColumn('Value', SqlDataType.INT)],
        hasIdentityColumn: false
      };
      const options: GenerationOptions = { rowCount: 1 };

      const result = generator.generate(table, options);

      assert.ok(result.script?.includes('[My Schema].[My Table]'));
    });
  });
});
