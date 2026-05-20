import { createLocalBindings, loadLocalEnvFiles } from "./env.js";
import { createExecutionContext, createRawReadableStream } from "./shared.js";
import { workerEmail, workerFetch } from "../worker.js";

await loadLocalEnvFiles();

const env = await createLocalBindings();
const ctx = createExecutionContext();
const smokeName = `smoke${Date.now().toString(36)}`;

const health = await workerFetch(new Request("http://local.test/health_check"), env, ctx);
if (health.status !== 200) {
    throw new Error(`health_check failed: ${health.status} ${await health.text()}`);
}

const createResponse = await workerFetch(new Request("http://local.test/api/new_address", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        name: smokeName,
        domain: "example.com",
    }),
}), env, ctx);

if (createResponse.status !== 200) {
    throw new Error(`new_address failed: ${createResponse.status} ${await createResponse.text()}`);
}

const createJson = await createResponse.json() as { address: string; jwt: string };
const rawMail = [
    "From: Smoke <sender@example.net>",
    `To: <${createJson.address}>`,
    "Subject: smoke-test",
    "Message-ID: <smoke-test@local>",
    "Content-Type: text/plain; charset=utf-8",
    "",
    "hello from smoke test",
].join("\r\n");

await workerEmail({
    from: "sender@example.net",
    to: createJson.address,
    headers: new Headers({
        "Message-ID": "<smoke-test@local>",
    }),
    rawSize: Buffer.byteLength(rawMail),
    raw: createRawReadableStream(new TextEncoder().encode(rawMail)),
    setReject(reason: string) {
        throw new Error(`email rejected: ${reason}`);
    },
    forward: async () => ({ messageId: "" }),
    reply: async () => ({ messageId: "" }),
} as ForwardableEmailMessage, env, ctx);

const mailListResponse = await workerFetch(new Request("http://local.test/api/mails?limit=10&offset=0", {
    headers: {
        Authorization: `Bearer ${createJson.jwt}`,
    },
}), env, ctx);

if (mailListResponse.status !== 200) {
    throw new Error(`mail list failed: ${mailListResponse.status} ${await mailListResponse.text()}`);
}

const mailList = await mailListResponse.json() as { count: number };
if (!mailList.count || mailList.count < 1) {
    throw new Error("mail list is empty after SMTP/email pipeline");
}

console.log(`Smoke test passed for ${createJson.address}`);
