import * as vscode from 'vscode';

/**
 * 剪貼簿服務
 * 負責剪貼簿操作
 */
export class ClipboardService {
  /**
   * 將文字複製到剪貼簿
   * @param text 要複製的文字
   */
  async writeText(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
  }
}
