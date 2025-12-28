import * as assert from 'assert';
import { ColumnNameSynonymsConfigService } from '../../../services/columnNameSynonymsConfigService';

suite('ColumnNameSynonymsConfigService', () => {
  test('should read valid synonym groups from config', () => {
    const getConfiguration = () => ({
      get: (key: string, _defaultValue?: unknown) => {
        if (key === 'sqlDataSeeder.columnNameSynonyms') {
          return [
            ['身分證字號', '證號'],
            ['手機', '行動電話']
          ];
        }
        return undefined;
      }
    });

    const service = new ColumnNameSynonymsConfigService(getConfiguration as any);
    const result = service.getConfig();

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.groups.length, 2);
    assert.strictEqual(result.groups[0][0], '身分證字號');
  });

  test('should invalidate config when any group is invalid', () => {
    const getConfiguration = () => ({
      get: (key: string, _defaultValue?: unknown) => {
        if (key === 'sqlDataSeeder.columnNameSynonyms') {
          return [
            ['身分證字號', '證號'],
            [''],
            'not-an-array'
          ];
        }
        return undefined;
      }
    });

    const service = new ColumnNameSynonymsConfigService(getConfiguration as any);
    const result = service.getConfig();

    assert.strictEqual(result.isValid, false);
    assert.strictEqual(result.groups.length, 0);
    assert.ok(result.warnings.length >= 1);
  });
});

