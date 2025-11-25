/**
 * SQL DataSeeder - Service Contracts
 * 
 * 這些介面定義了擴充套件的服務層。
 */

import type { IColumnMetadata, IGenerationOptions, IGenerationResult, ITableMetadata } from './types';

/**
 * MSSQL 擴充套件服務
 * 負責與 mssql 擴充套件整合
 */
export interface IMssqlService {
  /**
   * 檢查 mssql 擴充套件是否已安裝並啟用
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * 從 Object Explorer 節點取得連線並執行查詢
   * @param node Object Explorer 的樹節點
   * @param query SQL 查詢語句
   * @returns 查詢結果陣列
   */
  executeQuery<T>(node: unknown, query: string): Promise<T[]>;
  
  /**
   * 從 Object Explorer 節點取得資料表資訊
   * @param node Object Explorer 的樹節點
   * @returns Schema 和 Table 名稱
   */
  getTableInfo(node: unknown): { schemaName: string; tableName: string };
}

/**
 * Schema 服務
 * 負責查詢資料表結構
 */
export interface ISchemaService {
  /**
   * 查詢資料表的欄位結構
   * @param node Object Explorer 的樹節點
   * @returns 資料表結構資訊
   */
  getTableMetadata(node: unknown): Promise<ITableMetadata>;
}

/**
 * 假資料產生服務
 * 負責產生符合欄位定義的假資料
 */
export interface IFakeDataService {
  /**
   * 為指定欄位產生假資料
   * @param column 欄位結構資訊
   * @returns 假資料值（已格式化為 SQL 語法）
   */
  generateValue(column: IColumnMetadata): string;
  
  /**
   * 檢查資料類型是否支援
   * @param dataType 資料類型名稱
   * @returns 是否支援
   */
  isSupported(dataType: string): boolean;
}

/**
 * Insert 語法產生器
 * 負責組合完整的 Insert 語法
 */
export interface IInsertScriptGenerator {
  /**
   * 產生 Insert 語法
   * @param tableMetadata 資料表結構資訊
   * @param options 產生選項
   * @returns 產生結果
   */
  generate(tableMetadata: ITableMetadata, options: IGenerationOptions): IGenerationResult;
}

/**
 * 剪貼簿服務
 * 負責剪貼簿操作
 */
export interface IClipboardService {
  /**
   * 將文字複製到剪貼簿
   * @param text 要複製的文字
   */
  writeText(text: string): Promise<void>;
}

/**
 * 通知服務
 * 負責顯示 VS Code 通知
 */
export interface INotificationService {
  /**
   * 顯示資訊通知
   * @param message 訊息內容
   */
  showInfo(message: string): void;
  
  /**
   * 顯示錯誤通知
   * @param message 訊息內容
   */
  showError(message: string): void;
  
  /**
   * 顯示警告通知
   * @param message 訊息內容
   */
  showWarning(message: string): void;
}
