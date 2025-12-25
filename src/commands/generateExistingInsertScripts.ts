import * as vscode from 'vscode';
import { ExistingDataInsertGenerator } from '../generators/existingDataInsertGenerator';
import { IExistingDataOptions } from '../models/existingDataTypes';
import { getFullTableName, TableMetadata } from '../models/tableMetadata';
import { MssqlService } from '../services/mssqlService';
import { SchemaService } from '../services/schemaService';
import { DataQueryBuilder } from '../services/dataQueryBuilder';
import { ClipboardService } from '../utils/clipboard';
import { ErrorMessages, SuccessMessages, WarningMessages } from '../utils/errorMessages';

type Dependencies = {
  mssqlService?: MssqlService;
  schemaService?: SchemaService;
  dataQueryBuilder?: DataQueryBuilder;
  generator?: ExistingDataInsertGenerator;
  clipboardService?: ClipboardService;
};

export async function generateExistingInsertScripts(node: unknown, deps: Dependencies = {}): Promise<void> {
  try {
    const mssqlService = deps.mssqlService ?? new MssqlService();
    const schemaService = deps.schemaService ?? new SchemaService(mssqlService);
    const dataQueryBuilder = deps.dataQueryBuilder ?? new DataQueryBuilder();
    const generator = deps.generator ?? new ExistingDataInsertGenerator();
    const clipboardService = deps.clipboardService ?? new ClipboardService();

    const isAvailable = await mssqlService.isAvailable();
    if (!isAvailable) {
      vscode.window.showErrorMessage(ErrorMessages.MSSQL_NOT_INSTALLED);
      return;
    }

    const rowCountInput = await vscode.window.showInputBox({
      prompt: 'Enter the number of rows to generate (default: 100):',
      value: '100',
      validateInput: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          return ErrorMessages.INVALID_ROW_COUNT;
        }
        return null;
      }
    });

    if (rowCountInput === undefined) {
      return;
    }

    const whereInput = await vscode.window.showInputBox({
      prompt: 'Enter WHERE condition (optional, without WHERE keyword):'
    });
    if (whereInput === undefined) {
      return;
    }

    const orderByInput = await vscode.window.showInputBox({
      prompt: 'Enter ORDER BY clause (optional, without ORDER BY keyword):'
    });
    if (orderByInput === undefined) {
      return;
    }

    const normalizeWhere = (input: string): string | null => {
      const trimmed = input.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.replace(/^where\s+/i, '');
    };

    const normalizeOrderBy = (input: string): string | null => {
      const trimmed = input.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.replace(/^order\s+by\s+/i, '');
    };

    const tableMetadata = await schemaService.getTableMetadata(node);

    let includeIdentity = false;
    if ((tableMetadata as any).hasIdentityColumn) {
      const pick = await vscode.window.showQuickPick(['No', 'Yes'], {
        placeHolder: 'Include IDENTITY column values?'
      });
      if (pick === undefined) {
        return;
      }
      includeIdentity = pick === 'Yes';
    }

    const options: IExistingDataOptions = {
      rowCount: parseInt(rowCountInput, 10),
      whereClause: normalizeWhere(whereInput),
      orderByClause: normalizeOrderBy(orderByInput),
      includeIdentity
    };

    const querySql = dataQueryBuilder.buildSelectQuery(tableMetadata as TableMetadata, options);

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Generating INSERT scripts from existing data...'
    }, async (progress) => {
      progress.report({ increment: 20, message: 'Querying table data...' });

      let rows: any[];
      try {
        rows = await mssqlService.queryTableData(node, querySql);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(ErrorMessages.QUERY_SYNTAX_ERROR(msg));
        return;
      }

      if (rows.length === 0) {
        if (options.whereClause || options.orderByClause) {
          vscode.window.showInformationMessage(ErrorMessages.QUERY_NO_RESULTS);
        } else {
          vscode.window.showInformationMessage(ErrorMessages.TABLE_EMPTY(getFullTableName(tableMetadata)));
        }
        return;
      }

      progress.report({ increment: 50, message: 'Generating script...' });
      const result = generator.generate(tableMetadata as TableMetadata, rows, options);

      if (!result.success) {
        vscode.window.showErrorMessage(result.errorMessage || ErrorMessages.UNKNOWN_ERROR);
        return;
      }

      if (!result.script) {
        vscode.window.showInformationMessage(ErrorMessages.TABLE_EMPTY(getFullTableName(tableMetadata)));
        return;
      }

      progress.report({ increment: 30, message: 'Copying to clipboard...' });
      await clipboardService.writeText(result.script);

      if (result.skippedColumns.length > 0) {
        vscode.window.showInformationMessage(
          SuccessMessages.SCRIPT_COPIED_WITH_SKIPPED(result.rowCount, result.skippedColumns.length)
        );
        vscode.window.showWarningMessage(WarningMessages.COLUMNS_SKIPPED(result.skippedColumns));
      } else {
        vscode.window.showInformationMessage(SuccessMessages.SCRIPT_COPIED(result.rowCount));
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : ErrorMessages.UNKNOWN_ERROR;
    vscode.window.showErrorMessage(message);
  }
}
