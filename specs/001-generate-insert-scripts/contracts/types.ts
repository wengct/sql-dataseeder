/**
 * SQL DataSeeder - Type Contracts
 * 
 * 這些介面定義了擴充套件的核心資料結構。
 * 實作時應遵循這些介面，確保類型安全。
 */

/**
 * 支援的 SQL Server 資料類型
 */
export enum SqlDataType {
  // 字串類型
  VARCHAR = 'varchar',
  NVARCHAR = 'nvarchar',
  CHAR = 'char',
  NCHAR = 'nchar',
  
  // 整數類型
  INT = 'int',
  BIGINT = 'bigint',
  SMALLINT = 'smallint',
  TINYINT = 'tinyint',
  
  // 浮點數類型
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',
  FLOAT = 'float',
  REAL = 'real',
  
  // 日期時間類型
  DATETIME = 'datetime',
  DATETIME2 = 'datetime2',
  DATE = 'date',
  TIME = 'time',
  
  // 其他類型
  BIT = 'bit',
  UNIQUEIDENTIFIER = 'uniqueidentifier',
  
  // 不支援的類型
  UNSUPPORTED = 'unsupported'
}

/**
 * 欄位結構資訊
 */
export interface IColumnMetadata {
  /** 欄位名稱 */
  readonly name: string;
  
  /** SQL Server 資料類型 */
  readonly dataType: SqlDataType;
  
  /** 最大長度（字元數），null 表示無限制或不適用 */
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
 * 資料表結構資訊
 */
export interface ITableMetadata {
  /** Schema 名稱（如 dbo） */
  readonly schemaName: string;
  
  /** 資料表名稱 */
  readonly tableName: string;
  
  /** 所有欄位的結構資訊 */
  readonly columns: readonly IColumnMetadata[];
}

/**
 * 產生選項
 */
export interface IGenerationOptions {
  /** 要產生的筆數（預設 10） */
  readonly rowCount: number;
}

/**
 * 產生結果
 */
export interface IGenerationResult {
  /** 是否成功 */
  readonly success: boolean;
  
  /** 產生的 Insert 語法（若成功） */
  readonly script: string | null;
  
  /** 實際產生的筆數 */
  readonly rowCount: number;
  
  /** 被跳過的欄位名稱（不支援的類型） */
  readonly skippedColumns: readonly string[];
  
  /** 錯誤訊息（若失敗） */
  readonly errorMessage: string | null;
}

/**
 * SQL 查詢結果的欄位資訊（從 sys.columns 查詢）
 */
export interface IColumnQueryResult {
  column_name: string;
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
  is_nullable: boolean;
  is_identity: boolean;
  is_computed: boolean;
}
