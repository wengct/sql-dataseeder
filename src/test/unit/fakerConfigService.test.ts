import * as assert from 'assert';
import { FakerConfigService } from '../../services/fakerConfigService';

suite('FakerConfigService', () => {
  test('should return defaults when config values are missing', () => {
    const svc = new FakerConfigService(() => ({
      get: <T>(_key: string, defaultValue?: T): T | undefined => defaultValue
    }));

    const config = svc.getConfig();
    assert.strictEqual(config.enabled, true);
    assert.strictEqual(config.locale, 'en');
  });

  test('should validate locale and fall back to en for unknown locales', () => {
    const svc = new FakerConfigService(() => ({
      get: <T>(key: string, defaultValue?: T): T | undefined => {
        if (key === 'locale') {
          return 'xx_YY' as unknown as T;
        }
        return defaultValue;
      }
    }));

    assert.strictEqual(svc.getLocale(), 'en');
  });

  test('should accept zh-TW and normalize to zh_TW', () => {
    const svc = new FakerConfigService(() => ({
      get: <T>(key: string, defaultValue?: T): T | undefined => {
        if (key === 'locale') {
          return 'zh-TW' as unknown as T;
        }
        return defaultValue;
      }
    }));

    assert.strictEqual(svc.getLocale(), 'zh_TW');
  });

  test('should read enabled=false from config', () => {
    const svc = new FakerConfigService(() => ({
      get: <T>(key: string, defaultValue?: T): T | undefined => {
        if (key === 'enabled') {
          return false as unknown as T;
        }
        return defaultValue;
      }
    }));

    assert.strictEqual(svc.isEnabled(), false);
  });
});
