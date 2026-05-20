import { startLocalHttpServer } from "./server.js";
import { startLocalSmtpReceiver } from "./smtp_receiver.js";

await Promise.all([
    startLocalHttpServer(),
    startLocalSmtpReceiver(),
]);
