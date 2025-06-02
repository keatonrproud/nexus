import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class TestDatabase {
  private db: sqlite3.Database;
  private static instance: TestDatabase;

  private constructor() {
    // Create in-memory SQLite database
    this.db = new sqlite3.Database(':memory:');
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async initialize(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Create users table
    await run(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        google_id TEXT UNIQUE NOT NULL,
        profile_picture_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await run(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT,
        emoji TEXT,
        goatcounter_site_code TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create board_items table
    await run(`
      CREATE TABLE board_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('bug', 'idea')),
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    await run(`CREATE INDEX idx_projects_user_id ON projects(user_id)`);
    await run(
      `CREATE INDEX idx_board_items_project_id ON board_items(project_id)`
    );
    await run(`CREATE INDEX idx_board_items_type ON board_items(type)`);
    await run(`CREATE INDEX idx_board_items_status ON board_items(status)`);
    await run(`CREATE INDEX idx_board_items_priority ON board_items(priority)`);
    await run(
      `CREATE INDEX idx_board_items_created_at ON board_items(created_at)`
    );
  }

  async seedTestData(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Insert test user
    await run(`
      INSERT INTO users (id, email, name, google_id) 
      VALUES ('test-user-id', 'test@example.com', 'Test User', 'google-test-id')
    `);

    // Insert test project
    await run(`
      INSERT INTO projects (id, user_id, name, url, emoji, goatcounter_site_code) 
      VALUES ('test-project-id', 'test-user-id', 'Test Project', 'https://example.com', '🚀', 'test-site')
    `);

    // Insert test board items
    await run(`
      INSERT INTO board_items (id, project_id, title, description, type, status, priority) 
      VALUES 
        ('test-bug-id', 'test-project-id', 'Test Bug', 'This is a test bug', 'bug', 'open', 'high'),
        ('test-idea-id', 'test-project-id', 'Test Idea', 'This is a test idea', 'idea', 'open', 'medium')
    `);
  }

  async clear(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    await run('DELETE FROM board_items');
    await run('DELETE FROM projects');
    await run('DELETE FROM users');
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Query methods that mirror Supabase client interface
  async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  async run(
    sql: string,
    params: any[] = []
  ): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else
          resolve({
            lastID: this.lastID,
            changes: this.changes,
          });
      });
    });
  }

  // Helper method to generate UUIDs for testing
  generateId(): string {
    return 'test-' + Math.random().toString(36).substr(2, 9);
  }
}
