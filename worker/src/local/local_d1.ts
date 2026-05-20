import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

type RunResult = {
    success: boolean;
    meta: {
        changes: number;
        last_row_id: number;
    };
};

class LocalD1PreparedStatement {
    private readonly db: DatabaseSync;
    private readonly sql: string;
    private readonly params: unknown[];

    constructor(db: DatabaseSync, sql: string, params: unknown[] = []) {
        this.db = db;
        this.sql = sql;
        this.params = params;
    }

    bind(...params: unknown[]): LocalD1PreparedStatement {
        return new LocalD1PreparedStatement(this.db, this.sql, params);
    }

    async first<T = Record<string, unknown>>(columnName?: string): Promise<T | null> {
        const row = this.statement().get(...this.params as []) as Record<string, unknown> | undefined;
        if (!row) {
            return null;
        }
        if (columnName) {
            return (row[columnName] as T) ?? null;
        }
        return row as T;
    }

    async all<T = Record<string, unknown>>(): Promise<{ results: T[] }> {
        const results = this.statement().all(...this.params as []) as T[];
        return { results };
    }

    async run(): Promise<RunResult> {
        const result = this.statement().run(...this.params as []) as {
            changes: number;
            lastInsertRowid?: number | bigint;
        };
        return {
            success: true,
            meta: {
                changes: result.changes ?? 0,
                last_row_id: Number(result.lastInsertRowid ?? 0),
            },
        };
    }

    executeSync(): RunResult {
        const result = this.statement().run(...this.params as []) as {
            changes: number;
            lastInsertRowid?: number | bigint;
        };
        return {
            success: true,
            meta: {
                changes: result.changes ?? 0,
                last_row_id: Number(result.lastInsertRowid ?? 0),
            },
        };
    }

    private statement() {
        return this.db.prepare(this.sql);
    }
}

export class LocalD1Database {
    private readonly db: DatabaseSync;

    constructor(filePath: string) {
        mkdirSync(dirname(filePath), { recursive: true });
        this.db = new DatabaseSync(filePath);
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA foreign_keys = ON;");
    }

    prepare(sql: string): LocalD1PreparedStatement {
        return new LocalD1PreparedStatement(this.db, sql);
    }

    async exec(sql: string): Promise<void> {
        this.db.exec(sql);
    }

    async batch(statements: LocalD1PreparedStatement[]): Promise<RunResult[]> {
        const results: RunResult[] = [];
        this.db.exec("BEGIN");
        try {
            for (const statement of statements) {
                results.push(statement.executeSync());
            }
            this.db.exec("COMMIT");
            return results;
        } catch (error) {
            this.db.exec("ROLLBACK");
            throw error;
        }
    }
}
