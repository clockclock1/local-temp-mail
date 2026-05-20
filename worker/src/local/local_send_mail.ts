import nodemailer from "nodemailer";

type SendPayload = {
    from?: string | { email?: string; name?: string };
    to?: string[] | string;
    subject?: string;
    text?: string;
    html?: string;
};

const toAddressString = (value: unknown): string => {
    if (typeof value === "string") {
        return value;
    }
    if (value && typeof value === "object") {
        const candidate = value as { name?: string; email?: string; addr?: string };
        const email = candidate.email || candidate.addr || "";
        if (candidate.name && email) {
            return `${candidate.name} <${email}>`;
        }
        return email;
    }
    return "";
};

export class LocalSendMailBinding {
    private readonly transport;

    constructor(options: {
        host: string;
        port: number;
        secure?: boolean;
        user?: string;
        pass?: string;
    }) {
        this.transport = nodemailer.createTransport({
            host: options.host,
            port: options.port,
            secure: !!options.secure,
            ...(options.user ? {
                auth: {
                    user: options.user,
                    pass: options.pass,
                },
            } : {}),
        });
    }

    async send(payload: SendPayload): Promise<void> {
        const to = Array.isArray(payload.to) ? payload.to.join(", ") : payload.to;
        await this.transport.sendMail({
            from: toAddressString(payload.from),
            to,
            subject: payload.subject,
            text: payload.text,
            html: payload.html,
        });
    }
}
