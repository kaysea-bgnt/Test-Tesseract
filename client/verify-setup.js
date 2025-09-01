const fs = require("fs");
const path = require("path");

console.log("🔍 Verifying Test-Tesseract client setup...\n");

const filesToCheck = [
  "src/App.tsx",
  "src/api.ts",
  "src/types.ts",
  "src/main.tsx",
  "src/index.css",
  "vite-env.d.ts",
  "package.json",
  "tsconfig.json",
  "tailwind.config.js",
  "vite.config.ts",
];

console.log("📁 Checking file existence:");
let allFilesExist = true;

filesToCheck.forEach((file) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? "✅" : "❌"} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log("\n📋 Checking package.json dependencies:");
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));
  const requiredDeps = ["react", "react-dom", "axios", "lucide-react"];
  const requiredDevDeps = ["@types/react", "@types/react-dom", "typescript", "vite"];

  console.log("Dependencies:");
  requiredDeps.forEach((dep) => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    console.log(`${hasDep ? "✅" : "❌"} ${dep}`);
  });

  console.log("Dev Dependencies:");
  requiredDevDeps.forEach((dep) => {
    const hasDep = packageJson.devDependencies && packageJson.devDependencies[dep];
    console.log(`${hasDep ? "✅" : "❌"} ${dep}`);
  });
} catch (error) {
  console.log("❌ Error reading package.json:", error.message);
}

console.log("\n🔧 Checking TypeScript configuration:");
try {
  const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "tsconfig.json"), "utf8"));
  console.log("✅ tsconfig.json is valid JSON");
  console.log(`✅ Target: ${tsConfig.compilerOptions?.target || "not set"}`);
  console.log(`✅ Module: ${tsConfig.compilerOptions?.module || "not set"}`);
  console.log(`✅ JSX: ${tsConfig.compilerOptions?.jsx || "not set"}`);
} catch (error) {
  console.log("❌ Error reading tsconfig.json:", error.message);
}

console.log("\n📝 Checking source files content:");
try {
  const appContent = fs.readFileSync(path.join(__dirname, "src/App.tsx"), "utf8");
  const apiContent = fs.readFileSync(path.join(__dirname, "src/api.ts"), "utf8");
  const typesContent = fs.readFileSync(path.join(__dirname, "src/types.ts"), "utf8");

  console.log(`✅ App.tsx: ${appContent.length} characters`);
  console.log(`✅ api.ts: ${apiContent.length} characters`);
  console.log(`✅ types.ts: ${typesContent.length} characters`);

  // Check for specific imports
  const hasApiImport = appContent.includes("from './api'");
  const hasTypesImport = appContent.includes("from './types'");

  console.log(`${hasApiImport ? "✅" : "❌"} App.tsx imports from './api'`);
  console.log(`${hasTypesImport ? "✅" : "❌"} App.tsx imports from './types'`);
} catch (error) {
  console.log("❌ Error reading source files:", error.message);
}

console.log("\n🎯 Setup Summary:");
if (allFilesExist) {
  console.log("✅ All required files exist");
  console.log("✅ Ready to run: npm install && npm run dev");
} else {
  console.log("❌ Some files are missing");
}

console.log("\n💡 If you see TypeScript errors in your editor:");
console.log("1. Try restarting your TypeScript language server");
console.log("2. Run: npm install");
console.log("3. Run: npm run dev");
console.log("4. Check if your editor has the latest TypeScript version");
