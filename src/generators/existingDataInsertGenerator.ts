import { ColumnMetadata } from '../models/columnMetadata';
import { TableMetadata, getFullTableName } from '../models/tableMetadata';
import { IExistingDataOptions, IExistingDataGenerationResult, IQueryRow } from '../models/existingDataTypes';
import { SqlDataType } from '../models/sqlDataType';
import { ErrorMessages } from '../utils/errorMessages';
import { formatValueForSql } from '../utils/sqlEscape';

export class ExistingDataInsertGenerator {
  generate(
    tableMetadata: TableMetadata,
    rows: IQueryRow[],
    options: IExistingDataOptions
  ): IExistingDataGenerationResult {
    const insertableColumns = this.getInsertableColumns(tableMetadata.columns, options.includeIdentity);
    const skippedColumns = this.getSkippedUnsupportedColumns(tableMetadata.columns);

    if (insertableColumns.length === 0) {
      return {
        success: false,
        script: null,
        rowCount: 0,
        skippedColumns: [],
        errorMessage: ErrorMessages.NO_INSERTABLE_COLUMNS,
        hasIdentityInsert: false
      };
    }

    if (rows.length === 0) {
      return {
        success: true,
        script: null,
        rowCount: 0,
        skippedColumns,
        errorMessage: null,
        hasIdentityInsert: false
      };
    }

    const tableName = getFullTableName(tableMetadata);
    const columnList = this.buildColumnList(insertableColumns);

    const scripts: string[] = [];
    for (const row of rows) {
      const valueList = this.buildValueList(insertableColumns, row);
      scripts.push(`INSERT INTO ${tableName} (${columnList}) VALUES (${valueList});`);
    }

    const body = scripts.join('\n');
    const hasIdentityInsert = options.includeIdentity && tableMetadata.hasIdentityColumn;
    const script = hasIdentityInsert
      ? `SET IDENTITY_INSERT ${tableName} ON;\n${body}\nSET IDENTITY_INSERT ${tableName} OFF;`
      : body;

    return {
      success: true,
      script,
      rowCount: rows.length,
      skippedColumns,
      errorMessage: null,
      hasIdentityInsert
    };
  }

  private getInsertableColumns(columns: readonly ColumnMetadata[], includeIdentity: boolean): ColumnMetadata[] {
    return columns.filter(col => {
      if (col.isComputed) {
        return false;
      }
      if (!includeIdentity && col.isIdentity) {
        return false;
      }
      return col.dataType !== SqlDataType.UNSUPPORTED;
    });
  }

  private getSkippedUnsupportedColumns(tableColumns: readonly ColumnMetadata[]): string[] {
    return tableColumns
      .filter(col => col.dataType === SqlDataType.UNSUPPORTED && !col.isIdentity && !col.isComputed)
      .map(col => col.name);
  }

  private buildColumnList(columns: readonly ColumnMetadata[]): string {
    return columns.map(col => `[${col.name}]`).join(', ');
  }

  private buildValueList(columns: readonly ColumnMetadata[], row: IQueryRow): string {
    return columns.map(col => {
      const cell = row[col.name] ?? { displayValue: '', isNull: true };
      return formatValueForSql(cell, col);
    }).join(', ');
  }
}
