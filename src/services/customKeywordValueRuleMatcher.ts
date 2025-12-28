import { ColumnNameSynonymGroup } from '../models/columnNameSynonyms';
import { CustomKeywordValueRule } from '../models/customKeywordValueRule';
import { normalizeColumnName } from '../utils/columnNameNormalizer';

export class CustomKeywordValueRuleMatcher {
  private readonly regexCache = new Map<string, RegExp>();

  match(
    columnName: string,
    rules: readonly CustomKeywordValueRule[],
    synonymGroups: readonly ColumnNameSynonymGroup[] = []
  ): CustomKeywordValueRule | null {
    const normalizedColumnName = normalizeColumnName(columnName);
    const synonymLookup = this.buildSynonymLookup(synonymGroups);

    for (const rule of rules) {
      if (rule.matchType === 'literal') {
        const normalizedPattern = normalizeColumnName(rule.pattern);
        if (this.isSynonymMatch(normalizedColumnName, normalizedPattern, synonymLookup)) {
          return rule;
        }
        if (normalizedColumnName.includes(normalizedPattern)) {
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

  private buildSynonymLookup(
    groups: readonly ColumnNameSynonymGroup[]
  ): Map<string, Set<string>> | null {
    if (groups.length === 0) {
      return null;
    }

    const lookup = new Map<string, Set<string>>();
    for (const group of groups) {
      const normalizedTerms = group.map((term) => normalizeColumnName(term));
      const termSet = new Set(normalizedTerms);
      for (const term of termSet) {
        lookup.set(term, termSet);
      }
    }

    return lookup;
  }

  private isSynonymMatch(
    normalizedColumnName: string,
    normalizedPattern: string,
    lookup: Map<string, Set<string>> | null
  ): boolean {
    if (!lookup) {
      return false;
    }

    const group = lookup.get(normalizedColumnName);
    return !!group && group.has(normalizedPattern);
  }
}

