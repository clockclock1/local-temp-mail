export const createExecutionContext = (): ExecutionContext => {
    const pending = new Set<Promise<unknown>>();
    return {
        waitUntil(promise: Promise<unknown>) {
            pending.add(promise);
            promise.finally(() => pending.delete(promise));
        },
        passThroughOnException() {
            return;
        },
        props: {},
    } as ExecutionContext;
};

export const createRawReadableStream = (raw: Uint8Array): ReadableStream<Uint8Array> => {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(raw);
            controller.close();
        },
    });
};
