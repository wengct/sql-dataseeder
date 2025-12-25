/**
 * 錯誤訊息常數
 * 提供清楚的錯誤說明和解決建議
 */

export const ErrorMessages = {
  // mssql 擴充套件相關
  MSSQL_NOT_INSTALLED: 'MSSQL extension is not installed. Please install the SQL Server (mssql) extension.',
  MSSQL_NOT_ACTIVATED: 'MSSQL extension is not activated. Please wait for it to activate or restart VS Code.',
  MSSQL_API_UNAVAILABLE: 'MSSQL extension API is unavailable. Please ensure you have the latest version of the mssql extension.',

  // 連線相關
  NO_CONNECTION: 'No active database connection. Please connect to a database using the MSSQL extension first.',
  CONNECTION_LOST: 'Database connection lost. Please reconnect to the database.',
  CONNECTION_FAILED: 'Failed to connect to the database. Please check your connection settings.',

  // 權限相關
  ACCESS_DENIED: (tableName: string) => `Access denied to table ${tableName}. Please ensure you have SELECT permission on this table.`,

  // 輸入驗證
  INVALID_ROW_COUNT: 'Invalid row count. Row count must be a positive integer.',
  ROW_COUNT_TOO_LARGE: (max: number) => `Row count too large. Maximum allowed is ${max}.`,

  // 資料表相關
  NO_INSERTABLE_COLUMNS: 'No insertable columns found. All columns are either IDENTITY, COMPUTED, or unsupported types.',
  TABLE_NOT_FOUND: (tableName: string) => `Table ${tableName} not found.`,

  // 查詢相關
  QUERY_FAILED: 'Failed to query table structure. Please try again.',
  DATA_QUERY_FAILED: 'Failed to query table data. Please try again.',
  QUERY_TIMEOUT: 'Query timed out. Please try again.',
  QUERY_RESULT_NO_COLUMNS: 'Query result has no column information. The query may have returned an empty result set.',
  TABLE_EMPTY: (tableName: string) => `Table ${tableName} has no data.`,
  QUERY_NO_RESULTS: 'No data matching the specified conditions.',
  QUERY_SYNTAX_ERROR: (error: string) => `Query failed: ${error}. Please check your WHERE/ORDER BY clause.`,
  UNSAFE_SQL_CLAUSE: (clauseType: 'WHERE' | 'ORDER BY') =>
    `${clauseType} clause contains potentially dangerous SQL. Avoid statements like DROP, DELETE, INSERT, UPDATE, ALTER, TRUNCATE, EXEC, CREATE, comments, or statement separators.`,

  // 一般錯誤
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
  OPERATION_CANCELLED: 'Operation cancelled by user.'
} as const;

/**
 * 成功訊息常數
 */
export const SuccessMessages = {
  SCRIPT_COPIED: (rowCount: number) => `Generated ${rowCount} INSERT statement${rowCount > 1 ? 's' : ''} and copied to clipboard.`,
  SCRIPT_COPIED_WITH_SKIPPED: (rowCount: number, skippedCount: number) =>
    `Generated ${rowCount} INSERT statement${rowCount > 1 ? 's' : ''} and copied to clipboard. ${skippedCount} column${skippedCount > 1 ? 's were' : ' was'} skipped (unsupported type).`
} as const;

/**
 * 警告訊息常數
 */
export const WarningMessages = {
  COLUMNS_SKIPPED: (columnNames: readonly string[]) =>
    `The following columns were skipped (unsupported types): ${columnNames.join(', ')}`
} as const;

/**
 * 格式化錯誤訊息，包含原始錯誤資訊
 */
export function formatErrorMessage(baseMessage: string, error: unknown): string {
  if (error instanceof Error) {
    return `${baseMessage} Error: ${error.message}`;
  }
  if (typeof error === 'string') {
    return `${baseMessage} Error: ${error}`;
  }
  return baseMessage;
}
