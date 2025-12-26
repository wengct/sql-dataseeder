import * as assert from 'assert';
import { CustomKeywordValuesConfigService } from '../../../services/customKeywordValuesConfigService';

suite('CustomKeywordValuesConfigService', () => {
  test('should read rules from config and return rules + warnings', () => {
    const getConfiguration = () => ({
      get: (key: string, _defaultValue?: unknown) => {
        if (key === 'sqlDataSeeder.customKeywordValues.rules') {
          return [
            { pattern: 'tenantid', matchType: 'literal', value: 1 },
            { pattern: '', matchType: 'literal', value: 2 },
            { matchType: 'literal', value: 3 },
            { pattern: 'status', matchType: 'unknown', value: 'ACTIVE' },
            { pattern: '[', matchType: 'regex', value: 0 }
          ];
        }
        return undefined;
      }
    });

    const service = new CustomKeywordValuesConfigService(getConfiguration as any);
    const result = service.getConfig();

    assert.strictEqual(result.rules.length, 1);
    assert.strictEqual(result.rules[0].pattern, 'tenantid');
    assert.ok(result.warnings.length >= 1);
    assert.ok(result.warnings.some((w) => w.includes('regex')));
  });
});
