import * as vscode from 'vscode';
import { MssqlService } from '../services/mssqlService';
import { SchemaService } from '../services/schemaService';
import { FakeDataService } from '../services/fakeDataService';
import { InsertScriptGenerator } from '../generators/insertScriptGenerator';
import { ClipboardService } from '../utils/clipboard';
import { DEFAULT_GENERATION_OPTIONS } from '../models/generationTypes';
import { ErrorMessages, SuccessMessages, WarningMessages } from '../utils/errorMessages';

/**
 * generateInsertScripts 指令處理器
 */
export async function generateInsertScripts(node: unknown): Promise<void> {
  try {
    // 1. 初始化服務
    const mssqlService = new MssqlService();
    const schemaService = new SchemaService(mssqlService);
    const fakeDataService = new FakeDataService();
    const insertScriptGenerator = new InsertScriptGenerator(fakeDataService);
    const clipboardService = new ClipboardService();

    // 2. 檢查 mssql 擴充套件是否可用
    const isAvailable = await mssqlService.isAvailable();
    if (!isAvailable) {
      vscode.window.showErrorMessage(ErrorMessages.MSSQL_NOT_INSTALLED);
      return;
    }

    // 3. 提示使用者輸入筆數
    const rowCountInput = await vscode.window.showInputBox({
      prompt: 'Enter the number of rows to generate',
      value: DEFAULT_GENERATION_OPTIONS.rowCount.toString(),
      validateInput: (value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          return ErrorMessages.INVALID_ROW_COUNT;
        }
        if (num > 1000) {
          return ErrorMessages.ROW_COUNT_TOO_LARGE(1000);
        }
        return null;
      }
    });

    // 使用者取消
    if (rowCountInput === undefined) {
      return;
    }

    const rowCount = parseInt(rowCountInput, 10);

    // 4. 查詢資料表結構
    const tableMetadata = await schemaService.getTableMetadata(node);

    // 5. 產生 Insert 語法
    const result = insertScriptGenerator.generate(tableMetadata, { rowCount });

    if (!result.success) {
      vscode.window.showErrorMessage(result.errorMessage || ErrorMessages.UNKNOWN_ERROR);
      return;
    }

    // 6. 複製到剪貼簿
    await clipboardService.writeText(result.script!);

    // 7. 顯示成功訊息
    if (result.skippedColumns.length > 0) {
      vscode.window.showInformationMessage(
        SuccessMessages.SCRIPT_COPIED_WITH_SKIPPED(result.rowCount, result.skippedColumns.length)
      );

      // 可選：顯示被跳過的欄位警告
      vscode.window.showWarningMessage(
        WarningMessages.COLUMNS_SKIPPED(result.skippedColumns)
      );
    } else {
      vscode.window.showInformationMessage(
        SuccessMessages.SCRIPT_COPIED(result.rowCount)
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : ErrorMessages.UNKNOWN_ERROR;
    vscode.window.showErrorMessage(message);
  }
}
