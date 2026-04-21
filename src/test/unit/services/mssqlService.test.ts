import * as assert from 'assert';
import { MssqlService } from '../../../services/mssqlService';

suite('MssqlService', () => {
  const createNode = () => ({
    connectionProfile: {
      id: '1',
      server: 'server',
      database: 'winbond-cms'
    }
  });

  suite('getTableInfo', () => {
    const service = new MssqlService();

    test('should keep separate schema and table metadata', () => {
      const result = service.getTableInfo({
        metadata: {
          schema: 'dbo',
          name: 'TemplateLibrary'
        },
        connectionProfile: {
          id: '1',
          server: 'server',
          database: 'winbond-cms'
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'TemplateLibrary');
      assert.strictEqual(result.databaseName, 'winbond-cms');
    });

    test('should parse schema-qualified metadata name', () => {
      const result = service.getTableInfo({
        metadata: {
          name: 'dbo.TemplateLibrary'
        },
        connectionProfile: {
          id: '1',
          server: 'server',
          database: 'winbond-cms'
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'TemplateLibrary');
    });

    test('should parse bracketed schema-qualified metadata name', () => {
      const result = service.getTableInfo({
        metadata: {
          name: '[dbo].[TemplateLibrary]'
        },
        connectionProfile: {
          id: '1',
          server: 'server',
          database: 'winbond-cms'
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'TemplateLibrary');
    });

    test('should unquote bracketed table name when schema is separate', () => {
      const result = service.getTableInfo({
        metadata: {
          schema: 'dbo',
          name: '[TemplateLibrary]'
        },
        connectionProfile: {
          id: '1',
          server: 'server',
          database: 'winbond-cms'
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'TemplateLibrary');
    });

    test('should fall back to node path for object name', () => {
      const result = service.getTableInfo({
        metadata: {},
        _nodePath: 'server/Databases/winbond-cms/Tables/dbo.TemplateLibrary',
        _connectionProfile: {
          id: '1',
          server: 'server',
          database: ''
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'TemplateLibrary');
      assert.strictEqual(result.databaseName, 'winbond-cms');
    });

    test('should preserve dots inside bracketed table names', () => {
      const result = service.getTableInfo({
        metadata: {
          name: '[dbo].[Template.Library]'
        },
        connectionProfile: {
          id: '1',
          server: 'server',
          database: 'winbond-cms'
        }
      });

      assert.strictEqual(result.schemaName, 'dbo');
      assert.strictEqual(result.tableName, 'Template.Library');
    });
  });

  suite('executeQuery', () => {
    test('should switch database context when current database differs', async () => {
      const queries: string[] = [];
      const service = new MssqlService() as any;

      service.mssqlApi = {
        connectionSharing: {
          connect: async () => 'connection://test',
          executeSimpleQuery: async (_connectionUri: string, query: string) => {
            queries.push(query);

            if (query.includes('DB_NAME() AS current_database')) {
              return {
                rowCount: 1,
                columnInfo: [
                  { columnName: 'current_database' },
                  { columnName: 'engine_edition' }
                ],
                rows: [[
                  { displayValue: 'master', isNull: false },
                  { displayValue: '3', isNull: false }
                ]]
              };
            }

            assert.ok(query.startsWith('USE [winbond-cms];'));
            return {
              rowCount: 1,
              columnInfo: [{ columnName: 'column_name' }],
              rows: [[{ displayValue: 'Id', isNull: false }]]
            };
          }
        }
      };

      const result = await service.executeQuery(createNode(), 'SELECT c.name AS column_name FROM sys.columns c;', 'winbond-cms');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].column_name, 'Id');
      assert.strictEqual(queries.length, 2);
      assert.ok(queries[0].includes('DB_NAME() AS current_database'));
      assert.strictEqual(queries[1], 'USE [winbond-cms];\nSELECT c.name AS column_name FROM sys.columns c;');
    });

    test('should not use USE statement on Azure SQL Database', async () => {
      const queries: string[] = [];
      const service = new MssqlService() as any;

      service.mssqlApi = {
        connectionSharing: {
          connect: async () => 'connection://test',
          executeSimpleQuery: async (_connectionUri: string, query: string) => {
            queries.push(query);

            if (query.includes('DB_NAME() AS current_database')) {
              return {
                rowCount: 1,
                columnInfo: [
                  { columnName: 'current_database' },
                  { columnName: 'engine_edition' }
                ],
                rows: [[
                  { displayValue: 'master', isNull: false },
                  { displayValue: '5', isNull: false }
                ]]
              };
            }

            assert.fail(`unexpected query: ${query}`);
          }
        }
      };

      await assert.rejects(
        () => service.executeQuery(createNode(), 'SELECT c.name AS column_name FROM sys.columns c;', 'winbond-cms'),
        (error: unknown) => error instanceof Error &&
          error.message.includes('Azure SQL Database shared connection is using [master]') &&
          error.message.includes('[winbond-cms]')
      );

      assert.strictEqual(queries.length, 1);
      assert.ok(queries[0].includes('DB_NAME() AS current_database'));
    });

    test('should run query on Azure SQL Database when current database already matches', async () => {
      const queries: string[] = [];
      const service = new MssqlService() as any;

      service.mssqlApi = {
        connectionSharing: {
          connect: async () => 'connection://test',
          executeSimpleQuery: async (_connectionUri: string, query: string) => {
            queries.push(query);

            if (query.includes('DB_NAME() AS current_database')) {
              return {
                rowCount: 1,
                columnInfo: [
                  { columnName: 'current_database' },
                  { columnName: 'engine_edition' }
                ],
                rows: [[
                  { displayValue: 'winbond-cms', isNull: false },
                  { displayValue: '5', isNull: false }
                ]]
              };
            }

            assert.strictEqual(query, 'SELECT c.name AS column_name FROM sys.columns c;');
            return {
              rowCount: 1,
              columnInfo: [{ columnName: 'column_name' }],
              rows: [[{ displayValue: 'Id', isNull: false }]]
            };
          }
        }
      };

      const result = await service.executeQuery(createNode(), 'SELECT c.name AS column_name FROM sys.columns c;', 'winbond-cms');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].column_name, 'Id');
      assert.strictEqual(queries.length, 2);
      assert.ok(queries[0].includes('DB_NAME() AS current_database'));
      assert.strictEqual(queries[1], 'SELECT c.name AS column_name FROM sys.columns c;');
    });
  });

  suite('queryTableData', () => {
    test('should switch database context before reading rows when current database differs', async () => {
      const queries: string[] = [];
      const service = new MssqlService() as any;

      service.mssqlApi = {
        connectionSharing: {
          connect: async () => 'connection://test',
          executeSimpleQuery: async (_connectionUri: string, query: string) => {
            queries.push(query);

            if (query.includes('DB_NAME() AS current_database')) {
              return {
                rowCount: 1,
                columnInfo: [
                  { columnName: 'current_database' },
                  { columnName: 'engine_edition' }
                ],
                rows: [[
                  { displayValue: 'master', isNull: false },
                  { displayValue: '3', isNull: false }
                ]]
              };
            }

            assert.ok(query.startsWith('USE [winbond-cms];'));
            return {
              rowCount: 1,
              columnInfo: [{ columnName: 'Name' }],
              rows: [[{ displayValue: 'Alice', isNull: false }]]
            };
          }
        }
      };

      const rows = await service.queryTableData(createNode(), 'SELECT TOP 1 * FROM [dbo].[Users];', 'winbond-cms');

      assert.strictEqual(rows.length, 1);
      assert.deepStrictEqual(rows[0], {
        Name: { displayValue: 'Alice', isNull: false }
      });
      assert.strictEqual(queries.length, 2);
      assert.ok(queries[0].includes('DB_NAME() AS current_database'));
      assert.strictEqual(queries[1], 'USE [winbond-cms];\nSELECT TOP 1 * FROM [dbo].[Users];');
    });

    test('should fall back to original query when USE is rejected by server', async () => {
      const queries: string[] = [];
      const service = new MssqlService() as any;

      service.mssqlApi = {
        connectionSharing: {
          connect: async () => 'connection://test',
          executeSimpleQuery: async (_connectionUri: string, query: string) => {
            queries.push(query);

            if (query.includes('DB_NAME() AS current_database')) {
              return {
                rowCount: 1,
                columnInfo: [
                  { columnName: 'current_database' },
                  { columnName: 'engine_edition' }
                ],
                rows: [[
                  { displayValue: 'master', isNull: false },
                  { displayValue: '3', isNull: false }
                ]]
              };
            }

            if (query.startsWith('USE [winbond-cms];')) {
              throw new Error('Msg 40508, Level 16, State 1, Line 1 USE statement is not supported to switch between databases.');
            }

            assert.strictEqual(query, 'SELECT TOP 1 * FROM [dbo].[Users];');
            return {
              rowCount: 1,
              columnInfo: [{ columnName: 'Name' }],
              rows: [[{ displayValue: 'Alice', isNull: false }]]
            };
          }
        }
      };

      const rows = await service.queryTableData(createNode(), 'SELECT TOP 1 * FROM [dbo].[Users];', 'winbond-cms');

      assert.strictEqual(rows.length, 1);
      assert.deepStrictEqual(rows[0], {
        Name: { displayValue: 'Alice', isNull: false }
      });
      assert.strictEqual(queries.length, 3);
      assert.ok(queries[0].includes('DB_NAME() AS current_database'));
      assert.strictEqual(queries[1], 'USE [winbond-cms];\nSELECT TOP 1 * FROM [dbo].[Users];');
      assert.strictEqual(queries[2], 'SELECT TOP 1 * FROM [dbo].[Users];');
    });
  });
});
