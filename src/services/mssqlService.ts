import * as vscode from 'vscode';
import { IQueryRow } from '../models/existingDataTypes';
import { ErrorMessages, formatErrorMessage } from '../utils/errorMessages';

/**
 * mssql 擴充套件 API 型別定義
 * 基於 vscode-mssql 的公開 API
 */

/** Tree node info from Object Explorer */
interface ITreeNodeInfo {
  nodeType: string;
  metadata?: {
    name?: string;
    schema?: string;
  };
  connectionProfile?: IConnectionProfile;
}

/** Connection profile */
interface IConnectionProfile {
  id: string;
  server: string;
  database: string;
}

/** Connection sharing service */
interface IConnectionSharingService {
  connect(extensionId: string, connectionId: string): Promise<string | undefined>;
  executeSimpleQuery(connectionUri: string, query: string): Promise<IQueryResult>;
  editConnectionSharingPermissions(extensionId: string): Promise<string | undefined>;
}

/** Query result cell - 每個欄位值的格式 */
interface IQueryResultCell {
  displayValue: string;
  isNull: boolean;
  invariantCultureDisplayValue?: string;
}

/** Query result row - 陣列形式的欄位值 */
type QueryResultRow = IQueryResultCell[];

/** Query result */
interface IQueryResult {
  rowCount: number;
  columnInfo: Array<{ columnName: string }>;
  rows: QueryResultRow[];
}

/** mssql extension exports */
interface IMssqlExtension {
  connectionSharing: IConnectionSharingService;
}

/**
 * MSSQL 服務
 * 負責與 mssql 擴充套件整合
 */
export class MssqlService {
  private static readonly MSSQL_EXTENSION_ID = 'ms-mssql.mssql';
  private static readonly EXTENSION_ID = 'wengct.sql-dataseeder';

  private mssqlApi: IMssqlExtension | null = null;

  /**
   * 檢查 mssql 擴充套件是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const extension = vscode.extensions.getExtension<IMssqlExtension>(MssqlService.MSSQL_EXTENSION_ID);
      return extension !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * 取得 mssql 擴充套件 API
   */
  private async getApi(): Promise<IMssqlExtension> {
    if (this.mssqlApi) {
      return this.mssqlApi;
    }

    const extension = vscode.extensions.getExtension<IMssqlExtension>(MssqlService.MSSQL_EXTENSION_ID);

    if (!extension) {
      throw new Error(ErrorMessages.MSSQL_NOT_INSTALLED);
    }

    if (!extension.isActive) {
      await extension.activate();
    }

    const api = extension.exports;
    if (!api || !api.connectionSharing) {
      throw new Error(ErrorMessages.MSSQL_API_UNAVAILABLE);
    }

    this.mssqlApi = api;
    return api;
  }

  /**
   * 將 mssql API 回傳的陣列格式轉換為物件格式
   * @param result 查詢結果
   * @returns 轉換後的物件陣列
   */
  static parseQueryRows(result: IQueryResult): Record<string, unknown>[] {
    const { columnInfo, rows } = result;
    
    // 如果沒有 columnInfo，無法轉換
    if (!columnInfo || columnInfo.length === 0) {
      throw new Error(ErrorMessages.QUERY_RESULT_NO_COLUMNS);
    }

    return rows.map(row => {
      const obj: Record<string, unknown> = {};
      columnInfo.forEach((col, index) => {
        const cell = row[index];
        if (cell) {
          // 根據 isNull 判斷是否為 NULL 值
          if (cell.isNull) {
            obj[col.columnName] = null;
          } else {
            obj[col.columnName] = cell.displayValue;
          }
        }
      });
      return obj;
    });
  }

  /**
   * 從 Object Explorer 節點取得資料表資訊
   */
  getTableInfo(node: unknown): { schemaName: string; tableName: string; databaseName: string } {
    const nodeObj = node as Record<string, unknown>;
    const treeNode = node as ITreeNodeInfo;

    // 嘗試從不同屬性取得 metadata
    const metadata = treeNode.metadata || (nodeObj._metadata as ITreeNodeInfo['metadata']);
    
    if (!metadata) {
      throw new Error('Invalid node: missing metadata');
    }

    // 取得資料庫名稱 - 從 connectionProfile 或向上遍歷節點樹
    const connectionProfile = treeNode.connectionProfile || (nodeObj._connectionProfile as IConnectionProfile);
    let databaseName = connectionProfile?.database || '';
    
    // 如果 connectionProfile 沒有資料庫名稱，嘗試從節點路徑解析
    if (!databaseName) {
      const nodePath = nodeObj._nodePath as string;
      // 節點路徑格式: server/Databases(本地化)/DatabaseName/Tables(本地化)/schema.tableName
      // 例如: .\SQLExpress/資料庫/M13/資料表/dbo.M13APIKeyIP
      if (nodePath) {
        const pathParts = nodePath.split('/').filter(p => p);
        // 資料庫名稱是第三個部分（index 2）
        // [0] = server, [1] = Databases folder, [2] = database name, [3] = Tables folder, [4] = table
        if (pathParts.length >= 3) {
          databaseName = pathParts[2];
        }
      }
    }

    const fallbackObjectName = typeof nodeObj._nodePath === 'string'
      ? nodeObj._nodePath.split('/').filter(Boolean).at(-1) ?? ''
      : '';

    const { schemaName, tableName } = MssqlService.parseTableIdentifier(
      metadata.schema,
      metadata.name,
      fallbackObjectName
    );

    return {
      schemaName,
      tableName,
      databaseName
    };
  }

  private static parseTableIdentifier(
    schemaName: string | undefined,
    objectName: string | undefined,
    fallbackObjectName: string
  ): { schemaName: string; tableName: string } {
    const normalizedSchema = MssqlService.unquoteIdentifier(schemaName ?? '').trim();
    const candidateName = (objectName ?? '').trim() || fallbackObjectName.trim();
    const parts = MssqlService.splitQualifiedIdentifier(candidateName)
      .map(part => MssqlService.unquoteIdentifier(part).trim())
      .filter(Boolean);

    if (normalizedSchema) {
      return {
        schemaName: normalizedSchema,
        tableName: parts.at(-1) ?? ''
      };
    }

    if (parts.length >= 2) {
      return {
        schemaName: parts.at(-2) ?? 'dbo',
        tableName: parts.at(-1) ?? ''
      };
    }

    return {
      schemaName: 'dbo',
      tableName: parts[0] ?? ''
    };
  }

  private static splitQualifiedIdentifier(identifier: string): string[] {
    if (!identifier) {
      return [];
    }

    const parts: string[] = [];
    let current = '';
    let insideBrackets = false;

    for (let i = 0; i < identifier.length; i++) {
      const char = identifier[i];

      if (char === '[') {
        insideBrackets = true;
        current += char;
        continue;
      }

      if (char === ']' && insideBrackets) {
        if (identifier[i + 1] === ']') {
          current += ']]';
          i++;
          continue;
        }

        insideBrackets = false;
        current += char;
        continue;
      }

      if (char === '.' && !insideBrackets) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      parts.push(current.trim());
    }

    return parts;
  }

  private static unquoteIdentifier(identifier: string): string {
    const trimmed = identifier.trim();

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return trimmed.slice(1, -1).replace(/]]/g, ']');
    }

    return trimmed;
  }

  /**
   * 執行 SQL 查詢
   */
  async executeQuery<T>(node: unknown, query: string, databaseName?: string): Promise<T[]> {
    try {
      const result = await this.executeSimpleQuery(node, query, databaseName);

      // 將陣列格式的結果轉換為物件格式
      const parsedRows = MssqlService.parseQueryRows(result);
      return parsedRows as T[];
    } catch (queryError) {
      throw new Error(formatErrorMessage(ErrorMessages.QUERY_FAILED, queryError));
    }
  }

  /**
   * Query table data and return cell objects (includes invariantCultureDisplayValue).
   */
  async queryTableData(node: unknown, query: string, databaseName?: string): Promise<IQueryRow[]> {
    const { api, connectionUri } = await this.getQueryContext(node);

    try {
      const result = await this.executeSimpleQueryWithConnection(api, connectionUri, query, databaseName);

      if (!result.columnInfo || result.columnInfo.length === 0) {
        throw new Error(ErrorMessages.QUERY_RESULT_NO_COLUMNS);
      }

      return result.rows.map(row => {
        const obj: Record<string, unknown> = {};
        result.columnInfo.forEach((col, index) => {
          const cell = row[index];
          if (cell) {
            obj[col.columnName] = cell;
          } else {
            obj[col.columnName] = { displayValue: '', isNull: true };
          }
        });
        return obj as IQueryRow;
      });
    } catch (queryError) {
      throw new Error(formatErrorMessage(ErrorMessages.DATA_QUERY_FAILED, queryError));
    }
  }

  private getConnectionProfile(node: unknown): IConnectionProfile {
    const treeNode = node as ITreeNodeInfo;
    const nodeObj = node as Record<string, unknown>;

    if (!treeNode.connectionProfile) {
      const connProfile = nodeObj._connectionProfile as IConnectionProfile;
      if (!connProfile) {
        throw new Error(ErrorMessages.NO_CONNECTION);
      }
    }

    const connectionProfile = treeNode.connectionProfile || (nodeObj._connectionProfile as IConnectionProfile);
    if (!connectionProfile) {
      throw new Error(ErrorMessages.NO_CONNECTION);
    }

    return connectionProfile;
  }

  private async getQueryContext(node: unknown): Promise<{ api: IMssqlExtension; connectionUri: string }> {
    const connectionProfile = this.getConnectionProfile(node);
    const api = await this.getApi();

    const connectionUri = await api.connectionSharing.connect(
      MssqlService.EXTENSION_ID,
      connectionProfile.id
    );

    if (!connectionUri) {
      throw new Error(ErrorMessages.CONNECTION_FAILED);
    }

    return { api, connectionUri };
  }

  private async executeSimpleQuery(node: unknown, query: string, databaseName?: string): Promise<IQueryResult> {
    const { api, connectionUri } = await this.getQueryContext(node);
    return this.executeSimpleQueryWithConnection(api, connectionUri, query, databaseName);
  }

  private async executeSimpleQueryWithConnection(
    api: IMssqlExtension,
    connectionUri: string,
    query: string,
    databaseName?: string
  ): Promise<IQueryResult> {
    const normalizedDatabaseName = databaseName?.trim();
    if (!normalizedDatabaseName) {
      return api.connectionSharing.executeSimpleQuery(connectionUri, query);
    }

    const contextInfo = await this.getConnectionContextInfo(api, connectionUri);
    const { currentDatabaseName, supportsUseStatement } = contextInfo;

    if (!currentDatabaseName || MssqlService.equalsDatabaseName(currentDatabaseName, normalizedDatabaseName)) {
      return api.connectionSharing.executeSimpleQuery(connectionUri, query);
    }

    if (!supportsUseStatement) {
      throw new Error(
        ErrorMessages.AZURE_SQL_DATABASE_CONNECTION_MISMATCH(
          currentDatabaseName || 'unknown',
          normalizedDatabaseName
        )
      );
    }

    const scopedQuery = MssqlService.buildDatabaseScopedQuery(normalizedDatabaseName, query);
    try {
      return await api.connectionSharing.executeSimpleQuery(connectionUri, scopedQuery);
    } catch (error) {
      if (MssqlService.isUseStatementNotSupportedError(error)) {
        return api.connectionSharing.executeSimpleQuery(connectionUri, query);
      }
      throw error;
    }
  }

  private async getConnectionContextInfo(
    api: IMssqlExtension,
    connectionUri: string
  ): Promise<{ currentDatabaseName: string; supportsUseStatement: boolean }> {
    const result = await api.connectionSharing.executeSimpleQuery(
      connectionUri,
      `SELECT
    DB_NAME() AS current_database,
    CAST(SERVERPROPERTY('EngineEdition') AS int) AS engine_edition;`
    );

    const rows = MssqlService.parseQueryRows(result);
    const databaseName = rows[0]?.current_database;
    const engineEdition = rows[0]?.engine_edition;

    return {
      currentDatabaseName: typeof databaseName === 'string' ? databaseName.trim() : '',
      supportsUseStatement: MssqlService.supportsUseStatement(engineEdition)
    };
  }

  private static buildDatabaseScopedQuery(databaseName: string, query: string): string {
    return `USE ${MssqlService.quoteBracketIdentifier(databaseName)};\n${query}`;
  }

  private static quoteBracketIdentifier(identifier: string): string {
    const escaped = identifier.replace(/]/g, ']]');
    return `[${escaped}]`;
  }

  private static equalsDatabaseName(left: string, right: string): boolean {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  }

  private static supportsUseStatement(engineEdition: unknown): boolean {
    const parsed = typeof engineEdition === 'number'
      ? engineEdition
      : typeof engineEdition === 'string'
        ? Number.parseInt(engineEdition, 10)
        : Number.NaN;

    // Azure SQL Database (EngineEdition = 5) 不支援 USE 切換資料庫。
    return parsed !== 5;
  }

  private static isUseStatementNotSupportedError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    return error.message.includes('40508') || /USE statement is not supported/i.test(error.message);
  }

}
