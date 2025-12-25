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
  BINARY = 'binary',
  VARBINARY = 'varbinary',

  // 不支援的類型
  UNSUPPORTED = 'unsupported'
}

/**
 * 支援的資料類型列表（不包含 UNSUPPORTED）
 */
export const SUPPORTED_DATA_TYPES: readonly SqlDataType[] = [
  SqlDataType.VARCHAR,
  SqlDataType.NVARCHAR,
  SqlDataType.CHAR,
  SqlDataType.NCHAR,
  SqlDataType.INT,
  SqlDataType.BIGINT,
  SqlDataType.SMALLINT,
  SqlDataType.TINYINT,
  SqlDataType.DECIMAL,
  SqlDataType.NUMERIC,
  SqlDataType.FLOAT,
  SqlDataType.REAL,
  SqlDataType.DATETIME,
  SqlDataType.DATETIME2,
  SqlDataType.DATE,
  SqlDataType.TIME,
  SqlDataType.BIT,
  SqlDataType.UNIQUEIDENTIFIER,
  SqlDataType.BINARY,
  SqlDataType.VARBINARY
] as const;

/**
 * 將 SQL Server 資料類型名稱解析為 SqlDataType 列舉
 * @param typeName SQL Server 資料類型名稱
 * @returns 對應的 SqlDataType 列舉值
 */
export function parseSqlDataType(typeName: string): SqlDataType {
  const normalizedName = typeName.toLowerCase().trim();

  for (const dataType of SUPPORTED_DATA_TYPES) {
    if (dataType === normalizedName) {
      return dataType;
    }
  }

  return SqlDataType.UNSUPPORTED;
}
