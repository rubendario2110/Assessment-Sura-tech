import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// openapi-to-postmanv2 is CommonJS
const Converter = require("openapi-to-postmanv2") as {
  convert: (
    input: { type: string; data: unknown },
    options: Record<string, unknown>,
    cb: (err: Error | null, result: ConversionResult) => void,
  ) => void;
};

interface ConversionResult {
  result: boolean;
  reason?: string;
  output?: Array<{ data: unknown }>;
}

async function main(): Promise<void> {
  const specPath = join(process.cwd(), "docs/api/openapi.json");
  const spec = JSON.parse(readFileSync(specPath, "utf8")) as unknown;

  await new Promise<void>((resolve, reject) => {
    Converter.convert({ type: "json", data: spec }, {}, (err, conversionResult) => {
      if (err) {
        reject(err);
        return;
      }
      if (!conversionResult.result) {
        reject(new Error(conversionResult.reason ?? "Postman conversion failed"));
        return;
      }
      const collection = conversionResult.output?.[0]?.data;
      if (!collection) {
        reject(new Error("Postman conversion produced no output"));
        return;
      }
      const out = join(process.cwd(), "docs/postman/assessment.postman_collection.json");
      writeFileSync(out, `${JSON.stringify(collection, null, 2)}\n`);
      resolve();
    });
  });
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
