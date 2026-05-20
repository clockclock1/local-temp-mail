import { serve } from "@hono/node-server";

import { createLocalBindings, loadLocalEnvFiles } from "./env.js";
import { createExecutionContext } from "./shared.js";
import { workerFetch } from "../worker.js";

export const startLocalHttpServer = async () => {
    await loadLocalEnvFiles();
    const bindings = await createLocalBindings();
    const port = Number(process.env.LOCAL_HTTP_PORT || 8787);

    const server = serve({
        port,
        fetch: (request) => workerFetch(request, bindings, createExecutionContext()),
    });

    console.log(`Local HTTP API listening on http://127.0.0.1:${port}`);
    return server;
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
    await startLocalHttpServer();
}
