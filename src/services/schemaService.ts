import { SqlDataType, parseSqlDataType } from '../models/sqlDataType';
import { ColumnMetadata } from '../models/columnMetadata';
import { TableMetadata } from '../models/tableMetadata';
import { MssqlService } from './mssqlService';

/**
 * SQL 查詢結果的欄位資訊（從 sys.columns 查詢）
 * 注意：mssql API 回傳字串格式的值，但也支援原始類型以保持向後相容
 */
export interface IColumnQueryResult {
  column_name?: string;
  COLUMN_NAME?: string;
  data_type?: string;
  DATA_TYPE?: string;
  max_length?: number | string;
  MAX_LENGTH?: number | string;
  precision?: number | string;
  PRECISION?: number | string;
  scale?: number | string;
  SCALE?: number | string;
  is_nullable?: boolean | number | string;
  IS_NULLABLE?: boolean | number | string;
  is_identity?: boolean | number | string;
  IS_IDENTITY?: boolean | number | string;
  is_computed?: boolean | number | string;
  IS_COMPUTED?: boolean | number | string;
}

/**
 * Schema 服務
 * 負責查詢資料表結構
 */
export class SchemaService {
  constructor(private readonly mssqlService: MssqlService) {}

  /**
   * 查詢資料表的欄位結構
   * @param node Object Explorer 的樹節點
   * @returns 資料表結構資訊
   */
  async getTableMetadata(node: unknown): Promise<TableMetadata> {
    const { schemaName, tableName, databaseName } = this.mssqlService.getTableInfo(node);
    const query = SchemaService.buildSchemaQuery(schemaName, tableName, databaseName);

    const results = await this.mssqlService.executeQuery<IColumnQueryResult>(node, query);

    const columns = results.map(SchemaService.parseColumnQueryResult);

    return SchemaService.buildTableMetadata(schemaName, tableName, columns);
  }

  /**
   * 建立查詢資料表結構的 SQL 語句
   */
  static buildSchemaQuery(schemaName: string, tableName: string, databaseName?: string): string {
    // 如果有資料庫名稱，使用 USE 語句切換資料庫，使用 QUOTENAME() 防止 SQL 注入
    const useDatabase = databaseName ? `USE ${SchemaService.quoteBracketIdentifier(databaseName)};\n` : '';
    
    // 使用 QUOTENAME() 函數進行 SQL Server 識別碼跳脫，防止 SQL 注入攻擊
    // 將識別碼作為字串字面值傳入 QUOTENAME()，由 SQL Server 處理跳脫
    const quotedSchema = SchemaService.quoteStringLiteral(schemaName);
    const quotedTable = SchemaService.quoteStringLiteral(tableName);
    
    return `${useDatabase}SELECT 
    c.name AS column_name,
    t.name AS data_type,
    c.max_length,
    c.precision,
    c.scale,
    c.is_nullable,
    c.is_identity,
    c.is_computed
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID(QUOTENAME(${quotedSchema}) + '.' + QUOTENAME(${quotedTable}))
ORDER BY c.column_id;`.trim();
  }

  /**
   * 使用方括號包圍 SQL Server 識別碼，並跳脫內部的右方括號
   * 適用於 USE 語句等不支援 QUOTENAME() 的情況
   * @param identifier 識別碼
   * @returns 跳脫後的識別碼
   */
  static quoteBracketIdentifier(identifier: string): string {
    // 將右方括號替換為兩個右方括號以防止 SQL 注入
    const escaped = identifier.replace(/]/g, ']]');
    return `[${escaped}]`;
  }

  /**
   * 將字串轉換為 SQL 字串字面值，供 QUOTENAME() 函數使用
   * 使用單引號包圍字串，並將內部的單引號替換為兩個單引號
   * @param value 字串值
   * @returns SQL 字串字面值
   */
  static quoteStringLiteral(value: string): string {
    // 將單引號替換為兩個單引號以防止 SQL 注入
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
  }

  /**
   * 解析 SQL 查詢結果為 ColumnMetadata
   */
  static parseColumnQueryResult(row: IColumnQueryResult): ColumnMetadata {
    // 處理不同大小寫的欄位名稱
    const columnName = row.column_name ?? row.COLUMN_NAME ?? '';
    const dataTypeName = row.data_type ?? row.DATA_TYPE ?? '';
    const maxLengthRaw = row.max_length ?? row.MAX_LENGTH ?? 0;
    const precisionRaw = row.precision ?? row.PRECISION ?? 0;
    const scaleRaw = row.scale ?? row.SCALE ?? 0;
    const isNullableRaw = row.is_nullable ?? row.IS_NULLABLE ?? false;
    const isIdentityRaw = row.is_identity ?? row.IS_IDENTITY ?? false;
    const isComputedRaw = row.is_computed ?? row.IS_COMPUTED ?? false;

    // 轉換布林值（mssql API 回傳字串 'true'/'false' 或 '1'/'0'）
    const isNullable = SchemaService.parseBooleanValue(isNullableRaw);
    const isIdentity = SchemaService.parseBooleanValue(isIdentityRaw);
    const isComputed = SchemaService.parseBooleanValue(isComputedRaw);

    const dataType = parseSqlDataType(dataTypeName);

    // 解析數值（mssql API 回傳的是字串）
    const maxLengthNum = SchemaService.parseNumberValue(maxLengthRaw);
    const precisionNum = SchemaService.parseNumberValue(precisionRaw);
    const scaleNum = SchemaService.parseNumberValue(scaleRaw);

    // 對於 nvarchar/nchar，max_length 是 bytes，需要轉換為字元數
    let maxLength: number | null = maxLengthNum;
    if (maxLength !== -1 && (dataType === SqlDataType.NVARCHAR || dataType === SqlDataType.NCHAR)) {
      maxLength = Math.floor(maxLength / 2);
    }

    // 只有字串類型需要 maxLength，數值類型不需要
    const isStringType = [
      SqlDataType.VARCHAR,
      SqlDataType.NVARCHAR,
      SqlDataType.CHAR,
      SqlDataType.NCHAR
    ].includes(dataType);

    // 只有 decimal/numeric 需要 precision 和 scale
    const isDecimalType = [SqlDataType.DECIMAL, SqlDataType.NUMERIC].includes(dataType);

    return {
      name: columnName,
      dataType,
      maxLength: isStringType ? maxLength : null,
      precision: isDecimalType ? precisionNum : null,
      scale: isDecimalType ? scaleNum : null,
      isNullable,
      isIdentity,
      isComputed
    };
  }

  /**
   * 解析布林值（處理字串 'true'/'false'、'1'/'0'、數字 1/0、布林值）
   */
  static parseBooleanValue(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1';
    }
    return false;
  }

  /**
   * 解析數值（處理字串或數字）
   */
  static parseNumberValue(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  /**
   * 建立 TableMetadata 物件
   */
  static buildTableMetadata(
    schemaName: string,
    tableName: string,
    columns: ColumnMetadata[]
  ): TableMetadata {
    return {
      schemaName,
      tableName,
      columns
    };
  }
}
