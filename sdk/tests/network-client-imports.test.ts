import sinon from "sinon";
import { expect } from "chai";
import { AleoNetworkClient, Program } from "@provablehq/sdk/%%NETWORK%%.js";

function source(id: string, imports: string[] = []): string {
    return `${imports.map((dependency) => `import ${dependency};`).join("\n")}
program ${id};
function compute:
    input r0 as u8.public;
    add r0 1u8 into r1;
    output r1 as u8.public;
`;
}

function deferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

async function rejection(operation: Promise<unknown>): Promise<string> {
    try {
        await operation;
    } catch (error) {
        return String(error);
    }
    throw new Error("Expected the operation to fail.");
}

describe("AleoNetworkClient static import resolution", () => {
    let client: AleoNetworkClient;

    beforeEach(() => {
        client = new AleoNetworkClient("https://first.example/v2");
    });

    afterEach(() => sinon.restore());

    it("resolves an independent branch while another source request waits", async () => {
        const blocked = deferred();
        const completed = deferred();
        const programs = {
            "slow.aleo": source("slow.aleo"),
            "fast.aleo": source("fast.aleo", ["leaf.aleo"]),
            "leaf.aleo": source("leaf.aleo"),
        };
        sinon.stub(client, "getProgram").callsFake(async (id) => {
            if (id === "slow.aleo") await blocked.promise;
            if (id === "leaf.aleo") completed.resolve();
            return programs[id as keyof typeof programs];
        });
        const result = client.getProgramImports(
            source("root.aleo", ["slow.aleo", "fast.aleo"]),
        );
        try {
            await completed.promise;
        } finally {
            blocked.resolve();
        }
        expect(Object.keys(await result)).to.deep.equal([
            "slow.aleo",
            "leaf.aleo",
            "fast.aleo",
        ]);
    });

    it("reads a shared dependency once and keeps dependency order", async () => {
        const shared = deferred();
        const programs = {
            "left.aleo": source("left.aleo", ["shared.aleo"]),
            "right.aleo": source("right.aleo", ["shared.aleo"]),
            "shared.aleo": source("shared.aleo"),
        };
        const fetch = sinon.stub(client, "getProgram").callsFake(async (id) => {
            if (id === "shared.aleo") await shared.promise;
            return programs[id as keyof typeof programs];
        });
        const result = client.getProgramImports(
            source("root.aleo", ["left.aleo", "right.aleo"]),
        );
        shared.resolve();
        expect(Object.keys(await result)).to.deep.equal([
            "shared.aleo",
            "left.aleo",
            "right.aleo",
        ]);
        expect(fetch.withArgs("shared.aleo").callCount).to.equal(1);
        expect(fetch.callCount).to.equal(3);
    });

    it("limits source requests across direct and transitive imports", async () => {
        const programs: Record<string, string> = {};
        const branches = Array.from(
            { length: 6 },
            (_, index) => `branch_${index}.aleo`,
        );
        for (const [index, branch] of branches.entries()) {
            const children = [`leaf_${index}_a.aleo`, `leaf_${index}_b.aleo`];
            programs[branch] = source(branch, children);
            for (const child of children) programs[child] = source(child);
        }
        let active = 0;
        let maximum = 0;
        const fetch = sinon.stub(client, "getProgram").callsFake(async (id) => {
            active++;
            maximum = Math.max(maximum, active);
            await new Promise((resolve) => setTimeout(resolve, 0));
            active--;
            return programs[id];
        });
        const imports = await client.getProgramImports(
            source("root.aleo", branches),
        );
        expect(maximum).to.equal(4);
        expect(Object.keys(imports)).to.have.length(18);
        expect(fetch.callCount).to.equal(18);
    });

    it("preserves seeded entries and root traversal with a map without a prototype", async () => {
        const seeded = Program.fromString(
            source("seeded.aleo", ["offline.aleo"]),
        );
        const imports = Object.assign(Object.create(null), {
            "root.aleo": source("root.aleo"),
            "seeded.aleo": seeded,
            "unused.aleo": source("unused.aleo"),
        });
        const fetch = sinon
            .stub(client, "getProgram")
            .resolves(source("fresh.aleo"));
        try {
            const result = await client.getProgramImports(
                source("root.aleo", ["seeded.aleo", "fresh.aleo"]),
                imports,
            );
            expect(result).to.equal(imports);
            expect(result["root.aleo"]).to.equal(source("root.aleo"));
            expect(result["seeded.aleo"]).to.equal(seeded);
            expect(seeded.id()).to.equal("seeded.aleo");
            expect(fetch.callCount).to.equal(1);
            expect(fetch.firstCall.args[0]).to.equal("fresh.aleo");
            expect(result["fresh.aleo"]).to.equal(source("fresh.aleo"));
            expect(Object.keys(result)).to.deep.equal([
                "root.aleo",
                "seeded.aleo",
                "unused.aleo",
                "fresh.aleo",
            ]);
        } finally {
            seeded.free();
        }
    });

    it("resolves root IDs, source strings, and caller-owned Program objects", async () => {
        const root = source("root.aleo", ["leaf.aleo"]);
        const leaf = source("leaf.aleo");
        const fetch = sinon.stub(client, "getProgram");
        fetch.withArgs("root.aleo").resolves(root);
        fetch.withArgs("leaf.aleo").resolves(leaf);
        const program = Program.fromString(root);
        try {
            for (const input of ["root.aleo", root, program]) {
                expect(await client.getProgramImports(input)).to.deep.equal({
                    "leaf.aleo": leaf,
                });
            }
            expect(program.id()).to.equal("root.aleo");
            expect(fetch.withArgs("root.aleo").callCount).to.equal(1);
            expect(fetch.withArgs("leaf.aleo").callCount).to.equal(3);
        } finally {
            program.free();
        }
    });

    it("keeps concurrent, later, and other network operations fresh", async () => {
        const gate = deferred();
        const root = source("root.aleo", ["leaf.aleo"]);
        const first = source("leaf.aleo");
        const second = `${first}\n`;
        const third = `${first}\n\n`;
        const fetch = sinon.stub(client, "getProgram");
        fetch.onFirstCall().callsFake(async () => {
            await gate.promise;
            return first;
        });
        fetch.onSecondCall().resolves(second);
        fetch.onThirdCall().resolves(third);
        const pending = client.getProgramImports(root);
        try {
            expect(
                (await client.getProgramImports(root))["leaf.aleo"],
            ).to.equal(second);
        } finally {
            gate.resolve();
        }
        expect((await pending)["leaf.aleo"]).to.equal(first);
        expect((await client.getProgramImports(root))["leaf.aleo"]).to.equal(
            third,
        );
        const other = new AleoNetworkClient("https://second.example/v2");
        sinon.stub(other, "getProgram").resolves(`${first}\n\n\n`);
        expect((await other.getProgramImports(root))["leaf.aleo"]).to.equal(
            `${first}\n\n\n`,
        );
        expect(fetch.callCount).to.equal(3);
    });

    it("rejects invalid dependencies without returning partial imports", async () => {
        const imports = { "seeded.aleo": source("seeded.aleo") };
        const fetch = sinon.stub(client, "getProgram");
        fetch.withArgs("valid.aleo").resolves(source("valid.aleo"));
        fetch.withArgs("invalid.aleo").resolves("invalid source");
        expect(
            await rejection(
                client.getProgramImports(
                    source("root.aleo", ["valid.aleo", "invalid.aleo"]),
                    imports,
                ),
            ),
        ).to.include("Failed to parse string");
        expect(Object.keys(imports)).to.deep.equal(["seeded.aleo"]);
    });

    it("rejects cycles without repeated reads or a dependency wait", async () => {
        const fetch = sinon.stub(client, "getProgram");
        fetch
            .withArgs("left.aleo")
            .resolves(source("left.aleo", ["right.aleo"]));
        fetch
            .withArgs("right.aleo")
            .resolves(source("right.aleo", ["left.aleo"]));
        expect(
            await rejection(
                client.getProgramImports(source("root.aleo", ["left.aleo"])),
            ),
        ).to.include("Cyclic program import: left.aleo");
        expect(fetch.callCount).to.equal(2);
    });

    it("drains active requests after a failure and lets a later operation recover", async () => {
        const gate = deferred();
        const started = deferred();
        let settled = false;
        let active = false;
        const fetch = sinon.stub(client, "getProgram");
        fetch
            .withArgs("missing.aleo")
            .rejects(new Error("Source unavailable."));
        fetch.withArgs("slow.aleo").callsFake(async () => {
            active = true;
            started.resolve();
            await gate.promise;
            active = false;
            return source("slow.aleo");
        });
        const result = rejection(
            client.getProgramImports(
                source("root.aleo", ["missing.aleo", "slow.aleo"]),
            ),
        ).then((error) => {
            settled = true;
            return error;
        });
        try {
            await started.promise;
            await Promise.resolve();
            expect(settled).to.equal(false);
            expect(active).to.equal(true);
        } finally {
            gate.resolve();
        }
        expect(await result).to.include("Source unavailable.");
        expect(active).to.equal(false);
        fetch.withArgs("missing.aleo").resolves(source("missing.aleo"));
        expect(
            await client.getProgramImports(
                source("root.aleo", ["missing.aleo", "slow.aleo"]),
            ),
        ).to.deep.equal({
            "missing.aleo": source("missing.aleo"),
            "slow.aleo": source("slow.aleo"),
        });
    });

    it("retains the source method header for concurrent requests", async () => {
        const fetch = sinon
            .stub(globalThis, "fetch")
            .callsFake(async (url, options) => {
                const id = String(url).split("/").pop()!;
                expect(
                    new Headers(options?.headers).get("X-ALEO-METHOD"),
                ).to.equal("getProgramVersion");
                return new Response(JSON.stringify(source(id)), {
                    status: 200,
                });
            });
        const imports = await client.getProgramImports(
            source("root.aleo", ["left.aleo", "right.aleo"]),
        );
        expect(Object.keys(imports)).to.deep.equal(["left.aleo", "right.aleo"]);
        expect(fetch.callCount).to.equal(2);
    });
});
