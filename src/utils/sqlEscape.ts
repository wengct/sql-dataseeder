/**
 * SQL 字串跳脫工具
 * 提供 SQL 字串值的跳脫功能，防止 SQL 注入和語法錯誤
 */

/**
 * 跳脫 SQL 字串中的單引號
 * 將 ' 替換為 '' (兩個單引號)，這是 SQL 標準的字串跳脫方式
 * @param value 要跳脫的字串
 * @returns 跳脫後的字串
 */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}
