// Jest setup file for backend tests
import { TestDataManager } from './mockModels';

// Mock the models to use our in-memory implementations
jest.mock('../models/Project', () => {
  const {
    MockProjectModel,
    createProjectSchema,
    updateProjectSchema,
    projectListQuerySchema,
  } = require('./mockModels');
  return {
    ProjectModel: MockProjectModel,
    createProjectSchema,
    updateProjectSchema,
    projectListQuerySchema,
  };
});

jest.mock('../models/BoardItem', () => {
  const {
    MockBoardItemModel,
    createBoardItemSchema,
    updateBoardItemSchema,
    boardItemListQuerySchema,
    bulkUpdateSchema,
    bulkDeleteSchema,
  } = require('./mockModels');
  return {
    BoardItemModel: MockBoardItemModel,
    createBoardItemSchema,
    updateBoardItemSchema,
    boardItemListQuerySchema,
    bulkUpdateSchema,
    bulkDeleteSchema,
  };
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Global test setup
beforeEach(() => {
  // Seed test data before each test
  TestDataManager.seed();
});

afterEach(() => {
  // Clear test data after each test
  TestDataManager.clear();
});
