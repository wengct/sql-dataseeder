export type CustomKeywordValueMatchType = 'literal' | 'regex';

export type CustomKeywordValue = string | number | null;

export interface CustomKeywordValueRule {
  readonly pattern: string;
  readonly matchType: CustomKeywordValueMatchType;
  readonly value: CustomKeywordValue;
}

export function validateCustomKeywordValueRule(input: unknown): { rule?: CustomKeywordValueRule; warning?: string } {
  if (!input || typeof input !== 'object') {
    return { warning: 'Custom keyword value rule must be an object.' };
  }

  const rule = input as { pattern?: unknown; matchType?: unknown; value?: unknown };

  if (typeof rule.pattern !== 'string' || rule.pattern.trim().length === 0) {
    return { warning: 'Custom keyword value rule pattern is required.' };
  }

  if (rule.matchType !== 'literal' && rule.matchType !== 'regex') {
    return { warning: `Custom keyword value rule matchType is invalid: ${String(rule.matchType)}` };
  }

  if (rule.value === undefined) {
    return { warning: 'Custom keyword value rule value is required.' };
  }

  if (rule.value !== null && typeof rule.value !== 'string' && typeof rule.value !== 'number') {
    return { warning: 'Custom keyword value rule value must be string, number, or null.' };
  }

  return {
    rule: {
      pattern: rule.pattern,
      matchType: rule.matchType,
      value: rule.value
    }
  };
}
