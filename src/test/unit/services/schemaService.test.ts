import * as assert from 'assert';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { TableMetadata } from '../../../models/tableMetadata';
import { SchemaService } from '../../../services/schemaService';

suite('SchemaService', () => {
  suite('parseColumnQueryResult', () => {
    test('should parse varchar column correctly', () => {
      const queryResult = {
        column_name: 'Name',
        data_type: 'varchar',
        max_length: 100,
        precision: 0,
        scale: 0,
        is_nullable: false,
        is_identity: false,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.name, 'Name');
      assert.strictEqual(column.dataType, SqlDataType.VARCHAR);
      assert.strictEqual(column.maxLength, 100);
      assert.strictEqual(column.isNullable, false);
      assert.strictEqual(column.isIdentity, false);
      assert.strictEqual(column.isComputed, false);
    });

    test('should parse nvarchar column and convert maxLength (bytes to chars)', () => {
      const queryResult = {
        column_name: 'Email',
        data_type: 'nvarchar',
        max_length: 510, // 255 chars * 2 bytes
        precision: 0,
        scale: 0,
        is_nullable: true,
        is_identity: false,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.name, 'Email');
      assert.strictEqual(column.dataType, SqlDataType.NVARCHAR);
      assert.strictEqual(column.maxLength, 255); // Converted to chars
      assert.strictEqual(column.isNullable, true);
    });

    test('should parse nvarchar(max) correctly', () => {
      const queryResult = {
        column_name: 'Description',
        data_type: 'nvarchar',
        max_length: -1, // MAX
        precision: 0,
        scale: 0,
        is_nullable: true,
        is_identity: false,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.maxLength, -1);
    });

    test('should parse decimal column with precision and scale', () => {
      const queryResult = {
        column_name: 'Price',
        data_type: 'decimal',
        max_length: 9,
        precision: 18,
        scale: 2,
        is_nullable: false,
        is_identity: false,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.dataType, SqlDataType.DECIMAL);
      assert.strictEqual(column.precision, 18);
      assert.strictEqual(column.scale, 2);
    });

    test('should parse int identity column', () => {
      const queryResult = {
        column_name: 'Id',
        data_type: 'int',
        max_length: 4,
        precision: 10,
        scale: 0,
        is_nullable: false,
        is_identity: true,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.dataType, SqlDataType.INT);
      assert.strictEqual(column.isIdentity, true);
    });

    test('should parse computed column', () => {
      const queryResult = {
        column_name: 'FullName',
        data_type: 'nvarchar',
        max_length: 400,
        precision: 0,
        scale: 0,
        is_nullable: true,
        is_identity: false,
        is_computed: true
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.isComputed, true);
    });

    test('should parse unsupported type as UNSUPPORTED', () => {
      const queryResult = {
        column_name: 'Location',
        data_type: 'geography',
        max_length: -1,
        precision: 0,
        scale: 0,
        is_nullable: true,
        is_identity: false,
        is_computed: false
      };

      const column = SchemaService.parseColumnQueryResult(queryResult);

      assert.strictEqual(column.dataType, SqlDataType.UNSUPPORTED);
    });
  });

  suite('buildTableMetadata', () => {
    test('should build TableMetadata from schema, table name, and columns', () => {
      const columns: ColumnMetadata[] = [
        {
          name: 'Id',
          dataType: SqlDataType.INT,
          maxLength: null,
          precision: null,
          scale: null,
          isNullable: false,
          isIdentity: true,
          isComputed: false
        },
        {
          name: 'Name',
          dataType: SqlDataType.VARCHAR,
          maxLength: 100,
          precision: null,
          scale: null,
          isNullable: false,
          isIdentity: false,
          isComputed: false
        }
      ];

      const table = SchemaService.buildTableMetadata('dbo', 'Users', columns);

      assert.strictEqual(table.schemaName, 'dbo');
      assert.strictEqual(table.tableName, 'Users');
      assert.strictEqual(table.columns.length, 2);
    });
  });

  suite('buildSchemaQuery', () => {
    test('should build correct SQL query for table schema', () => {
      const query = SchemaService.buildSchemaQuery('dbo', 'Users');

      assert.ok(query.includes('sys.columns'));
      assert.ok(query.includes('sys.types'));
      assert.ok(query.includes('[dbo].[Users]'));
      assert.ok(query.includes('OBJECT_ID'));
    });

    test('should handle schema with special characters', () => {
      const query = SchemaService.buildSchemaQuery('my schema', 'my table');

      assert.ok(query.includes('[my schema].[my table]'));
    });
  });
});
