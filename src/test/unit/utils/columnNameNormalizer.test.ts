import * as assert from 'assert';
import { normalizeColumnName } from '../../../utils/columnNameNormalizer';

suite('normalizeColumnName', () => {
  test('should normalize full-width characters and lowercase', () => {
    const normalized = normalizeColumnName('ＡＢＣ１２３');
    assert.strictEqual(normalized, 'abc123');
  });

  test('should normalize mixed language strings consistently', () => {
    const normalized = normalizeColumnName('使用者Email');
    assert.strictEqual(normalized, '使用者email');
  });
});

