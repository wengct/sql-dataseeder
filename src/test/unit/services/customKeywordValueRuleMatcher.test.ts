import * as assert from 'assert';
import { CustomKeywordValueRuleMatcher } from '../../../services/customKeywordValueRuleMatcher';
import { CustomKeywordValueRule } from '../../../models/customKeywordValueRule';

suite('CustomKeywordValueRuleMatcher', () => {
  test('should match literal contains case-insensitively', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: 'tenantid', matchType: 'literal', value: 1 }
    ];

    const match = matcher.match('TenantId', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 1);
  });

  test('should return first match when multiple rules match', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: 'id', matchType: 'literal', value: 1 },
      { pattern: 'tenantid', matchType: 'literal', value: 2 }
    ];

    const match = matcher.match('TenantId', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 1);
  });

  test('should match regex case-insensitively', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: '^is_', matchType: 'regex', value: 0 }
    ];

    const match = matcher.match('Is_Active', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 0);
  });
});
