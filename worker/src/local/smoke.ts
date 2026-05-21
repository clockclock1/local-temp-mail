import nodemailer from "nodemailer";

import { createLocalBindings, loadLocalEnvFiles } from "./env.js";
import { createExecutionContext } from "./shared.js";
import { workerFetch } from "../worker.js";
import { startLocalSmtpReceiver } from "./smtp_receiver.js";

await loadLocalEnvFiles();

process.env.LOCAL_SMTP_PORT = process.env.LOCAL_SMTP_PORT || "2625";
const smtpServer = await startLocalSmtpReceiver();

const env = await createLocalBindings();
const ctx = createExecutionContext();
const smokeName = `smoke${Date.now().toString(36)}`;
try {
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

    const transport = nodemailer.createTransport({
        host: "127.0.0.1",
        port: Number(process.env.LOCAL_SMTP_PORT),
        secure: false,
        tls: {
            rejectUnauthorized: false,
        },
    });

    await transport.sendMail({
        from: "Smoke <sender@example.net>",
        to: createJson.address,
        subject: "smtp-smoke-test",
        text: "hello from smtp smoke test",
    });

    await new Promise((resolve) => setTimeout(resolve, 500));

    const mailListResponse = await workerFetch(new Request("http://local.test/api/mails?limit=10&offset=0", {
        headers: {
            Authorization: `Bearer ${createJson.jwt}`,
        },
    }), env, createExecutionContext());

    if (mailListResponse.status !== 200) {
        throw new Error(`mail list failed: ${mailListResponse.status} ${await mailListResponse.text()}`);
    }

    const mailList = await mailListResponse.json() as { count: number };
    if (!mailList.count || mailList.count < 1) {
        throw new Error("mail list is empty after real SMTP delivery");
    }

    console.log(`Smoke test passed for ${createJson.address}`);
} finally {
    smtpServer.close();
}
