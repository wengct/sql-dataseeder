import * as assert from 'assert';
import { escapeSqlString } from '../../../utils/sqlEscape';

suite('escapeSqlString', () => {
  test('should return empty string for empty input', () => {
    assert.strictEqual(escapeSqlString(''), '');
  });

  test('should return same string when no single quotes present', () => {
    assert.strictEqual(escapeSqlString('Hello World'), 'Hello World');
    assert.strictEqual(escapeSqlString('abc123'), 'abc123');
    assert.strictEqual(escapeSqlString('Test Value'), 'Test Value');
  });

  test('should escape single quote to double single quotes', () => {
    assert.strictEqual(escapeSqlString("O'Brien"), "O''Brien");
    assert.strictEqual(escapeSqlString("It's"), "It''s");
  });

  test('should escape multiple single quotes', () => {
    assert.strictEqual(escapeSqlString("'test'"), "''test''");
    assert.strictEqual(escapeSqlString("a'b'c"), "a''b''c");
  });

  test('should handle string with only single quotes', () => {
    assert.strictEqual(escapeSqlString("'"), "''");
    assert.strictEqual(escapeSqlString("'''"), "''''''");
  });

  test('should preserve other special characters', () => {
    assert.strictEqual(escapeSqlString('Hello\nWorld'), 'Hello\nWorld');
    assert.strictEqual(escapeSqlString('Tab\there'), 'Tab\there');
    assert.strictEqual(escapeSqlString('Back\\slash'), 'Back\\slash');
  });

  test('should handle alphanumeric strings (current fake data)', () => {
    // Current implementation generates only alphanumeric characters
    // This test ensures escaping doesn't affect such strings
    assert.strictEqual(escapeSqlString('abcABC123'), 'abcABC123');
    assert.strictEqual(escapeSqlString('XyZ789'), 'XyZ789');
  });
});
