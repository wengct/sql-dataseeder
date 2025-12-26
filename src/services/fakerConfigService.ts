import * as vscode from 'vscode';
import {
  DEFAULT_FAKER_CONFIG,
  FakerConfig,
  FakerLocale
} from '../models/fieldPattern';

type GetConfiguration = (section?: string) => Pick<vscode.WorkspaceConfiguration, 'get'>;

export class FakerConfigService {
  constructor(private readonly getConfiguration: GetConfiguration = vscode.workspace.getConfiguration) {}

  getConfig(): FakerConfig {
    const config = this.getConfiguration('sqlDataSeeder.faker');
    return {
      enabled: config.get<boolean>('enabled', DEFAULT_FAKER_CONFIG.enabled),
      locale: this.validateLocale(config.get<string>('locale', DEFAULT_FAKER_CONFIG.locale))
    };
  }

  isEnabled(): boolean {
    return this.getConfig().enabled;
  }

  getLocale(): FakerLocale {
    return this.getConfig().locale;
  }

  private validateLocale(locale: string): FakerLocale {
    const normalized = (locale ?? '')
      .trim()
      .replace('-', '_')
      .toLowerCase();

    return normalized === 'zh_tw' ? 'zh_TW' : 'en';
  }
}
