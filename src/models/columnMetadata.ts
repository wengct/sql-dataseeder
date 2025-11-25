import { SqlDataType, SUPPORTED_DATA_TYPES } from './sqlDataType';

/**
 * 欄位結構資訊
 */
export interface ColumnMetadata {
  /** 欄位名稱 */
  readonly name: string;

  /** SQL Server 資料類型 */
  readonly dataType: SqlDataType;

  /** 最大長度（字元數），null 表示無限制或不適用，-1 表示 MAX */
  readonly maxLength: number | null;

  /** 精確度（用於 decimal/numeric） */
  readonly precision: number | null;

  /** 小數位數（用於 decimal/numeric） */
  readonly scale: number | null;

  /** 是否可為 NULL */
  readonly isNullable: boolean;

  /** 是否為 IDENTITY 欄位 */
  readonly isIdentity: boolean;

  /** 是否為 COMPUTED 欄位 */
  readonly isComputed: boolean;
}

/**
 * 檢查資料類型是否支援
 * @param dataType SQL 資料類型
 * @returns 是否為支援的資料類型
 */
export function isColumnSupported(dataType: SqlDataType): boolean {
  return SUPPORTED_DATA_TYPES.includes(dataType);
}

/**
 * 檢查欄位是否可插入
 * 規則：不是 IDENTITY、不是 COMPUTED、且資料類型受支援
 * @param column 欄位結構資訊
 * @returns 是否可插入
 */
export function isColumnInsertable(column: ColumnMetadata): boolean {
  return !column.isIdentity && !column.isComputed && isColumnSupported(column.dataType);
}
