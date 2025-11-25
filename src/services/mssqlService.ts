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
  connectionId: string;
  serverName: string;
  databaseName: string;
}

/** Connection sharing service */
interface IConnectionSharingService {
  connect(extensionId: string, connectionId: string): Promise<string>;
  executeSimpleQuery(connectionUri: string, query: string): Promise<IQueryResult>;
}

/** Query result */
interface IQueryResult {
  rowCount: number;
  rows: Record<string, unknown>[];
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
  private static readonly EXTENSION_ID = 'sql-dataseeder';

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
   * 從 Object Explorer 節點取得資料表資訊
   */
  getTableInfo(node: unknown): { schemaName: string; tableName: string } {
    const treeNode = node as ITreeNodeInfo;

    if (!treeNode.metadata) {
      throw new Error('Invalid node: missing metadata');
    }

    return {
      schemaName: treeNode.metadata.schema || 'dbo',
      tableName: treeNode.metadata.name || ''
    };
  }

  /**
   * 執行 SQL 查詢
   */
  async executeQuery<T>(node: unknown, query: string): Promise<T[]> {
    const treeNode = node as ITreeNodeInfo;

    if (!treeNode.connectionProfile) {
      throw new Error(ErrorMessages.NO_CONNECTION);
    }

    try {
      const api = await this.getApi();
      const connectionUri = await api.connectionSharing.connect(
        MssqlService.EXTENSION_ID,
        treeNode.connectionProfile.connectionId
      );

      const result = await api.connectionSharing.executeSimpleQuery(connectionUri, query);
      return result.rows as T[];
    } catch (error) {
      throw new Error(formatErrorMessage(ErrorMessages.QUERY_FAILED, error));
    }
  }
}
