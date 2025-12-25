import { TableMetadata } from '../models/tableMetadata';
import { IExistingDataOptions } from '../models/existingDataTypes';
import { ErrorMessages } from '../utils/errorMessages';

/**
 * Build SQL queries to read existing table data.
 */
export class DataQueryBuilder {
  buildSelectQuery(table: TableMetadata, options: IExistingDataOptions): string {
    this.ensureSafeClause(options.whereClause, 'WHERE');
    this.ensureSafeClause(options.orderByClause, 'ORDER BY');

    const tableName = this.buildQualifiedTableName(table);

    const topN = Math.max(1, Math.floor(options.rowCount));
    let sql = `SELECT TOP ${topN} *\nFROM ${tableName} WITH (NOLOCK)`;

    if (options.whereClause) {
      sql += `\nWHERE ${options.whereClause}`;
    }

    if (options.orderByClause) {
      sql += `\nORDER BY ${options.orderByClause}`;
    }

    return sql;
  }

  private buildQualifiedTableName(table: TableMetadata): string {
    const schemaPart = this.escapeIdentifier(table.schemaName);
    const tablePart = this.escapeIdentifier(table.tableName);

    if (table.databaseName) {
      const databasePart = this.escapeIdentifier(table.databaseName);
      return `${databasePart}.${schemaPart}.${tablePart}`;
    }

    return `${schemaPart}.${tablePart}`;
  }

  private escapeIdentifier(name: string): string {
    return `[${name.replace(/]/g, ']]')}]`;
  }

  private ensureSafeClause(clause: string | null, clauseType: 'WHERE' | 'ORDER BY'): void {
    if (!clause) {
      return;
    }

    const dangerousPatterns: readonly RegExp[] = [
      /;/, // statement terminator
      /--/, // inline comment
      /\/\*/, // block comment start
      /\b(drop|delete|truncate|alter|insert|update|exec|execute|sp_|xp_|create|merge|grant|revoke)\b/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(clause)) {
        throw new Error(ErrorMessages.UNSAFE_SQL_CLAUSE(clauseType));
      }
    }
  }
}
