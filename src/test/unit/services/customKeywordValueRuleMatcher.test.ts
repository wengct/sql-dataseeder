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

  test('should match Chinese literal patterns', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: '證號', matchType: 'literal', value: 'ID' }
    ];

    const match = matcher.match('證號', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 'ID');
  });

  test('should match synonyms before literal contains', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: '身分證字號', matchType: 'literal', value: 'ID' }
    ];
    const synonyms = [['身分證字號', '證號']];

    const match = matcher.match('證號', rules, synonyms);
    assert.ok(match);
    assert.strictEqual(match?.value, 'ID');
  });

  test('should not match when not in synonym groups', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: '身分證字號', matchType: 'literal', value: 'ID' }
    ];
    const synonyms = [['身分證字號', '證號']];

    const match = matcher.match('護照號碼', rules, synonyms);
    assert.strictEqual(match, null);
  });

  test('should keep English literal contains behavior', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: 'status', matchType: 'literal', value: 'ACTIVE' }
    ];

    const match = matcher.match('OrderStatus', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 'ACTIVE');
  });

  test('should keep English regex behavior', () => {
    const matcher = new CustomKeywordValueRuleMatcher();
    const rules: CustomKeywordValueRule[] = [
      { pattern: 'Id$', matchType: 'regex', value: 99 }
    ];

    const match = matcher.match('TenantId', rules);
    assert.ok(match);
    assert.strictEqual(match?.value, 99);
  });
});

