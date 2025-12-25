/**
 * SQL DataSeeder - 002 Existing Data Insert - Service Contracts
 * 
 * 定義服務層的介面，確保實作符合規格。
 */

import { 
  IExistingDataOptions, 
  IExistingDataGenerationResult, 
  IQueryRow,
  IDataQuery,
  IExtendedTableMetadata 
} from './types';

/**
 * 資料查詢服務介面
 * 負責從資料庫查詢現有資料
 */
export interface IDataQueryService {
  /**
   * 從資料庫查詢資料
   * @param node Object Explorer 節點
   * @param query 查詢定義
   * @returns 查詢結果列
   */
  queryData(node: unknown, query: IDataQuery): Promise<IQueryRow[]>;
  
  /**
   * 建立查詢 SQL
   * @param query 查詢定義
   * @returns SQL 語句
   */
  buildQuerySql(query: IDataQuery): string;
}

/**
 * 現有資料 INSERT 產生器介面
 * 負責將查詢結果轉換為 INSERT 腳本
 */
export interface IExistingDataInsertGenerator {
  /**
   * 從查詢結果產生 INSERT 腳本
   * @param tableMetadata 資料表結構
   * @param rows 查詢結果
   * @param options 產生選項
   * @returns 產生結果
   */
  generate(
    tableMetadata: IExtendedTableMetadata,
    rows: IQueryRow[],
    options: IExistingDataOptions
  ): IExistingDataGenerationResult;
}

/**
 * 值格式化器介面
 * 負責將查詢結果值轉換為 SQL 字面量
 */
export interface IValueFormatter {
  /**
   * 將欄位值格式化為 SQL 字面量
   * @param cell 欄位值
   * @param dataType 資料型別
   * @returns SQL 字面量字串
   */
  formatValue(cell: { displayValue: string; isNull: boolean; invariantCultureDisplayValue?: string }, dataType: string): string;
}

/**
 * 指令處理器介面
 * 負責協調使用者互動與產生流程
 */
export interface IGenerateExistingInsertCommand {
  /**
   * 執行指令
   * @param node Object Explorer 節點（從右鍵選單傳入）
   */
  execute(node: unknown): Promise<void>;
}

/**
 * 使用者選項收集器介面
 * 負責透過 VS Code UI 收集使用者輸入
 */
export interface IOptionsCollector {
  /**
   * 收集使用者選項
   * @param hasIdentityColumn 資料表是否有 IDENTITY 欄位
   * @returns 使用者選項，若使用者取消則為 null
   */
  collectOptions(hasIdentityColumn: boolean): Promise<IExistingDataOptions | null>;
}
