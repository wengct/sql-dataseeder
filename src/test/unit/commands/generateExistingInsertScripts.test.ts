import * as assert from 'assert';
import * as vscode from 'vscode';
import { generateExistingInsertScripts } from '../../../commands/generateExistingInsertScripts';
import { TableMetadata } from '../../../models/tableMetadata';
import { SqlDataType } from '../../../models/sqlDataType';
import { ColumnMetadata } from '../../../models/columnMetadata';
import { IQueryRow } from '../../../models/existingDataTypes';
import { ErrorMessages } from '../../../utils/errorMessages';

suite('generateExistingInsertScripts', () => {
  const createTable = (): TableMetadata => {
    const columns: ColumnMetadata[] = [{
      name: 'Name',
      dataType: SqlDataType.VARCHAR,
      maxLength: 50,
      precision: null,
      scale: null,
      isNullable: true,
      isIdentity: false,
      isComputed: false
    }];

    return {
      schemaName: 'dbo',
      tableName: 'Users',
      columns,
      hasIdentityColumn: false
    };
  };

  const row: IQueryRow = {
    Name: { displayValue: 'Alice', isNull: false }
  };

  test('should copy script to clipboard and show success message', async () => {
    const infoMessages: string[] = [];
    const errorMessages: string[] = [];

    const windowAny = vscode.window as any;
    const origInfo = windowAny.showInformationMessage;
    const origError = windowAny.showErrorMessage;
    const origInput = windowAny.showInputBox;
    const origProgress = windowAny.withProgress;

    windowAny.showInformationMessage = async (message: string) => {
      infoMessages.push(message);
      return undefined;
    };
    windowAny.showErrorMessage = async (message: string) => {
      errorMessages.push(message);
      return undefined;
    };
    const inputs = ['1', '', ''];
    windowAny.showInputBox = async () => inputs.shift();
    windowAny.withProgress = async (_opts: any, task: any) => {
      return task({ report: () => {} }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) });
    };

    const written: string[] = [];

    try {
      await generateExistingInsertScripts({}, {
        mssqlService: {
          isAvailable: async () => true,
          queryTableData: async () => [row]
        } as any,
        schemaService: {
          getTableMetadata: async () => createTable()
        } as any,
        dataQueryBuilder: {
          buildSelectQuery: () => 'SELECT 1'
        } as any,
        generator: {
          generate: () => ({
            success: true,
            script: "INSERT INTO [dbo].[Users] ([Name]) VALUES ('Alice');",
            rowCount: 1,
            skippedColumns: [],
            errorMessage: null,
            hasIdentityInsert: false
          })
        } as any,
        clipboardService: {
          writeText: async (text: string) => {
            written.push(text);
          }
        } as any
      });

      assert.strictEqual(errorMessages.length, 0);
      assert.strictEqual(written.length, 1);
      assert.ok(infoMessages.some(m => m.includes('clipboard')));
    } finally {
      windowAny.showInformationMessage = origInfo;
      windowAny.showErrorMessage = origError;
      windowAny.showInputBox = origInput;
      windowAny.withProgress = origProgress;
    }
  });

  test('should show table empty message when query returns no rows', async () => {
    const infoMessages: string[] = [];

    const windowAny = vscode.window as any;
    const origInfo = windowAny.showInformationMessage;
    const origInput = windowAny.showInputBox;
    const origProgress = windowAny.withProgress;
    windowAny.showInformationMessage = async (message: string) => {
      infoMessages.push(message);
      return undefined;
    };
    const inputs = ['1', '', ''];
    windowAny.showInputBox = async () => inputs.shift();
    windowAny.withProgress = async (_opts: any, task: any) => {
      return task({ report: () => {} }, { isCancellationRequested: false, onCancellationRequested: () => ({ dispose: () => {} }) });
    };

    try {
      await generateExistingInsertScripts({}, {
        mssqlService: {
          isAvailable: async () => true,
          queryTableData: async () => []
        } as any,
        schemaService: {
          getTableMetadata: async () => createTable()
        } as any,
        dataQueryBuilder: {
          buildSelectQuery: () => 'SELECT 1'
        } as any
      });

      assert.ok(infoMessages.some(m => m.includes('has no data')));
    } finally {
      windowAny.showInformationMessage = origInfo;
      windowAny.showInputBox = origInput;
      windowAny.withProgress = origProgress;
    }
  });

  test('should show error when mssql is not available', async () => {
    const errorMessages: string[] = [];

    const windowAny = vscode.window as any;
    const origError = windowAny.showErrorMessage;
    const origInput = windowAny.showInputBox;
    windowAny.showErrorMessage = async (message: string) => {
      errorMessages.push(message);
      return undefined;
    };
    windowAny.showInputBox = async () => '1';

    try {
      await generateExistingInsertScripts({}, {
        mssqlService: {
          isAvailable: async () => false
        } as any
      });

      assert.strictEqual(errorMessages[0], ErrorMessages.MSSQL_NOT_INSTALLED);
    } finally {
      windowAny.showErrorMessage = origError;
      windowAny.showInputBox = origInput;
    }
  });
});
