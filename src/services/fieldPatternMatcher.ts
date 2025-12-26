import {
  DEFAULT_FIELD_PATTERNS,
  FieldMatchResult,
  FieldPattern
} from '../models/fieldPattern';

export class FieldPatternMatcher {
  private readonly patterns: readonly FieldPattern[];

  constructor(patterns: readonly FieldPattern[] = DEFAULT_FIELD_PATTERNS) {
    this.patterns = [...patterns].sort((a, b) => b.patternLength - a.patternLength);
  }

  match(columnName: string): FieldMatchResult {
    for (const pattern of this.patterns) {
      if (pattern.regex.test(columnName)) {
        return { matched: true, pattern, columnName };
      }
    }

    return { matched: false, columnName };
  }

  getPatterns(): readonly FieldPattern[] {
    return this.patterns;
  }
}
