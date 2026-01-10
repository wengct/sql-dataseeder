import { ColumnMetadata, isColumnInsertable } from './columnMetadata';

/**
 * 資料表結構資訊
 */
export interface TableMetadata {
  /** Schema 名稱（如 dbo） */
  readonly schemaName: string;

  /** 資料表名稱 */
  readonly tableName: string;

  /** 資料庫名稱（可選） */
  readonly databaseName?: string;

  /** 所有欄位的結構資訊 */
  readonly columns: readonly ColumnMetadata[];

  /** 是否包含 IDENTITY 欄位 */
  readonly hasIdentityColumn: boolean;
}

/**
 * 取得資料表的完整名稱（含 schema）
 * @param table 資料表結構
 * @returns 格式化的完整名稱 [database].[schema].[table] 或 [schema].[table]
 */
export function getFullTableName(table: TableMetadata): string {
  const quoteBracketIdentifier = (name: string): string => `[${name.replace(/]/g, ']]')}]`;

  const schemaPart = quoteBracketIdentifier(table.schemaName);
  const tablePart = quoteBracketIdentifier(table.tableName);
  const databaseName = table.databaseName?.trim();

  if (databaseName) {
    const databasePart = quoteBracketIdentifier(databaseName);
    return `${databasePart}.${schemaPart}.${tablePart}`;
  }

  return `${schemaPart}.${tablePart}`;
}

/**
 * 取得可插入的欄位列表
 * 過濾掉 IDENTITY、COMPUTED 和不支援類型的欄位
 * @param table 資料表結構
 * @returns 可插入的欄位陣列
 */
export function getInsertableColumns(table: TableMetadata): ColumnMetadata[] {
  return table.columns.filter(isColumnInsertable);
}
