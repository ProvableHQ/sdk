import { rm } from "node:fs/promises";
import { glob } from "glob";

const cleanupPatterns = ["template-*/node_modules", "template-*/dist", "template-*/build"];

for (const pattern of cleanupPatterns) {
  const paths = await glob(pattern, { cwd: process.cwd() });
  await Promise.all(
    paths.map(async (targetPath) => {
      await rm(targetPath, { recursive: true, force: true });
    }),
  );
}

console.log("Cleaned template artifacts before packaging.");
