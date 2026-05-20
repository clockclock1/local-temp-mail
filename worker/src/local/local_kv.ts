import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type StoredKvValue = {
    value: string;
    expiresAt?: number;
};

type GetType = "text" | "json";

export class LocalKVNamespace {
    private readonly filePath: string;
    private store: Record<string, StoredKvValue>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.store = this.load();
    }

    async get<T = string>(key: string, type?: GetType): Promise<T | null> {
        this.cleanupExpired();
        const item = this.store[key];
        if (!item) {
            return null;
        }
        if (type === "json") {
            return JSON.parse(item.value) as T;
        }
        return item.value as T;
    }

    async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
        const expiresAt = options?.expirationTtl
            ? Date.now() + options.expirationTtl * 1000
            : undefined;
        this.store[key] = {
            value,
            ...(expiresAt ? { expiresAt } : {}),
        };
        this.persist();
    }

    async delete(key: string): Promise<void> {
        delete this.store[key];
        this.persist();
    }

    private load(): Record<string, StoredKvValue> {
        try {
            return JSON.parse(readFileSync(this.filePath, "utf-8")) as Record<string, StoredKvValue>;
        } catch {
            return {};
        }
    }

    private cleanupExpired(): void {
        let changed = false;
        const now = Date.now();
        for (const [key, value] of Object.entries(this.store)) {
            if (typeof value.expiresAt === "number" && value.expiresAt <= now) {
                delete this.store[key];
                changed = true;
            }
        }
        if (changed) {
            this.persist();
        }
    }

    private persist(): void {
        mkdirSync(dirname(this.filePath), { recursive: true });
        writeFileSync(this.filePath, JSON.stringify(this.store, null, 2), "utf-8");
    }
}
