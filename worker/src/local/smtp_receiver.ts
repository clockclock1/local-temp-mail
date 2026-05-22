import { readFile } from "node:fs/promises";

import { SMTPServer } from "smtp-server";

import { createLocalBindings, loadLocalEnvFiles } from "./env.js";
import { createExecutionContext, createRawReadableStream } from "./shared.js";
import { workerEmail } from "../worker.js";

const getFirstConfiguredDomain = (bindings: Bindings): string | undefined => {
    const value = bindings.DOMAINS;
    if (Array.isArray(value)) {
        return value.find(Boolean);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value) as string[];
            return parsed.find(Boolean);
        } catch {
            return undefined;
        }
    }
    return undefined;
}

const loadTlsOptions = async () => {
    const keyPath = process.env.LOCAL_SMTP_TLS_KEY_PATH?.trim();
    const certPath = process.env.LOCAL_SMTP_TLS_CERT_PATH?.trim();

    if (!keyPath && !certPath) {
        return {
            hideSTARTTLS: true,
            tlsEnabled: false,
        };
    }

    if (!keyPath || !certPath) {
        console.warn("[smtp] TLS disabled because only one of LOCAL_SMTP_TLS_KEY_PATH / LOCAL_SMTP_TLS_CERT_PATH is set");
        return {
            hideSTARTTLS: true,
            tlsEnabled: false,
        };
    }

    const [key, cert] = await Promise.all([
        readFile(keyPath, "utf-8"),
        readFile(certPath, "utf-8"),
    ]);

    return {
        hideSTARTTLS: false,
        key,
        cert,
        tlsEnabled: true,
    };
}

export const startLocalSmtpReceiver = async () => {
    await loadLocalEnvFiles();
    const bindings = await createLocalBindings();
    const port = Number(process.env.LOCAL_SMTP_PORT || 2525);
    const smtpHostname = process.env.LOCAL_SMTP_HOSTNAME
        || getFirstConfiguredDomain(bindings)
        || "localhost";
    const tlsOptions = await loadTlsOptions();

    const server = new SMTPServer({
        name: smtpHostname,
        disabledCommands: ["AUTH"],
        authOptional: true,
        ...tlsOptions,
        onConnect(session, callback) {
            console.log(`[smtp] connect from=${session.remoteAddress}`);
            callback();
        },
        onMailFrom(address, session, callback) {
            console.log(`[smtp] mail_from=${address.address} ip=${session.remoteAddress}`);
            callback();
        },
        onRcptTo(address, session, callback) {
            console.log(`[smtp] rcpt_to=${address.address} ip=${session.remoteAddress}`);
            callback();
        },
        onData(stream: NodeJS.ReadableStream, session: any, callback: (error?: Error | null) => void) {
            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer | Uint8Array | string) => chunks.push(Buffer.from(chunk)));
            stream.on("end", async () => {
                try {
                    const rawBuffer = Buffer.concat(chunks);
                    const rawText = rawBuffer.toString("utf-8");
                    const headerSection = rawText.split(/\r?\n\r?\n/, 1)[0] || "";
                    const headers = new Headers();
                    for (const line of headerSection.replace(/\r?\n(?=[ \t])/g, " ").split(/\r?\n/)) {
                        const index = line.indexOf(":");
                        if (index > 0) {
                            headers.append(line.slice(0, index).trim(), line.slice(index + 1).trim());
                        }
                    }
                    if (!headers.has("Message-ID")) {
                        headers.set("Message-ID", `<local-${Date.now()}@localhost>`);
                    }

                    const recipients = session.envelope.rcptTo.map((item: { address: string }) => item.address).filter(Boolean);
                    for (const to of recipients) {
                        await workerEmail({
                            from: session.envelope.mailFrom.address || "unknown@localhost",
                            to,
                            headers,
                            rawSize: rawBuffer.byteLength,
                            raw: createRawReadableStream(new Uint8Array(rawBuffer)),
                            setReject(reason: string) {
                                throw new Error(reason);
                            },
                            forward: async (recipient: string) => {
                                console.log(`Forward requested: ${to} -> ${recipient}`);
                                return { messageId: "" };
                            },
                            reply: async () => ({ messageId: "" }),
                        } as ForwardableEmailMessage, bindings, createExecutionContext());
                    }
                    console.log(`[smtp] accepted from=${session.envelope.mailFrom.address || "unknown@localhost"} to=${recipients.join(",")} size=${rawBuffer.byteLength}`);
                    callback();
                } catch (error) {
                    console.error("[smtp] delivery failed", error);
                    callback(error as Error);
                }
            });
        },
    });

    server.listen(port, "0.0.0.0", () => {
        console.log(
            `Local SMTP receiver listening on 0.0.0.0:${port} hostname=${smtpHostname} starttls=${tlsOptions.tlsEnabled ? "enabled" : "disabled"}`
        );
    });

    return server;
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
    await startLocalSmtpReceiver();
}
