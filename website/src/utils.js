import init, * as aleo from "@aleohq/wasm";

await init();

// Get program source code from the Aleo network
async function getProgram(name) {
    const response = await fetch(`https://vm.aleo.org/api/testnet3/program/${name}`);
    if (response.ok) {
        return response.json();
    }
    throw new Error("Unable to get program");
}

// Recursively resolve imports for programs and return a map of program_id to program
// in the form of { "program name": "program source code" }. The object returned from
// this function should be passed to the "imports" parameter of the aleo-wasm program
// execution and deployment functions.
async function resolveImports(program_code) {
    let program = aleo.Program.fromString(program_code);
    const imports = {};
    let importList = program.getImports();
    for (let i = 0; i < importList.length; i++) {
        const import_id = importList[i];
        if (!imports[import_id]) {
            const importedProgram = await getProgram(import_id);
            const nestedImports = await resolveImports(importedProgram);
            for (const key in nestedImports) {
                if (!imports[key]) {
                    imports[key] = nestedImports[key];
                }
            }
            imports[import_id] = importedProgram;
        }
    }
    return imports;
}

export { getProgram, resolveImports };