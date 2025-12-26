import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function getOutputChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel('SQL DataSeeder');
  }
  return channel;
}

export function appendOutputLine(line: string): void {
  getOutputChannel().appendLine(line);
}

export function showOutputChannel(preserveFocus = true): void {
  getOutputChannel().show(preserveFocus);
}
