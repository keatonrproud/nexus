# Test Automation in Cursor IDE

This guide explains how to set up and use automated testing in Cursor IDE to ensure tests run whenever you make changes and that tests are updated when features change.

## Overview

The test automation system provides:

1. **Automatic test running** when files change
2. **Related test discovery** to run only relevant tests
3. **Test suggestion system** for new features
4. **Git hooks** to prevent broken code from being committed
5. **Cursor IDE integration** with tasks and extensions

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies (already done)
npm install

# Install recommended Cursor extensions
# Open Command Palette (Cmd+Shift+P) and run:
# "Extensions: Show Recommended Extensions"
```

### 2. Start Test Automation

Choose one of these methods:

#### Method A: Smart Test Automation (Recommended)

```bash
npm run test:watch:auto
```

This starts the intelligent file watcher that:

- Runs related tests when files change
- Suggests test updates for new features
- Provides test templates for new files

#### Method B: Standard Test Watch

```bash
npm run test:watch
```

This runs both backend and frontend tests in watch mode.

#### Method C: Cursor IDE Tasks

1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Tasks: Run Task"
3. Select "Smart Test Automation"

## Features

### 1. Automatic Test Running

When you save a file, the system automatically:

- **Finds related tests** using multiple strategies:

  - Direct test files (e.g., `Button.tsx` → `Button.test.tsx`)
  - Tests that import the changed file
  - Tests in the same directory
  - Integration tests that might be affected

- **Runs only relevant tests** to save time
- **Shows test results** in the terminal
- **Suggests fixes** if tests fail

### 2. Test Suggestion System

When you add new features, the system analyzes your code and suggests:

- **New test files** for components without tests
- **Test updates** for modified functions
- **Test templates** with appropriate boilerplate

Example suggestions:

```
💡 New functions detected - consider adding tests for: handleSubmit, validateForm
💡 New React components detected - consider adding component tests
💡 API endpoints detected - consider adding integration tests
```

### 3. Git Hooks Integration

Automatic quality checks before commits:

- **Pre-commit**: Runs linting and related tests
- **Pre-push**: Runs full test suite
- **Prevents broken code** from being committed

### 4. Cursor IDE Integration

#### Test Explorer

- View all tests in the sidebar
- Run individual tests or test suites
- See test coverage information

#### Tasks Integration

Available tasks in Command Palette:

- `Run All Tests` - Full test suite
- `Run Tests with Coverage` - Tests + coverage report
- `Watch Tests (Auto-run)` - Standard watch mode
- `Smart Test Automation` - Intelligent file watching
- `Run Backend Tests` - Backend only
- `Run Frontend Tests` - Frontend only

#### Settings Configuration

The `.vscode/settings.json` includes:

- Jest auto-run configuration
- Vitest integration
- Test explorer settings
- File watcher optimization

## Usage Examples

### Finding Related Tests

```bash
# Find tests related to a specific file
npm run test:related frontend/src/components/Button.tsx

# Find and run related tests
node scripts/find-related-tests.js frontend/src/components/Button.tsx --run
```

### Manual Test Commands

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Watch mode for both
npm run test:watch

# Lint and fix all code
npm run lint:fix
```

### Creating New Tests

When you create a new file, the system will suggest a test file. You can also manually create tests using the templates:

#### React Component Test Template

```typescript
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComponentName } from '../ComponentName'

describe('ComponentName', () => {
  it('renders without crashing', () => {
    render(<ComponentName />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  // TODO: Add more specific tests
})
```

#### Backend Controller Test Template

```typescript
import request from "supertest";
import app from "../server";

describe("ControllerName", () => {
  it("should handle requests correctly", async () => {
    const response = await request(app).get("/api/endpoint").expect(200);
  });
});
```

## Configuration

### File Watching Patterns

The system watches these file patterns:

```javascript
[
  "backend/src/**/*.ts",
  "frontend/src/**/*.{ts,tsx}",
  "!**/*.test.{ts,tsx}",
  "!**/*.spec.{ts,tsx}",
  "!**/node_modules/**",
  "!**/dist/**",
  "!**/coverage/**",
];
```

### Test File Patterns

Tests are discovered using these patterns:

- Backend: `**/*.test.ts`, `**/*.spec.ts`
- Frontend: `**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`

### Customizing Behavior

Edit `scripts/test-automation.js` to customize:

- File watching patterns
- Test discovery logic
- Suggestion algorithms
- Test templates

## Troubleshooting

### Tests Not Running Automatically

1. **Check file patterns**: Ensure your files match the watch patterns
2. **Verify test file naming**: Use `.test.` or `.spec.` in filenames
3. **Check console output**: Look for error messages in the terminal
4. **Restart automation**: Stop and restart the test automation script

### Git Hooks Not Working

```bash
# Reinstall git hooks
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/pre-push "npm run test"
```

### Cursor Extensions Not Working

1. Install recommended extensions:

   - Jest (orta.vscode-jest)
   - Vitest Explorer (ZixuanChen.vitest-explorer)
   - ESLint (dbaeumer.vscode-eslint)
   - Prettier (esbenp.prettier-vscode)

2. Reload Cursor IDE window

### Performance Issues

If file watching is slow:

1. Add more patterns to `.vscode/settings.json` `files.watcherExclude`
2. Reduce the number of watched files
3. Use `npm run test:related` instead of full automation

## Best Practices

### 1. Test-Driven Development

- Write tests before implementing features
- Use the test templates as starting points
- Run tests frequently during development

### 2. Test Organization

- Keep tests close to source files
- Use descriptive test names
- Group related tests in describe blocks

### 3. Continuous Integration

- All tests must pass before committing
- Use coverage reports to identify gaps
- Review test suggestions regularly

### 4. Performance

- Use related test running for quick feedback
- Run full test suite before pushing
- Monitor test execution time

## Integration with AI Development

When working with Cursor's AI features:

1. **Include test context** in your prompts
2. **Ask for test updates** when modifying features
3. **Use test suggestions** to guide development
4. **Review AI-generated tests** for completeness

Example prompts:

- "Update the tests for this component to include the new prop"
- "Generate tests for this new API endpoint"
- "What tests should I add for this error handling?"

## Advanced Features

### Custom Test Runners

You can extend the automation system by:

1. Adding new test discovery patterns
2. Implementing custom test runners
3. Creating specialized test templates
4. Adding integration with external tools

### Coverage Integration

The system integrates with coverage tools:

- Backend: Jest coverage
- Frontend: Vitest coverage with v8
- Combined reports available

### CI/CD Integration

The test automation works with CI/CD systems:

- All commands work in headless environments
- Coverage reports can be uploaded to services
- Git hooks ensure quality before deployment

## Conclusion

This test automation system ensures that:

- ✅ Tests run automatically when you make changes
- ✅ You're prompted to update tests for new features
- ✅ Broken code can't be committed
- ✅ Test coverage is maintained
- ✅ Development workflow is optimized

The system is designed to work seamlessly with Cursor IDE's AI features, providing intelligent suggestions and maintaining code quality throughout the development process.
