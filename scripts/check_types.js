const ts = require("typescript");
const path = require("path");

function checkTypeScript() {
  const configPath = ts.findConfigFile("./", ts.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    console.error("tsconfig.json introuvable");
    process.exit(1);
  }

  const readConfigFileResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (readConfigFileResult.error) {
    console.error(readConfigFileResult.error);
    process.exit(1);
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    readConfigFileResult.config,
    ts.sys,
    path.dirname(configPath)
  );

  // Filtrer uniquement les fichiers src
  const srcFiles = parsedConfig.fileNames.filter(f => f.includes("src"));
  console.log(`Vérification TypeScript de ${srcFiles.length} fichiers sources...`);

  const program = ts.createProgram(srcFiles, {
    ...parsedConfig.options,
    noEmit: true,
    skipLibCheck: true,
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const relevantDiagnostics = diagnostics.filter(d => {
    if (!d.file) return false;
    return d.file.fileName.includes("src");
  });

  if (relevantDiagnostics.length === 0) {
    console.log("SUCCÈS: 0 erreur TypeScript dans le code source.");
    process.exit(0);
  } else {
    console.error(`${relevantDiagnostics.length} erreur(s) détectée(s):`);
    relevantDiagnostics.forEach(d => {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      const pos = d.file.getLineAndCharacterOfPosition(d.start);
      console.error(`${d.file.fileName} (${pos.line + 1},${pos.character + 1}): ${msg}`);
    });
    process.exit(1);
  }
}

checkTypeScript();
