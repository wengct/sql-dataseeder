import * as assert from 'assert';
import { FieldPatternMatcher } from '../../services/fieldPatternMatcher';

suite('FieldPatternMatcher', () => {
  test('should match firstname over name (longest match wins)', () => {
    const matcher = new FieldPatternMatcher();
    const result = matcher.match('FirstName');

    assert.ok(result.matched);
    assert.strictEqual(result.pattern?.id, 'firstname');
  });

  test('should match case-insensitively', () => {
    const matcher = new FieldPatternMatcher();
    const result = matcher.match('EMAIL');

    assert.ok(result.matched);
    assert.strictEqual(result.pattern?.id, 'email');
  });

  test('should return unmatched result when no pattern matches', () => {
    const matcher = new FieldPatternMatcher();
    const result = matcher.match('SomeRandomColumn');

    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.pattern, undefined);
  });
});
