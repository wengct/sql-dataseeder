import { CustomKeywordValueRule } from '../models/customKeywordValueRule';

export class CustomKeywordValueRuleMatcher {
  private readonly regexCache = new Map<string, RegExp>();

  match(columnName: string, rules: readonly CustomKeywordValueRule[]): CustomKeywordValueRule | null {
    const lowerColumnName = columnName.toLowerCase();

    for (const rule of rules) {
      if (rule.matchType === 'literal') {
        if (lowerColumnName.includes(rule.pattern.toLowerCase())) {
          return rule;
        }
        continue;
      }

      // regex
      const regex = this.getRegex(rule.pattern);
      if (regex && regex.test(columnName)) {
        return rule;
      }
    }

    return null;
  }

  private getRegex(pattern: string): RegExp | null {
    const cached = this.regexCache.get(pattern);
    if (cached) {
      return cached;
    }

    try {
      const regex = new RegExp(pattern, 'i');
      this.regexCache.set(pattern, regex);
      return regex;
    } catch {
      return null;
    }
  }
}
