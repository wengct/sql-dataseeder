import { ColumnMetadata } from '../models/columnMetadata';
import { TableMetadata, getFullTableName, getInsertableColumns } from '../models/tableMetadata';
import { GenerationOptions, GenerationResult, createSuccessResult, createErrorResult } from '../models/generationTypes';
import { SqlDataType } from '../models/sqlDataType';
import { FakeDataService } from '../services/fakeDataService';
import { ErrorMessages } from '../utils/errorMessages';

/**
 * Insert 語法產生器
 * 負責組合完整的 Insert 語法
 */
export class InsertScriptGenerator {
  constructor(private readonly fakeDataService: FakeDataService) {}

  /**
   * 產生 Insert 語法
   * @param tableMetadata 資料表結構資訊
   * @param options 產生選項
   * @returns 產生結果
   */
  generate(tableMetadata: TableMetadata, options: GenerationOptions): GenerationResult {
    // 取得可插入的欄位
    const insertableColumns = getInsertableColumns(tableMetadata);

    // 找出被跳過的欄位（UNSUPPORTED 類型，不包含 IDENTITY/COMPUTED）
    const skippedColumns = this.getSkippedUnsupportedColumns(tableMetadata);

    // 檢查是否有可插入的欄位
    if (insertableColumns.length === 0) {
      return createErrorResult(ErrorMessages.NO_INSERTABLE_COLUMNS);
    }

    // 產生 INSERT 語法
    const scripts: string[] = [];
    const tableName = getFullTableName(tableMetadata);
    const columnList = this.buildColumnList(insertableColumns);

    for (let i = 0; i < options.rowCount; i++) {
      const valueList = this.buildValueList(insertableColumns);
      const insertStatement = `INSERT INTO ${tableName} (${columnList}) VALUES (${valueList});`;
      scripts.push(insertStatement);
    }

    const script = scripts.join('\n');

    return createSuccessResult(script, options.rowCount, skippedColumns);
  }

  /**
   * 取得被跳過的不支援類型欄位
   * 只包含 UNSUPPORTED 類型，不包含 IDENTITY/COMPUTED
   */
  private getSkippedUnsupportedColumns(tableMetadata: TableMetadata): string[] {
    return tableMetadata.columns
      .filter(col => col.dataType === SqlDataType.UNSUPPORTED && !col.isIdentity && !col.isComputed)
      .map(col => col.name);
  }

  /**
   * 建立欄位列表字串
   * 格式: [Column1], [Column2], ...
   */
  private buildColumnList(columns: readonly ColumnMetadata[]): string {
    return columns.map(col => `[${col.name}]`).join(', ');
  }

  /**
   * 建立數值列表字串
   * 格式: 'value1', 123, ...
   */
  private buildValueList(columns: readonly ColumnMetadata[]): string {
    return columns.map(col => this.fakeDataService.generateValue(col)).join(', ');
  }
}
