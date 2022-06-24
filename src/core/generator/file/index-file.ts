import * as _fs from "fs";
import * as _path from "path";
import { File } from "./file";

import * as vscode from "vscode";

const pascalCaseReg = /([A-Z][a-z0-9]+)+/;

/**
 * @returns {string}
 */
const toPascalCase = (str: string) => {
  const words = str.match(/[a-z]+/gi);
  if (!words) {
    return "";
  }
  return words
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
    })
    .join("");
};

export class IndexFileGenerator extends File {
  constructor(private processDirectory: string) {
    super([]);
    this.processDirectory = processDirectory;
  }

  /**
   * Препроцесс имени файла
   * @returns {string}
   */
  private preprocess(filePath: string) {
    const name = _path.parse(filePath).name;
    return pascalCaseReg.test(name) ? name : toPascalCase(name);
  }

  private indexJSExists(filePath: string) {
    const indexjs = _path.resolve(filePath, "index.js");
    return _fs.existsSync(indexjs);
  }

  private exportES6(name: string, filePath: string, isDirectory: boolean) {
    return isDirectory
      ? `export * from './${filePath}'`
      : `export { default as ${name} } from './${filePath}'`;
  }

  /**
   * Сгенерировать export 'линию'
   */
  private export(name: string, filePath: string) {
    const isDirectory = _fs.statSync(filePath).isDirectory();
    const relativePath = _path.relative(this.processDirectory, filePath);
    if (!this.indexJSExists(filePath) && isDirectory) {
      return `// : Directory './${relativePath}' have not index.js :`;
    }
    return this.exportES6(name, relativePath, isDirectory);
  }

  private readdir(): string[] {
    let files = _fs.readdirSync(this.processDirectory);
    if (files.length === 0) {
      vscode.window.showErrorMessage("В этой директории нет файлов!");
      return [];
    }
    if (files.includes("index.js")) {
      files = files.filter((file: string) => file !== "index.js");
    }

    return files;
  }

  generate() {
    this.add("// : Generated by xaf-index-generator :").skip();
    const files = this.readdir();

    for (const file of files) {
      try {
        const preprocessedName = this.preprocess(file);
        const resolvedPath = _path.resolve(this.processDirectory, file);
        const exportRow = this.export(preprocessedName, resolvedPath);
        this.add(exportRow);
      } catch (e: any) {
        this.add(`// : Error : ${e.message}`);
      }
    }

    _fs.writeFileSync(
      _path.resolve(this.processDirectory, "index.js"),
      this.get(),
      { encoding: "utf-8" }
    );

    vscode.window.showInformationMessage("Файл index.js сгенерирован!");
  }
}