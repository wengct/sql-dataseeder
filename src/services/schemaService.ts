import { SqlDataType, parseSqlDataType } from '../models/sqlDataType';
import { ColumnMetadata } from '../models/columnMetadata';
import { TableMetadata } from '../models/tableMetadata';
import { MssqlService } from './mssqlService';

/**
 * SQL 查詢結果的欄位資訊（從 sys.columns 查詢）
 */
interface IColumnQueryResult {
  column_name: string;
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
  is_nullable: boolean;
  is_identity: boolean;
  is_computed: boolean;
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
    const { schemaName, tableName } = this.mssqlService.getTableInfo(node);
    const query = SchemaService.buildSchemaQuery(schemaName, tableName);

    const results = await this.mssqlService.executeQuery<IColumnQueryResult>(node, query);

    const columns = results.map(SchemaService.parseColumnQueryResult);

    return SchemaService.buildTableMetadata(schemaName, tableName, columns);
  }

  /**
   * 建立查詢資料表結構的 SQL 語句
   */
  static buildSchemaQuery(schemaName: string, tableName: string): string {
    return `
SELECT 
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
WHERE c.object_id = OBJECT_ID('[${schemaName}].[${tableName}]')
ORDER BY c.column_id;
`.trim();
  }

  /**
   * 解析 SQL 查詢結果為 ColumnMetadata
   */
  static parseColumnQueryResult(row: IColumnQueryResult): ColumnMetadata {
    const dataType = parseSqlDataType(row.data_type);

    // 對於 nvarchar/nchar，max_length 是 bytes，需要轉換為字元數
    let maxLength: number | null = row.max_length;
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
      name: row.column_name,
      dataType,
      maxLength: isStringType ? maxLength : null,
      precision: isDecimalType ? row.precision : null,
      scale: isDecimalType ? row.scale : null,
      isNullable: row.is_nullable,
      isIdentity: row.is_identity,
      isComputed: row.is_computed
    };
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
