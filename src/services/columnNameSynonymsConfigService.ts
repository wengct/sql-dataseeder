import * as vscode from 'vscode';
import { ColumnNameSynonymGroup, validateColumnNameSynonymGroup } from '../models/columnNameSynonyms';
import { appendOutputLine, showOutputChannel } from '../utils/outputChannel';

type GetConfiguration = (section?: string) => Pick<vscode.WorkspaceConfiguration, 'get'>;

export interface ColumnNameSynonymsConfigResult {
  readonly groups: readonly ColumnNameSynonymGroup[];
  readonly warnings: readonly string[];
  readonly isValid: boolean;
}

export class ColumnNameSynonymsConfigService {
  private cached: ColumnNameSynonymsConfigResult | undefined;

  constructor(private readonly getConfiguration: GetConfiguration = vscode.workspace.getConfiguration) {}

  getConfig(): ColumnNameSynonymsConfigResult {
    if (this.cached) {
      return this.cached;
    }

    const config = this.getConfiguration();
    const warnings: string[] = [];

    const rawGroups = config.get<unknown>('sqlDataSeeder.columnNameSynonyms', []);
    if (!Array.isArray(rawGroups)) {
      const result = {
        groups: [],
        warnings: ['sqlDataSeeder.columnNameSynonyms must be an array of string arrays.'],
        isValid: false
      };
      this.writeWarningsOnce(result.warnings);
      this.cached = result;
      return result;
    }

    const groups: ColumnNameSynonymGroup[] = [];
    for (const raw of rawGroups) {
      const validated = validateColumnNameSynonymGroup(raw);
      if (!validated.group) {
        if (validated.warning) {
          warnings.push(validated.warning);
        }
        continue;
      }
      groups.push(validated.group);
    }

    if (warnings.length > 0) {
      const result = { groups: [], warnings, isValid: false };
      this.writeWarningsOnce(result.warnings);
      this.cached = result;
      return result;
    }

    const result = { groups, warnings, isValid: true };
    this.cached = result;
    return result;
  }

  private writeWarningsOnce(warnings: readonly string[]): void {
    if (warnings.length === 0) {
      return;
    }

    for (const warning of warnings) {
      appendOutputLine(`[ColumnNameSynonyms] ${warning}`);
    }

    showOutputChannel(true);
  }
}

