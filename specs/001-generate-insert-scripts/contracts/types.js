"use strict";
/**
 * SQL DataSeeder - Type Contracts
 *
 * 這些介面定義了擴充套件的核心資料結構。
 * 實作時應遵循這些介面，確保類型安全。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlDataType = void 0;
/**
 * 支援的 SQL Server 資料類型
 */
var SqlDataType;
(function (SqlDataType) {
    // 字串類型
    SqlDataType["VARCHAR"] = "varchar";
    SqlDataType["NVARCHAR"] = "nvarchar";
    SqlDataType["CHAR"] = "char";
    SqlDataType["NCHAR"] = "nchar";
    // 整數類型
    SqlDataType["INT"] = "int";
    SqlDataType["BIGINT"] = "bigint";
    SqlDataType["SMALLINT"] = "smallint";
    SqlDataType["TINYINT"] = "tinyint";
    // 浮點數類型
    SqlDataType["DECIMAL"] = "decimal";
    SqlDataType["NUMERIC"] = "numeric";
    SqlDataType["FLOAT"] = "float";
    SqlDataType["REAL"] = "real";
    // 日期時間類型
    SqlDataType["DATETIME"] = "datetime";
    SqlDataType["DATETIME2"] = "datetime2";
    SqlDataType["DATE"] = "date";
    SqlDataType["TIME"] = "time";
    // 其他類型
    SqlDataType["BIT"] = "bit";
    SqlDataType["UNIQUEIDENTIFIER"] = "uniqueidentifier";
    // 不支援的類型
    SqlDataType["UNSUPPORTED"] = "unsupported";
})(SqlDataType || (exports.SqlDataType = SqlDataType = {}));
//# sourceMappingURL=types.js.map