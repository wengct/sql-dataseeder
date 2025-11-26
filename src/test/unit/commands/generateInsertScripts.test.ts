import * as assert from 'assert';
import { ErrorMessages, SuccessMessages, WarningMessages, formatErrorMessage } from '../../../utils/errorMessages';

suite('Error Messages', () => {
  suite('ErrorMessages constants', () => {
    test('should have MSSQL extension error messages', () => {
      assert.ok(ErrorMessages.MSSQL_NOT_INSTALLED.includes('MSSQL'));
      assert.ok(ErrorMessages.MSSQL_NOT_ACTIVATED.includes('activated'));
      assert.ok(ErrorMessages.MSSQL_API_UNAVAILABLE.includes('API'));
    });

    test('should have connection error messages', () => {
      assert.ok(ErrorMessages.NO_CONNECTION.includes('connection'));
      assert.ok(ErrorMessages.CONNECTION_LOST.includes('connection'));
      assert.ok(ErrorMessages.CONNECTION_FAILED.includes('connect'));
    });

    test('should have input validation error messages', () => {
      assert.ok(ErrorMessages.INVALID_ROW_COUNT.includes('row count'));
    });

    test('should have table-related error messages', () => {
      assert.ok(ErrorMessages.NO_INSERTABLE_COLUMNS.includes('insertable'));
    });

    test('ACCESS_DENIED should be a function that includes table name', () => {
      const message = ErrorMessages.ACCESS_DENIED('[dbo].[Users]');
      assert.ok(message.includes('[dbo].[Users]'));
      assert.ok(message.includes('Access denied'));
    });

    test('ROW_COUNT_TOO_LARGE should be a function that includes max value', () => {
      const message = ErrorMessages.ROW_COUNT_TOO_LARGE(1000);
      assert.ok(message.includes('1000'));
    });

    test('TABLE_NOT_FOUND should be a function that includes table name', () => {
      const message = ErrorMessages.TABLE_NOT_FOUND('[dbo].[Missing]');
      assert.ok(message.includes('[dbo].[Missing]'));
    });
  });

  suite('SuccessMessages constants', () => {
    test('SCRIPT_COPIED should include row count', () => {
      const message = SuccessMessages.SCRIPT_COPIED(5);
      assert.ok(message.includes('5'));
      assert.ok(message.includes('INSERT'));
      assert.ok(message.includes('clipboard'));
    });

    test('SCRIPT_COPIED should handle singular form', () => {
      const message = SuccessMessages.SCRIPT_COPIED(1);
      assert.ok(message.includes('1'));
      assert.ok(message.includes('statement'));
      assert.ok(!message.includes('statements'));
    });

    test('SCRIPT_COPIED should handle plural form', () => {
      const message = SuccessMessages.SCRIPT_COPIED(10);
      assert.ok(message.includes('statements'));
    });

    test('SCRIPT_COPIED_WITH_SKIPPED should include both counts', () => {
      const message = SuccessMessages.SCRIPT_COPIED_WITH_SKIPPED(5, 2);
      assert.ok(message.includes('5'));
      assert.ok(message.includes('2'));
      assert.ok(message.includes('skipped'));
    });
  });

  suite('WarningMessages constants', () => {
    test('COLUMNS_SKIPPED should list column names', () => {
      const message = WarningMessages.COLUMNS_SKIPPED(['Geo', 'Xml']);
      assert.ok(message.includes('Geo'));
      assert.ok(message.includes('Xml'));
      assert.ok(message.includes('skipped'));
    });
  });

  suite('formatErrorMessage', () => {
    test('should append Error message when error is an Error object', () => {
      const result = formatErrorMessage('Base message.', new Error('Detailed error'));
      assert.ok(result.includes('Base message.'));
      assert.ok(result.includes('Detailed error'));
    });

    test('should append string error directly', () => {
      const result = formatErrorMessage('Base message.', 'String error');
      assert.ok(result.includes('Base message.'));
      assert.ok(result.includes('String error'));
    });

    test('should return base message for unknown error types', () => {
      const result = formatErrorMessage('Base message.', { unknown: 'object' });
      assert.strictEqual(result, 'Base message.');
    });

    test('should return base message for null error', () => {
      const result = formatErrorMessage('Base message.', null);
      assert.strictEqual(result, 'Base message.');
    });

    test('should return base message for undefined error', () => {
      const result = formatErrorMessage('Base message.', undefined);
      assert.strictEqual(result, 'Base message.');
    });
  });
});

suite('Error Handling Scenarios', () => {
  suite('Input validation scenarios', () => {
    test('should validate row count is positive integer', () => {
      // Simulate validation logic
      const validateRowCount = (value: string): string | null => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
          return ErrorMessages.INVALID_ROW_COUNT;
        }
        if (num > 1000) {
          return ErrorMessages.ROW_COUNT_TOO_LARGE(1000);
        }
        return null;
      };

      assert.strictEqual(validateRowCount('10'), null);
      assert.strictEqual(validateRowCount('1'), null);
      assert.strictEqual(validateRowCount('1000'), null);
      
      assert.ok(validateRowCount('0')?.includes('Invalid'));
      assert.ok(validateRowCount('-1')?.includes('Invalid'));
      assert.ok(validateRowCount('abc')?.includes('Invalid'));
      assert.ok(validateRowCount('')?.includes('Invalid'));
      assert.ok(validateRowCount('1001')?.includes('too large'));
    });
  });

  suite('Table metadata scenarios', () => {
    test('should have error message for no insertable columns', () => {
      assert.ok(ErrorMessages.NO_INSERTABLE_COLUMNS.length > 0);
      assert.ok(ErrorMessages.NO_INSERTABLE_COLUMNS.includes('IDENTITY') || 
                ErrorMessages.NO_INSERTABLE_COLUMNS.includes('insertable'));
    });
  });
});
