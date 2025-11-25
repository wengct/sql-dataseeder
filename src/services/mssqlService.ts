import * as vscode from 'vscode';
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
      console.warn('No columnInfo in query result, returning empty array');
      return [];
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
    // 除錯：輸出節點的關鍵屬性（避免循環引用問題）
    const nodeObj = node as Record<string, unknown>;
    console.log('Node keys:', Object.keys(nodeObj));
    console.log('Node metadata:', nodeObj.metadata);
    console.log('Node _metadata:', nodeObj._metadata);
    console.log('Node label:', nodeObj.label);
    console.log('Node nodeType:', nodeObj.nodeType);
    console.log('Node _nodeType:', nodeObj._nodeType);

    const treeNode = node as ITreeNodeInfo;

    // 嘗試從不同屬性取得 metadata
    const metadata = treeNode.metadata || (nodeObj._metadata as ITreeNodeInfo['metadata']);
    
    if (!metadata) {
      console.log('Node has no metadata property');
      throw new Error('Invalid node: missing metadata');
    }

    console.log('Found metadata - schema:', metadata.schema, 'name:', metadata.name);

    // 取得資料庫名稱 - 從 connectionProfile 或向上遍歷節點樹
    const connectionProfile = treeNode.connectionProfile || (nodeObj._connectionProfile as IConnectionProfile);
    let databaseName = connectionProfile?.database || '';
    
    // 如果 connectionProfile 沒有資料庫名稱，嘗試從節點路徑解析
    if (!databaseName) {
      const nodePath = nodeObj._nodePath as string;
      console.log('Node path:', nodePath);
      // 節點路徑格式: server/Databases(本地化)/DatabaseName/Tables(本地化)/schema.tableName
      // 例如: .\SQLExpress/資料庫/M13/資料表/dbo.M13APIKeyIP
      if (nodePath) {
        const pathParts = nodePath.split('/').filter(p => p);
        console.log('Path parts:', pathParts);
        // 資料庫名稱是第三個部分（index 2）
        // [0] = server, [1] = Databases folder, [2] = database name, [3] = Tables folder, [4] = table
        if (pathParts.length >= 3) {
          databaseName = pathParts[2];
        }
      }
    }

    console.log('Database name:', databaseName);

    return {
      schemaName: metadata.schema || 'dbo',
      tableName: metadata.name || '',
      databaseName
    };
  }

  /**
   * 執行 SQL 查詢
   */
  async executeQuery<T>(node: unknown, query: string): Promise<T[]> {
    const treeNode = node as ITreeNodeInfo;
    const nodeObj = node as Record<string, unknown>;

    if (!treeNode.connectionProfile) {
      // 嘗試從 _connectionProfile 取得
      const connProfile = nodeObj._connectionProfile as IConnectionProfile;
      if (!connProfile) {
        throw new Error(ErrorMessages.NO_CONNECTION);
      }
      console.log('Using _connectionProfile:', connProfile.id, connProfile.server, connProfile.database);
    } else {
      console.log('Using connectionProfile:', treeNode.connectionProfile.id, treeNode.connectionProfile.server, treeNode.connectionProfile.database);
    }

    // 取得 connectionProfile（支援 getter 和直接屬性）
    const connectionProfile = treeNode.connectionProfile || (nodeObj._connectionProfile as IConnectionProfile);
    
    if (!connectionProfile) {
      throw new Error(ErrorMessages.NO_CONNECTION);
    }

    const api = await this.getApi();
    
    let connectionUri: string | undefined;
    try {
      console.log('Connecting with profile id:', connectionProfile.id);
      connectionUri = await api.connectionSharing.connect(
        MssqlService.EXTENSION_ID,
        connectionProfile.id
      );
      console.log('Connection URI:', connectionUri);
    } catch (connectError) {
      // 重新拋出連線錯誤，保留原始訊息
      throw connectError;
    }

    if (!connectionUri) {
      throw new Error(ErrorMessages.CONNECTION_FAILED);
    }

    try {
      console.log('Executing query...');
      const result = await api.connectionSharing.executeSimpleQuery(connectionUri, query);
      console.log('Query result rowCount:', result.rowCount);
      
      // 將陣列格式的結果轉換為物件格式
      const parsedRows = MssqlService.parseQueryRows(result);
      console.log('Parsed rows:', parsedRows);
      return parsedRows as T[];
    } catch (queryError) {
      throw new Error(formatErrorMessage(ErrorMessages.QUERY_FAILED, queryError));
    }
  }
}
