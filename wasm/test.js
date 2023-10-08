import $child from "node:child_process";
import $fs from "node:fs";

const file = $fs.readFileSync("package.json", { encoding: "utf8" });

$fs.writeFileSync("package.json", file.replace(/"type": "module",/g, ""));

try {
    $child.execSync("wasm-pack test --node", {
        stdio: "inherit",
    });

} finally {
    $fs.writeFileSync("package.json", file);
}
