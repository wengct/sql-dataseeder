// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { generateInsertScripts } from './commands/generateInsertScripts';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('SQL DataSeeder extension is now active!');

	// Register the generateInsertScripts command
	const generateInsertScriptsCommand = vscode.commands.registerCommand(
		'sql-dataseeder.generateInsertScripts',
		generateInsertScripts
	);

	context.subscriptions.push(generateInsertScriptsCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
