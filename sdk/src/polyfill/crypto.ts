import { webcrypto } from "node:crypto";

if ((globalThis as any).crypto == null) {
    (globalThis as any).crypto = webcrypto;
}
