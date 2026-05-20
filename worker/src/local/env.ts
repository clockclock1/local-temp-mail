import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { LocalD1Database } from "./local_d1.js";
import { LocalKVNamespace } from "./local_kv.js";
import { LocalSendMailBinding } from "./local_send_mail.js";

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
    if (typeof value !== "string") {
        return fallback;
    }
    return value === "true";
};

const parseNumber = (value: string | undefined, fallback: number): number => {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultJsonArray = (value: string[] | undefined): string => JSON.stringify(value || []);

const loadSchemaSql = (): string => {
    const schemaPath = resolve(process.cwd(), "..", "db", "schema.sql");
    return readFileSync(schemaPath, "utf-8");
};

const ensureDatabaseInitialized = async (db: LocalD1Database): Promise<void> => {
    const table = await db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'"
    ).first("name");
    if (table) {
        return;
    }
    await db.exec(loadSchemaSql());
};

export const createLocalBindings = async (): Promise<Bindings> => {
    const dataDir = resolve(process.cwd(), ".local-data");
    const dbPath = resolve(dataDir, "temp-mail.sqlite");
    const kvPath = resolve(dataDir, "kv.json");
    const db = new LocalD1Database(dbPath);
    await ensureDatabaseInitialized(db);
    const kv = new LocalKVNamespace(kvPath);

    const sendMailBinding = process.env.LOCAL_SENDMAIL_HOST
        ? new LocalSendMailBinding({
            host: process.env.LOCAL_SENDMAIL_HOST,
            port: parseNumber(process.env.LOCAL_SENDMAIL_PORT, 25),
            secure: parseBoolean(process.env.LOCAL_SENDMAIL_SECURE, false),
            user: process.env.LOCAL_SENDMAIL_USER,
            pass: process.env.LOCAL_SENDMAIL_PASS,
        })
        : undefined;

    return {
        DB: db as unknown as D1Database,
        KV: kv as unknown as KVNamespace,
        SEND_MAIL: sendMailBinding as unknown as SendEmail,

        JWT_SECRET: process.env.JWT_SECRET || "change-me-in-local-env",
        PREFIX: process.env.PREFIX || "tmp",
        DEFAULT_LANG: process.env.DEFAULT_LANG || "zh",
        TITLE: process.env.TITLE || "Temp Mail Local",
        DEFAULT_DOMAINS: process.env.DEFAULT_DOMAINS || defaultJsonArray(["example.com"]),
        DOMAINS: process.env.DOMAINS || defaultJsonArray(["example.com"]),
        ENABLE_USER_CREATE_EMAIL: process.env.ENABLE_USER_CREATE_EMAIL || "true",
        ENABLE_USER_DELETE_EMAIL: process.env.ENABLE_USER_DELETE_EMAIL || "true",
        ENABLE_AUTO_REPLY: process.env.ENABLE_AUTO_REPLY || "false",
        ENABLE_WEBHOOK: process.env.ENABLE_WEBHOOK || "false",
        ENABLE_ADDRESS_PASSWORD: process.env.ENABLE_ADDRESS_PASSWORD || "true",
        ENABLE_AGENT_EMAIL_INFO: process.env.ENABLE_AGENT_EMAIL_INFO || "false",
        ENABLE_CREATE_ADDRESS_SUBDOMAIN_MATCH: process.env.ENABLE_CREATE_ADDRESS_SUBDOMAIN_MATCH || "true",
        RANDOM_SUBDOMAIN_DOMAINS: process.env.RANDOM_SUBDOMAIN_DOMAINS || defaultJsonArray([]),
        RANDOM_SUBDOMAIN_LENGTH: process.env.RANDOM_SUBDOMAIN_LENGTH || "8",
        DISABLE_CUSTOM_ADDRESS_NAME: process.env.DISABLE_CUSTOM_ADDRESS_NAME || "false",
        DISABLE_ANONYMOUS_USER_CREATE_EMAIL: process.env.DISABLE_ANONYMOUS_USER_CREATE_EMAIL || "false",
        CREATE_ADDRESS_DEFAULT_DOMAIN_FIRST: process.env.CREATE_ADDRESS_DEFAULT_DOMAIN_FIRST || "false",
        ADMIN_USER_ROLE: process.env.ADMIN_USER_ROLE,
        USER_DEFAULT_ROLE: process.env.USER_DEFAULT_ROLE,
        USER_ROLES: process.env.USER_ROLES,
        DOMAIN_LABELS: process.env.DOMAIN_LABELS || defaultJsonArray([]),
        PASSWORDS: process.env.PASSWORDS || defaultJsonArray([]),
        ADMIN_PASSWORDS: process.env.ADMIN_PASSWORDS || defaultJsonArray([]),
        DISABLE_ADMIN_PASSWORD_CHECK: process.env.DISABLE_ADMIN_PASSWORD_CHECK || "false",
        BLACK_LIST: process.env.BLACK_LIST || "",
        SMTP_IMAP_PROXY_CONFIG: process.env.SMTP_IMAP_PROXY_CONFIG,
        ENABLE_INDEX_ABOUT: process.env.ENABLE_INDEX_ABOUT || "false",
        DEFAULT_SEND_BALANCE: process.env.DEFAULT_SEND_BALANCE,
        NO_LIMIT_SEND_ROLE: process.env.NO_LIMIT_SEND_ROLE,
        ADMIN_CONTACT: process.env.ADMIN_CONTACT,
        COPYRIGHT: process.env.COPYRIGHT,
        STATUS_URL: process.env.STATUS_URL,
        DISABLE_SHOW_GITHUB: process.env.DISABLE_SHOW_GITHUB || "false",
        FORWARD_ADDRESS_LIST: process.env.FORWARD_ADDRESS_LIST || defaultJsonArray([]),
        ENABLE_CHECK_JUNK_MAIL: process.env.ENABLE_CHECK_JUNK_MAIL || "false",
        JUNK_MAIL_CHECK_LIST: process.env.JUNK_MAIL_CHECK_LIST || defaultJsonArray([]),
        JUNK_MAIL_FORCE_PASS_LIST: process.env.JUNK_MAIL_FORCE_PASS_LIST || defaultJsonArray([]),
        ENABLE_ANOTHER_WORKER: process.env.ENABLE_ANOTHER_WORKER || "false",
        ANOTHER_WORKER_LIST: process.env.ANOTHER_WORKER_LIST,
        SUBDOMAIN_FORWARD_ADDRESS_LIST: process.env.SUBDOMAIN_FORWARD_ADDRESS_LIST,
        REMOVE_ALL_ATTACHMENT: process.env.REMOVE_ALL_ATTACHMENT || "false",
        REMOVE_EXCEED_SIZE_ATTACHMENT: process.env.REMOVE_EXCEED_SIZE_ATTACHMENT || "false",
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        S3_BUCKET: process.env.S3_BUCKET,
        S3_URL_EXPIRES: parseNumber(process.env.S3_URL_EXPIRES, 360),
        CF_TURNSTILE_SITE_KEY: process.env.CF_TURNSTILE_SITE_KEY,
        CF_TURNSTILE_SECRET_KEY: process.env.CF_TURNSTILE_SECRET_KEY,
        RESEND_TOKEN: process.env.RESEND_TOKEN,
        SMTP_CONFIG: process.env.SMTP_CONFIG,
        SEND_MAIL_DOMAINS: process.env.SEND_MAIL_DOMAINS,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
        TG_MAX_ADDRESS: parseNumber(process.env.TG_MAX_ADDRESS, 5),
        TG_BOT_INFO: process.env.TG_BOT_INFO,
        TG_ALLOW_USER_LANG: process.env.TG_ALLOW_USER_LANG || "true",
        ENABLE_TG_PUSH_ATTACHMENT: process.env.ENABLE_TG_PUSH_ATTACHMENT || "false",
        FRONTEND_URL: process.env.FRONTEND_URL,
        ENABLE_AI_EMAIL_EXTRACT: process.env.ENABLE_AI_EMAIL_EXTRACT || "false",
        AI_EXTRACT_MODEL: process.env.AI_EXTRACT_MODEL,
        ENABLE_MAIL_GZIP: process.env.ENABLE_MAIL_GZIP || "false",
        E2E_TEST_MODE: process.env.E2E_TEST_MODE || "false",
    } as Bindings;
};

export const loadLocalEnvFiles = async (): Promise<void> => {
    const dotenv = await import("dotenv");
    const localEnvPath = resolve(process.cwd(), ".env.local");
    const envPath = resolve(process.cwd(), ".env");
    if (existsSync(envPath)) {
        dotenv.config({ path: envPath });
    }
    if (existsSync(localEnvPath)) {
        dotenv.config({ path: localEnvPath, override: true });
    }
};
