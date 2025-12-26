import * as vscode from 'vscode';
import { CustomKeywordValueRule, validateCustomKeywordValueRule } from '../models/customKeywordValueRule';
import { appendOutputLine, showOutputChannel } from '../utils/outputChannel';

type GetConfiguration = (section?: string) => Pick<vscode.WorkspaceConfiguration, 'get'>;

export interface CustomKeywordValuesConfigResult {
  readonly rules: readonly CustomKeywordValueRule[];
  readonly warnings: readonly string[];
}

export class CustomKeywordValuesConfigService {
  private cached: CustomKeywordValuesConfigResult | undefined;

  constructor(private readonly getConfiguration: GetConfiguration = vscode.workspace.getConfiguration) {}

  getConfig(): CustomKeywordValuesConfigResult {
    if (this.cached) {
      return this.cached;
    }

    const config = this.getConfiguration();
    const warnings: string[] = [];

    const rawRules = config.get<unknown>('sqlDataSeeder.customKeywordValues.rules', []);
    if (!Array.isArray(rawRules)) {
      const result = {
        rules: [],
        warnings: ['sqlDataSeeder.customKeywordValues.rules must be an array.']
      };
      this.writeWarningsOnce(result.warnings);
      this.cached = result;
      return result;
    }

    const rules: CustomKeywordValueRule[] = [];
    for (const raw of rawRules) {
      const validated = validateCustomKeywordValueRule(raw);
      if (!validated.rule) {
        if (validated.warning) {
          warnings.push(validated.warning);
        }
        continue;
      }

      if (validated.rule.matchType === 'regex') {
        try {
          // Validate compilation early so matcher won't throw during generation.
          // Always case-insensitive per spec.
          new RegExp(validated.rule.pattern, 'i');
        } catch {
          warnings.push(`Custom keyword value rule regex is invalid: ${validated.rule.pattern}`);
          continue;
        }
      }

      rules.push(validated.rule);
    }

    const result = { rules, warnings };
    this.writeWarningsOnce(result.warnings);
    this.cached = result;
    return result;
  }

  private writeWarningsOnce(warnings: readonly string[]): void {
    if (warnings.length === 0) {
      return;
    }

    for (const warning of warnings) {
      appendOutputLine(`[CustomKeywordValues] ${warning}`);
    }

    showOutputChannel(true);
  }
}
