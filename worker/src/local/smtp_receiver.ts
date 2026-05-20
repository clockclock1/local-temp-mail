import { SMTPServer } from "smtp-server";

import { createLocalBindings, loadLocalEnvFiles } from "./env.js";
import { createExecutionContext, createRawReadableStream } from "./shared.js";
import { workerEmail } from "../worker.js";

export const startLocalSmtpReceiver = async () => {
    await loadLocalEnvFiles();
    const bindings = await createLocalBindings();
    const port = Number(process.env.LOCAL_SMTP_PORT || 2525);

    const server = new SMTPServer({
        disabledCommands: ["AUTH"],
        authOptional: true,
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
                    callback();
                } catch (error) {
                    callback(error as Error);
                }
            });
        },
    });

    server.listen(port, "0.0.0.0", () => {
        console.log(`Local SMTP receiver listening on 0.0.0.0:${port}`);
    });

    return server;
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
    await startLocalSmtpReceiver();
}
