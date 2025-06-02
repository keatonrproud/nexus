#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chokidar = require("chokidar");

/**
 * Test Automation Script for Cursor IDE
 *
 * This script:
 * 1. Watches for file changes
 * 2. Runs related tests automatically
 * 3. Suggests test updates when features change
 * 4. Provides test coverage feedback
 */

class TestAutomation {
  constructor() {
    this.isRunning = false;
    this.testQueue = new Set();
    this.lastTestRun = new Map();

    // File patterns to watch
    this.watchPatterns = [
      "backend/src/**/*.ts",
      "frontend/src/**/*.{ts,tsx}",
      "!**/*.test.{ts,tsx}",
      "!**/*.spec.{ts,tsx}",
      "!**/node_modules/**",
      "!**/dist/**",
      "!**/coverage/**",
    ];

    // Test file patterns
    this.testPatterns = {
      backend: "backend/src/**/*.test.ts",
      frontend: "frontend/src/**/*.test.{ts,tsx}",
    };
  }

  start() {
    console.log("🚀 Starting Test Automation...");

    // Watch for file changes
    const watcher = chokidar.watch(this.watchPatterns, {
      ignored: /node_modules|\.git/,
      persistent: true,
      ignoreInitial: true,
    });

    watcher
      .on("change", (filePath) => this.handleFileChange(filePath))
      .on("add", (filePath) => this.handleFileAdd(filePath))
      .on("unlink", (filePath) => this.handleFileDelete(filePath));

    console.log("👀 Watching for file changes...");
    console.log("📁 Patterns:", this.watchPatterns.join(", "));

    // Run initial test suite
    this.runInitialTests();
  }

  async handleFileChange(filePath) {
    console.log(`📝 File changed: ${filePath}`);

    const relatedTests = this.findRelatedTests(filePath);
    const testSuggestions = this.analyzeTestNeeds(filePath);

    if (relatedTests.length > 0) {
      console.log(`🧪 Running related tests: ${relatedTests.join(", ")}`);
      await this.runTests(relatedTests);
    } else {
      console.log(`⚠️  No tests found for ${filePath}`);
      this.suggestTestCreation(filePath);
    }

    if (testSuggestions.length > 0) {
      console.log(`💡 Test update suggestions:`);
      testSuggestions.forEach((suggestion) =>
        console.log(`   - ${suggestion}`),
      );
    }
  }

  async handleFileAdd(filePath) {
    console.log(`➕ New file added: ${filePath}`);

    if (this.isSourceFile(filePath)) {
      this.suggestTestCreation(filePath);
    }
  }

  handleFileDelete(filePath) {
    console.log(`🗑️  File deleted: ${filePath}`);

    if (this.isSourceFile(filePath)) {
      const testFile = this.getTestFilePath(filePath);
      if (fs.existsSync(testFile)) {
        console.log(`⚠️  Consider removing orphaned test: ${testFile}`);
      }
    }
  }

  findRelatedTests(filePath) {
    const tests = [];

    // Direct test file
    const directTest = this.getTestFilePath(filePath);
    if (fs.existsSync(directTest)) {
      tests.push(directTest);
    }

    // Find tests that import this file
    const allTestFiles = this.getAllTestFiles();
    allTestFiles.forEach((testFile) => {
      const content = fs.readFileSync(testFile, "utf8");
      const relativePath = path.relative(path.dirname(testFile), filePath);

      if (
        content.includes(relativePath) ||
        content.includes(path.basename(filePath, path.extname(filePath)))
      ) {
        tests.push(testFile);
      }
    });

    return [...new Set(tests)];
  }

  analyzeTestNeeds(filePath) {
    const suggestions = [];
    const content = fs.readFileSync(filePath, "utf8");

    // Check for new functions/methods
    const functionMatches = content.match(
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(\w+)\s*[:=]\s*(?:async\s+)?\(/g,
    );
    if (functionMatches) {
      suggestions.push(
        `New functions detected - consider adding tests for: ${functionMatches.join(", ")}`,
      );
    }

    // Check for new React components
    if (filePath.includes("frontend") && content.includes("export")) {
      const componentMatches = content.match(
        /export\s+(?:const|function)\s+(\w+)/g,
      );
      if (componentMatches) {
        suggestions.push(
          `New React components detected - consider adding component tests`,
        );
      }
    }

    // Check for new API endpoints
    if (content.includes("router.") || content.includes("app.")) {
      suggestions.push(
        `API endpoints detected - consider adding integration tests`,
      );
    }

    // Check for new database models
    if (content.includes("Model") || content.includes("Schema")) {
      suggestions.push(
        `Database models detected - consider adding model tests`,
      );
    }

    return suggestions;
  }

  async runTests(testFiles = []) {
    if (this.isRunning) {
      console.log("⏳ Tests already running, queuing...");
      testFiles.forEach((test) => this.testQueue.add(test));
      return;
    }

    this.isRunning = true;

    try {
      if (testFiles.length === 0) {
        // Run all tests
        console.log("🧪 Running all tests...");
        await this.runCommand("npm run test");
      } else {
        // Run specific tests
        for (const testFile of testFiles) {
          if (testFile.includes("backend")) {
            await this.runCommand(`cd backend && npm test -- ${testFile}`);
          } else if (testFile.includes("frontend")) {
            await this.runCommand(
              `cd frontend && npm run test:run -- ${testFile}`,
            );
          }
        }
      }

      console.log("✅ Tests completed successfully");
    } catch (error) {
      console.log("❌ Tests failed:", error.message);
      this.suggestTestFixes(error.message);
    } finally {
      this.isRunning = false;

      // Process queued tests
      if (this.testQueue.size > 0) {
        const queuedTests = [...this.testQueue];
        this.testQueue.clear();
        await this.runTests(queuedTests);
      }
    }
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      try {
        const output = execSync(command, {
          encoding: "utf8",
          stdio: "pipe",
          cwd: process.cwd(),
        });
        console.log(output);
        resolve(output);
      } catch (error) {
        reject(error);
      }
    });
  }

  suggestTestCreation(filePath) {
    const testFile = this.getTestFilePath(filePath);
    const testDir = path.dirname(testFile);

    console.log(`💡 Suggestion: Create test file at ${testFile}`);

    // Create test directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      console.log(`📁 Creating test directory: ${testDir}`);
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Generate basic test template
    const template = this.generateTestTemplate(filePath);
    console.log(`📝 Test template:\n${template}`);
  }

  generateTestTemplate(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const isReactComponent =
      filePath.includes("frontend") && /^[A-Z]/.test(fileName);
    const isBackendController = filePath.includes("Controller");
    const isBackendModel = filePath.includes("Model");

    if (isReactComponent) {
      return `import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ${fileName} } from '../${fileName}'

describe('${fileName}', () => {
  it('renders without crashing', () => {
    render(<${fileName} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })
  
  // TODO: Add more specific tests for ${fileName} functionality
})`;
    } else if (isBackendController) {
      return `import request from 'supertest'
import app from '../server'
import { describe, expect, it, beforeEach, afterEach } from 'jest'

describe('${fileName}', () => {
  beforeEach(() => {
    // Setup test data
  })
  
  afterEach(() => {
    // Cleanup test data
  })
  
  it('should handle requests correctly', async () => {
    // TODO: Add controller tests
  })
})`;
    } else if (isBackendModel) {
      return `import { ${fileName} } from '../${fileName}'
import { describe, expect, it, beforeEach, afterEach } from 'jest'

describe('${fileName}', () => {
  beforeEach(() => {
    // Setup test database
  })
  
  afterEach(() => {
    // Cleanup test database
  })
  
  it('should perform CRUD operations correctly', async () => {
    // TODO: Add model tests
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

  suggestTestFixes(errorMessage) {
    const suggestions = [];

    if (errorMessage.includes("Cannot find module")) {
      suggestions.push("Check import paths in test files");
    }

    if (errorMessage.includes("ReferenceError")) {
      suggestions.push("Check if all dependencies are properly mocked");
    }

    if (errorMessage.includes("TypeError")) {
      suggestions.push("Verify function signatures and return types");
    }

    if (suggestions.length > 0) {
      console.log("🔧 Test fix suggestions:");
      suggestions.forEach((suggestion) => console.log(`   - ${suggestion}`));
    }
  }

  getTestFilePath(filePath) {
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    if (filePath.includes("frontend")) {
      return path.join(dir, "__tests__", `${baseName}.test.tsx`);
    } else {
      return path.join(dir, `${baseName}.test.ts`);
    }
  }

  isSourceFile(filePath) {
    return (
      (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) &&
      !filePath.includes(".test.") &&
      !filePath.includes(".spec.") &&
      !filePath.includes("node_modules")
    );
  }

  getAllTestFiles() {
    const testFiles = [];

    // Backend tests
    try {
      const backendTests = execSync('find backend/src -name "*.test.ts"', {
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter(Boolean);
      testFiles.push(...backendTests);
    } catch (e) {}

    // Frontend tests
    try {
      const frontendTests = execSync(
        'find frontend/src -name "*.test.tsx" -o -name "*.test.ts"',
        { encoding: "utf8" },
      )
        .trim()
        .split("\n")
        .filter(Boolean);
      testFiles.push(...frontendTests);
    } catch (e) {}

    return testFiles;
  }

  async runInitialTests() {
    console.log("🧪 Running initial test suite...");
    try {
      await this.runCommand("npm run test");
      console.log("✅ Initial tests passed");
    } catch (error) {
      console.log("❌ Initial tests failed - please fix before continuing");
    }
  }
}

// CLI interface
if (require.main === module) {
  const automation = new TestAutomation();
  automation.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n👋 Stopping test automation...");
    process.exit(0);
  });
}

module.exports = TestAutomation;
