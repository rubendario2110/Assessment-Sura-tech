import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type RedisConstructor = typeof import("ioredis").default;

/** Loads ioredis via `require` so Jest ESM + `NodeNext` agree with the package’s CJS shape. */
export const Redis = require("ioredis") as RedisConstructor;

export type RedisClient = InstanceType<RedisConstructor>;
