#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Find Related Tests Script
 *
 * This script helps find tests related to a specific file
 * Usage: node scripts/find-related-tests.js <file-path>
 */

class RelatedTestFinder {
  constructor() {
    this.projectRoot = process.cwd();
  }

  findRelatedTests(filePath) {
    const relatedTests = [];
    const absolutePath = path.resolve(filePath);
    const relativePath = path.relative(this.projectRoot, absolutePath);

    console.log(`🔍 Finding tests related to: ${relativePath}`);

    // 1. Direct test file
    const directTest = this.getDirectTestFile(relativePath);
    if (fs.existsSync(directTest)) {
      relatedTests.push(directTest);
      console.log(`✅ Direct test found: ${directTest}`);
    }

    // 2. Tests that import this file
    const importingTests = this.findTestsThatImport(relativePath);
    relatedTests.push(...importingTests);

    // 3. Tests in the same directory
    const sameDirectoryTests = this.findTestsInSameDirectory(relativePath);
    relatedTests.push(...sameDirectoryTests);

    // 4. Integration tests that might be affected
    const integrationTests = this.findIntegrationTests(relativePath);
    relatedTests.push(...integrationTests);

    // Remove duplicates
    const uniqueTests = [...new Set(relatedTests)];

    if (uniqueTests.length === 0) {
      console.log(`❌ No related tests found for ${relativePath}`);
      this.suggestTestCreation(relativePath);
    } else {
      console.log(`📋 Found ${uniqueTests.length} related test(s):`);
      uniqueTests.forEach((test) => console.log(`   - ${test}`));
    }

    return uniqueTests;
  }

  getDirectTestFile(filePath) {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    if (filePath.includes("frontend/src")) {
      // Frontend test patterns
      const patterns = [
        path.join(dir, "__tests__", `${baseName}.test.tsx`),
        path.join(dir, "__tests__", `${baseName}.test.ts`),
        path.join(dir, `${baseName}.test.tsx`),
        path.join(dir, `${baseName}.test.ts`),
        path.join(dir, `${baseName}.spec.tsx`),
        path.join(dir, `${baseName}.spec.ts`),
      ];

      for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
          return pattern;
        }
      }
    } else if (filePath.includes("backend/src")) {
      // Backend test patterns
      const patterns = [
        path.join(dir, `${baseName}.test.ts`),
        path.join(dir, `${baseName}.spec.ts`),
        path.join(dir, "__tests__", `${baseName}.test.ts`),
        path.join(dir, "__tests__", `${baseName}.spec.ts`),
      ];

      for (const pattern of patterns) {
        if (fs.existsSync(pattern)) {
          return pattern;
        }
      }
    }

    return null;
  }

  findTestsThatImport(filePath) {
    const tests = [];
    const fileName = path.basename(filePath, path.extname(filePath));
    const allTestFiles = this.getAllTestFiles();

    allTestFiles.forEach((testFile) => {
      try {
        const content = fs.readFileSync(testFile, "utf8");
        const testDir = path.dirname(testFile);
        const relativePath = path.relative(testDir, filePath);

        // Check for various import patterns
        const importPatterns = [
          new RegExp(`from\\s+['"].*${fileName}['"]`, "g"),
          new RegExp(`import.*['"].*${fileName}['"]`, "g"),
          new RegExp(`require\\(['"].*${fileName}['"]\\)`, "g"),
          new RegExp(
            `from\\s+['"]${relativePath.replace(/\\/g, "/")}['"]`,
            "g",
          ),
          new RegExp(
            `import.*['"]${relativePath.replace(/\\/g, "/")}['"]`,
            "g",
          ),
        ];

        const hasImport = importPatterns.some((pattern) =>
          pattern.test(content),
        );

        if (hasImport) {
          tests.push(testFile);
          console.log(`🔗 Found importing test: ${testFile}`);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    return tests;
  }

  findTestsInSameDirectory(filePath) {
    const tests = [];
    const dir = path.dirname(filePath);

    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        if (this.isTestFile(file)) {
          const testPath = path.join(dir, file);
          tests.push(testPath);
          console.log(`📁 Found test in same directory: ${testPath}`);
        }
      });

      // Check __tests__ subdirectory
      const testsDir = path.join(dir, "__tests__");
      if (fs.existsSync(testsDir)) {
        const testFiles = fs.readdirSync(testsDir);
        testFiles.forEach((file) => {
          if (this.isTestFile(file)) {
            const testPath = path.join(testsDir, file);
            tests.push(testPath);
            console.log(`📁 Found test in __tests__: ${testPath}`);
          }
        });
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return tests;
  }

  findIntegrationTests(filePath) {
    const tests = [];

    // Look for integration tests that might be affected
    if (filePath.includes("backend/src/controllers")) {
      // Controller changes might affect integration tests
      const integrationTestDirs = [
        "backend/src/test",
        "backend/test",
        "backend/__tests__",
      ];

      integrationTestDirs.forEach((dir) => {
        if (fs.existsSync(dir)) {
          const integrationTests = this.findTestFilesInDirectory(dir);
          tests.push(...integrationTests);
        }
      });
    }

    if (filePath.includes("frontend/src/components")) {
      // Component changes might affect integration tests
      const integrationTestDirs = [
        "frontend/src/__tests__",
        "frontend/src/test",
        "frontend/test",
      ];

      integrationTestDirs.forEach((dir) => {
        if (fs.existsSync(dir)) {
          const integrationTests = this.findTestFilesInDirectory(dir);
          tests.push(...integrationTests);
        }
      });
    }

    return tests;
  }

  findTestFilesInDirectory(dir) {
    const tests = [];

    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      files.forEach((file) => {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
          // Recursively search subdirectories
          tests.push(...this.findTestFilesInDirectory(fullPath));
        } else if (this.isTestFile(file.name)) {
          tests.push(fullPath);
        }
      });
    } catch (error) {
      // Skip directories that can't be read
    }

    return tests;
  }

  getAllTestFiles() {
    const testFiles = [];

    // Backend tests
    if (fs.existsSync("backend/src")) {
      testFiles.push(...this.findTestFilesInDirectory("backend/src"));
    }

    // Frontend tests
    if (fs.existsSync("frontend/src")) {
      testFiles.push(...this.findTestFilesInDirectory("frontend/src"));
    }

    return testFiles;
  }

  isTestFile(fileName) {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fileName);
  }

  suggestTestCreation(filePath) {
    const testFile = this.getDirectTestFile(filePath);
    if (!testFile) {
      console.log(`💡 Suggestion: Create a test file for ${filePath}`);

      const suggestedPath = this.suggestTestFilePath(filePath);
      console.log(`📝 Suggested test file: ${suggestedPath}`);

      // Generate test template
      const template = this.generateTestTemplate(filePath);
      console.log(`\n📋 Test template:\n${template}`);
    }
  }

  suggestTestFilePath(filePath) {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    if (filePath.includes("frontend/src")) {
      return path.join(dir, "__tests__", `${baseName}.test.tsx`);
    } else if (filePath.includes("backend/src")) {
      return path.join(dir, `${baseName}.test.ts`);
    }

    return path.join(dir, `${baseName}.test.${ext.slice(1)}`);
  }

  generateTestTemplate(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const isReactComponent =
      filePath.includes("frontend") && /^[A-Z]/.test(fileName);
    const isController = filePath.includes("Controller");
    const isModel = filePath.includes("Model");

    if (isReactComponent) {
      return `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ${fileName} } from '../${fileName}'

describe('${fileName}', () => {
  it('renders without crashing', () => {
    render(<${fileName} />)
    // Add appropriate assertions based on component structure
  })
  
  // TODO: Add more specific tests for ${fileName} functionality
})`;
    } else if (isController) {
      return `import request from 'supertest'
import app from '../server'

describe('${fileName}', () => {
  // TODO: Add controller endpoint tests
  it('should handle requests correctly', async () => {
    // Example test structure
    // const response = await request(app)
    //   .get('/api/endpoint')
    //   .expect(200)
  })
})`;
    } else if (isModel) {
      return `import { ${fileName} } from '../${fileName}'

describe('${fileName}', () => {
  // TODO: Add model tests
  it('should perform operations correctly', () => {
    // Add model operation tests
  })
})`;
    } else {
      return `import { describe, expect, it } from '${filePath.includes("frontend") ? "vitest" : "jest"}'
import { ${fileName} } from '../${fileName}'

describe('${fileName}', () => {
  it('should work correctly', () => {
    // TODO: Add tests for ${fileName}
    expect(true).toBe(true)
  })
})`;
    }
  }

  async runRelatedTests(testFiles) {
    if (testFiles.length === 0) {
      console.log("❌ No tests to run");
      return;
    }

    console.log(`🧪 Running ${testFiles.length} related test(s)...`);

    for (const testFile of testFiles) {
      try {
        if (testFile.includes("backend")) {
          console.log(`🔧 Running backend test: ${testFile}`);
          execSync(`cd backend && npm test -- ${testFile}`, {
            stdio: "inherit",
          });
        } else if (testFile.includes("frontend")) {
          console.log(`⚛️  Running frontend test: ${testFile}`);
          execSync(`cd frontend && npm run test:run -- ${testFile}`, {
            stdio: "inherit",
          });
        }
      } catch (error) {
        console.log(`❌ Test failed: ${testFile}`);
        console.log(error.message);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log("Usage: node scripts/find-related-tests.js <file-path>");
    console.log(
      "Example: node scripts/find-related-tests.js frontend/src/components/Button.tsx",
    );
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const finder = new RelatedTestFinder();
  const relatedTests = finder.findRelatedTests(filePath);

  // Ask if user wants to run the tests
  if (relatedTests.length > 0) {
    const runTests = process.argv.includes("--run");
    if (runTests) {
      finder.runRelatedTests(relatedTests);
    } else {
      console.log("\n💡 To run these tests, add --run flag");
      console.log(
        `Example: node scripts/find-related-tests.js ${filePath} --run`,
      );
    }
  }
}

module.exports = RelatedTestFinder;
