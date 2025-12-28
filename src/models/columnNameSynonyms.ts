export type ColumnNameSynonymGroup = readonly string[];

export interface ColumnNameSynonymsConfig {
  readonly groups: readonly ColumnNameSynonymGroup[];
}

export function validateColumnNameSynonymGroup(input: unknown): { group?: ColumnNameSynonymGroup; warning?: string } {
  if (!Array.isArray(input)) {
    return { warning: 'Synonym group must be an array.' };
  }

  if (input.length < 2) {
    return { warning: 'Synonym group must contain at least 2 terms.' };
  }

  const terms = input.filter((term) => typeof term === 'string' && term.trim().length > 0) as string[];
  if (terms.length !== input.length) {
    return { warning: 'Synonym group terms must be non-empty strings.' };
  }

  return { group: terms };
}

