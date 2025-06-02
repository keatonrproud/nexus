import { TestDatabase } from './testDatabase';

export class MockSupabaseClient {
  private testDb: TestDatabase;

  constructor() {
    this.testDb = TestDatabase.getInstance();
  }

  from(table: string) {
    return new MockQueryBuilder(this.testDb, table);
  }
}

class MockQueryBuilder {
  private testDb: TestDatabase;
  private table: string;
  private selectFields: string = '*';
  private whereConditions: Array<{
    field: string;
    operator: string;
    value: any;
  }> = [];
  private orderByField?: string;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitValue?: number;
  private offsetValue?: number;
  private insertData?: any;
  private updateData?: any;
  private isSingle: boolean = false;

  constructor(testDb: TestDatabase, table: string) {
    this.testDb = testDb;
    this.table = table;
  }

  select(fields: string = '*', options?: { count?: string }) {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.whereConditions.push({ field, operator: '=', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.whereConditions.push({ field, operator: 'IN', value: values });
    return this;
  }

  or(condition: string) {
    // Simple OR implementation for search
    if (condition.includes('ilike')) {
      const parts = condition.split(',');
      const searchConditions = parts.map((part) => {
        const [field, value] = part.split('.ilike.');
        return { field, operator: 'LIKE', value: value.replace(/%/g, '') };
      });
      this.whereConditions.push({
        field: 'OR',
        operator: 'OR',
        value: searchConditions,
      });
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderByField = field;
    this.orderDirection = options?.ascending === false ? 'desc' : 'asc';
    return this;
  }

  range(from: number, to: number) {
    this.offsetValue = from;
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data: any) {
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.updateData = data;
    return this;
  }

  delete() {
    this.whereConditions.push({
      field: 'DELETE',
      operator: 'DELETE',
      value: true,
    });
    return this;
  }

  async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      if (this.insertData) {
        return await this.handleInsert();
      } else if (this.updateData) {
        return await this.handleUpdate();
      } else if (this.whereConditions.some((c) => c.operator === 'DELETE')) {
        return await this.handleDelete();
      } else {
        return await this.handleSelect();
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  // Make the query builder thenable so it can be awaited directly
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected);
  }

  private async handleInsert(): Promise<{ data: any; error: any }> {
    const id = this.testDb.generateId();
    const now = new Date().toISOString();
    const dataWithDefaults = {
      id,
      created_at: now,
      updated_at: now,
      ...this.insertData,
    };

    const fields = Object.keys(dataWithDefaults);
    const placeholders = fields.map(() => '?').join(', ');
    const values = Object.values(dataWithDefaults);

    const sql = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders})`;
    await this.testDb.run(sql, values);

    return { data: dataWithDefaults, error: null };
  }

  private async handleUpdate(): Promise<{ data: any; error: any }> {
    const updateFields = Object.keys(this.updateData);
    const setClause = updateFields.map((field) => `${field} = ?`).join(', ');
    const updateValues = Object.values(this.updateData);

    let sql = `UPDATE ${this.table} SET ${setClause}, updated_at = ?`;
    const params = [...updateValues, new Date().toISOString()];

    if (this.whereConditions.length > 0) {
      const { whereClause, whereParams } = this.buildWhereClause();
      sql += ` WHERE ${whereClause}`;
      params.push(...whereParams);
    }

    await this.testDb.run(sql, params);

    // Return the updated record
    const selectSql = `SELECT * FROM ${this.table}`;
    const selectResult = await this.testDb.query(selectSql);

    return {
      data: this.isSingle ? selectResult[0] : selectResult,
      error: null,
    };
  }

  private async handleDelete(): Promise<{ data: any; error: any }> {
    let sql = `DELETE FROM ${this.table}`;
    let params: any[] = [];

    if (this.whereConditions.length > 0) {
      const { whereClause, whereParams } = this.buildWhereClause();
      sql += ` WHERE ${whereClause}`;
      params = whereParams;
    }

    await this.testDb.run(sql, params);
    return { data: null, error: null };
  }

  private async handleSelect(): Promise<{
    data: any;
    error: any;
    count?: number;
  }> {
    let sql = `SELECT ${this.selectFields} FROM ${this.table}`;
    let params: any[] = [];

    if (this.whereConditions.length > 0) {
      const { whereClause, whereParams } = this.buildWhereClause();
      sql += ` WHERE ${whereClause}`;
      params = whereParams;
    }

    if (this.orderByField) {
      sql += ` ORDER BY ${this.orderByField} ${this.orderDirection.toUpperCase()}`;
    }

    if (this.limitValue) {
      sql += ` LIMIT ${this.limitValue}`;
      if (this.offsetValue) {
        sql += ` OFFSET ${this.offsetValue}`;
      }
    }

    const result = await this.testDb.query(sql, params);

    if (this.isSingle) {
      if (result.length === 0) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        };
      }
      return { data: result[0], error: null };
    }

    return { data: result, error: null, count: result.length };
  }

  private buildWhereClause(): { whereClause: string; whereParams: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    for (const condition of this.whereConditions) {
      if (condition.operator === 'OR') {
        // Handle OR conditions for search
        const orConditions = condition.value.map((c: any) => {
          params.push(`%${c.value}%`);
          return `${c.field} LIKE ?`;
        });
        conditions.push(`(${orConditions.join(' OR ')})`);
      } else if (condition.operator === 'IN') {
        const placeholders = condition.value.map(() => '?').join(', ');
        conditions.push(`${condition.field} IN (${placeholders})`);
        params.push(...condition.value);
      } else {
        conditions.push(`${condition.field} ${condition.operator} ?`);
        params.push(condition.value);
      }
    }

    return {
      whereClause: conditions.join(' AND '),
      whereParams: params,
    };
  }
}

// Export a function to create the mock client
export function createMockSupabaseClient(): MockSupabaseClient {
  return new MockSupabaseClient();
}
