import $child from "node:child_process";
import $fs from "node:fs";

const file = $fs.readFileSync("package.json", { encoding: "utf8" });

$fs.writeFileSync("package.json", file.replace(/"type": "module",/g, ""));

try {
    ["testnet", "mainnet"].forEach((network) => {
        $child.execSync(`wasm-pack test --release --node --no-default-features --features browser,${network} -- --nocapture`, {
            stdio: "inherit",
        });
    });

} finally {
    $fs.writeFileSync("package.json", file);
}
