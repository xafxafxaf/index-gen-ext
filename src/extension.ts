import { IndexFileGenerator } from "./core/generator/file/index-file";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "index-file-generator.generate",
    async (folder: vscode.Uri) => {
      const generator = new IndexFileGenerator(folder.fsPath);
      generator.generate();
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
