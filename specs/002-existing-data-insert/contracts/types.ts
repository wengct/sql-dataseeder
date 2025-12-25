/**
 * SQL DataSeeder - 002 Existing Data Insert - Type Contracts
 * 
 * 這些介面定義了從現有資料產生 INSERT 腳本功能的核心資料結構。
 */

import { IColumnMetadata, ITableMetadata, SqlDataType } from '../../../src/models';

/**
 * 使用者輸入的查詢選項
 */
export interface IExistingDataOptions {
  /** 要產生的最大筆數（預設 100） */
  readonly rowCount: number;
  
  /** WHERE 條件（不含 WHERE 關鍵字），null 表示不篩選 */
  readonly whereClause: string | null;
  
  /** ORDER BY 欄位（不含 ORDER BY 關鍵字），null 表示使用預設排序 */
  readonly orderByClause: string | null;
  
  /** 是否包含 IDENTITY 欄位（預設 false） */
  readonly includeIdentity: boolean;
}

/**
 * 預設選項值
 */
export const DEFAULT_EXISTING_DATA_OPTIONS: IExistingDataOptions = {
  rowCount: 100,
  whereClause: null,
  orderByClause: null,
  includeIdentity: false,
};

/**
 * 查詢結果中的單一欄位值
 * 對應 mssql 擴充套件的 IQueryResultCell
 */
export interface IQueryCell {
  /** 顯示值（可能受本地化影響） */
  readonly displayValue: string;
  
  /** 是否為 NULL */
  readonly isNull: boolean;
  
  /** 與文化無關的顯示值（用於數值和日期） */
  readonly invariantCultureDisplayValue?: string;
}

/**
 * 查詢結果中的一筆資料列
 * 欄位名稱對應到欄位值
 */
export interface IQueryRow {
  readonly [columnName: string]: IQueryCell;
}

/**
 * 動態組合的資料查詢
 */
export interface IDataQuery {
  /** 完整資料表名稱 [schema].[table] */
  readonly tableName: string;
  
  /** 要查詢的欄位列表 */
  readonly columns: readonly string[];
  
  /** TOP N 限制 */
  readonly topN: number;
  
  /** WHERE 條件（不含 WHERE 關鍵字） */
  readonly whereClause: string | null;
  
  /** ORDER BY 條件（不含 ORDER BY 關鍵字） */
  readonly orderByClause: string | null;
}

/**
 * 現有資料產生結果
 */
export interface IExistingDataGenerationResult {
  /** 是否成功 */
  readonly success: boolean;
  
  /** 產生的 INSERT 腳本（若成功） */
  readonly script: string | null;
  
  /** 實際產生的筆數 */
  readonly rowCount: number;
  
  /** 被跳過的欄位名稱（不支援的類型） */
  readonly skippedColumns: readonly string[];
  
  /** 錯誤訊息（若失敗） */
  readonly errorMessage: string | null;
  
  /** 是否包含 SET IDENTITY_INSERT */
  readonly hasIdentityInsert: boolean;
}

/**
 * 擴展的資料表中繼資料
 */
export interface IExtendedTableMetadata extends ITableMetadata {
  /** 是否有 IDENTITY 欄位 */
  readonly hasIdentityColumn: boolean;
}

/**
 * 輔助函式：建立成功結果
 */
export function createExistingDataSuccessResult(
  script: string,
  rowCount: number,
  skippedColumns: readonly string[],
  hasIdentityInsert: boolean
): IExistingDataGenerationResult {
  return {
    success: true,
    script,
    rowCount,
    skippedColumns,
    errorMessage: null,
    hasIdentityInsert,
  };
}

/**
 * 輔助函式：建立錯誤結果
 */
export function createExistingDataErrorResult(
  errorMessage: string
): IExistingDataGenerationResult {
  return {
    success: false,
    script: null,
    rowCount: 0,
    skippedColumns: [],
    errorMessage,
    hasIdentityInsert: false,
  };
}

/**
 * 輔助函式：建立空結果
 */
export function createExistingDataEmptyResult(): IExistingDataGenerationResult {
  return {
    success: true,
    script: null,
    rowCount: 0,
    skippedColumns: [],
    errorMessage: null,
    hasIdentityInsert: false,
  };
}

export { SqlDataType, IColumnMetadata, ITableMetadata };
