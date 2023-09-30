import { webcrypto } from "node:crypto";

(globalThis as any).crypto = webcrypto;
