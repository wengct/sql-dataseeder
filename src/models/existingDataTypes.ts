/**
 * Types for generating INSERT scripts from existing table data
 */

import { GenerationResult } from './generationTypes';

export interface IExistingDataOptions {
  readonly rowCount: number;
  readonly whereClause: string | null;
  readonly orderByClause: string | null;
  readonly includeIdentity: boolean;
}

export interface IQueryCell {
  readonly displayValue: string;
  readonly isNull: boolean;
  readonly invariantCultureDisplayValue?: string;
}

export interface IQueryRow {
  readonly [columnName: string]: IQueryCell;
}

export interface IDataQuery {
  readonly tableName: string;
  readonly columns: readonly string[];
  readonly topN: number;
  readonly whereClause: string | null;
  readonly orderByClause: string | null;
}

export interface IExistingDataGenerationResult extends GenerationResult {
  readonly hasIdentityInsert: boolean;
}
