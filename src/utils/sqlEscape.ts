/**
 * SQL 字串跳脫工具
 * 提供 SQL 字串值的跳脫功能，防止 SQL 注入和語法錯誤
 */

/**
 * 跳脫 SQL 字串中的單引號
 * 將 ' 替換為 '' (兩個單引號)，這是 SQL 標準的字串跳脫方式
 * @param value 要跳脫的字串
 * @returns 跳脫後的字串
 */
import { ColumnMetadata } from '../models/columnMetadata';
import { SqlDataType } from '../models/sqlDataType';
import { IQueryCell } from '../models/existingDataTypes';

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Format a query result cell value as a SQL literal based on column data type.
 */
export function formatValueForSql(cell: IQueryCell, column: ColumnMetadata): string {
  if (cell.isNull) {
    return 'NULL';
  }

  const value = cell.invariantCultureDisplayValue ?? cell.displayValue;

  switch (column.dataType) {
    case SqlDataType.NVARCHAR:
    case SqlDataType.NCHAR:
      return `N'${escapeSqlString(value)}'`;

    case SqlDataType.VARCHAR:
    case SqlDataType.CHAR:
      return `'${escapeSqlString(value)}'`;

    case SqlDataType.INT:
    case SqlDataType.BIGINT:
    case SqlDataType.SMALLINT:
    case SqlDataType.TINYINT:
    case SqlDataType.DECIMAL:
    case SqlDataType.NUMERIC:
    case SqlDataType.FLOAT:
    case SqlDataType.REAL:
      return value;

    case SqlDataType.DATETIME:
    case SqlDataType.DATETIME2:
    case SqlDataType.DATE:
    case SqlDataType.TIME:
      return `'${value}'`;

    case SqlDataType.BIT: {
      const normalized = value.toLowerCase();
      return normalized === 'true' || value === '1' ? '1' : '0';
    }

    case SqlDataType.UNIQUEIDENTIFIER:
      return `'${value}'`;

    case SqlDataType.BINARY:
    case SqlDataType.VARBINARY:
      return value.startsWith('0x') ? value : `0x${value}`;

    default:
      return `'${escapeSqlString(value)}'`;
  }
}

export function formatCustomKeywordValueForSql(value: string | number | null, column: ColumnMetadata): string {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  const escaped = escapeSqlString(value);
  switch (column.dataType) {
    case SqlDataType.NVARCHAR:
    case SqlDataType.NCHAR:
      return `N'${escaped}'`;

    default:
      return `'${escaped}'`;
  }
}
