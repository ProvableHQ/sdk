import sinon from "sinon";
import { expect } from "chai";
import {
    Account,
    BlockJSON,
    AleoNetworkClient,
    TransactionObject,
    InputObject,
    OutputObject,
    ExecutionObject,
    DeploymentObject,
    ExecutionJSON,
    InputJSON,
    OutputJSON,
    Plaintext,
    PlaintextObject,
    Transition,
    TransitionObject,
} from "@provablehq/sdk/%%NETWORK%%.js";
import { beaconPrivateKeyString } from "./data/account-data.js";
import { retryWithBackoff } from "../src/utils/utils.js";
import { Program } from "@provablehq/wasm";

async function catchError(f: () => Promise<any>): Promise<Error | null> {
    try {
        await f();
        return null;
    } catch (e) {
        return e as Error;
    }
}

async function expectThrows(f: () => Promise<any>): Promise<void> {
    const error = await catchError(f);
    expect(error).not.equal(null);
}

describe("NodeConnection", () => {
    let connection: AleoNetworkClient;
    let windowFetchSpy: sinon.SinonSpy;

    beforeEach(() => {
        connection = new AleoNetworkClient("https://api.provable.com/v2");
        windowFetchSpy = sinon.spy(globalThis, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
        windowFetchSpy = null as any;
    });

    describe("setAccount", () => {
        it("should set the account property", () => {
            const account = new Account();
            connection.setAccount(account);
            expect(connection.getAccount()).equal(account);
        });
    });

    describe("getBlock", () => {
        it.skip("should return a Block object", async () => {
            const block = await connection.getBlock(1);
            expect((block as BlockJSON).block_hash).equal(
                "ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me",
            );
        });

        it("should throw an error if the request fails", async () => {
            await expectThrows(() => connection.getBlock(99999999));
        });
    });

    describe("getBlockRange", () => {
        it.skip("should return an array of Block objects", async () => {
            const blockRange = await connection.getBlockRange(1, 3);
            expect(Array.isArray(blockRange)).equal(true);
            expect((blockRange as BlockJSON[]).length).equal(3);
            expect(
                ((blockRange as BlockJSON[])[0] as BlockJSON).block_hash,
            ).equal(
                "ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me",
            );
            expect(
                ((blockRange as BlockJSON[])[1] as BlockJSON).block_hash,
            ).equal(
                "ab1uqmm97qk5gzhgwh6308h48aszazhfnn0xdq84lrj7e7myyrf9yyqmqdf42",
            );
        });
    });

    describe("getProgram", () => {
        it("endpoints return the correct types", async () => {
            // Ensure the program returned is a string.
            const program = await connection.getProgram("credits.aleo");
            const programV0 = await connection.getProgram("credits.aleo", 0);
            expect(typeof program).equal("string");
            expect(typeof programV0).equal("string");

            // Ensure the program returned is of the correct object..
            const programWasm = await connection.getProgramObject("credits.aleo");
            const programWasmV0 = await connection.getProgramObject("credits.aleo", 0);
            expect(programWasm.id()).equals("credits.aleo");
            expect(programWasmV0.id()).equals("credits.aleo");

            // Ensure the edition returned is correct.
            const creditsEdition = await connection.getLatestProgramEdition("credits.aleo");
            expect(creditsEdition == 0).to.equal(true);
        });

        it("should throw an error if the request fails", async () => {
            const program_id =
                "a" + Math.random().toString(32).substring(2) + ".aleo";

            await expectThrows(() => connection.getProgram(program_id));
        });
    });

    describe("getLatestBlock", () => {
        it("should return a Block object", async () => {
            const latestBlock = await connection.getLatestBlock();
            expect(typeof (latestBlock as BlockJSON).block_hash).equal(
                "string",
            );
        });

        it.skip("should set the X-Aleo-SDK-Version header", async () => {
            expect(windowFetchSpy.args).deep.equal([]);

            await connection.getLatestBlock();

            expect(windowFetchSpy.args).deep.equal([
                [
                    "https://api.provable.com/v2/%%NETWORK%%/block/latest",
                    {
                        headers: {
                            // @TODO: Run the Jest tests on the compiled Rollup code,
                            //        so that way the version is properly replaced.
                            "X-Aleo-SDK-Version": "%%VERSION%%",
                        },
                    },
                ],
            ]);
        });
    });

    describe("getLatestCommittee", () => {
        it("should return a string", async () => {
            const latestCommittee = await connection.getLatestCommittee();
            expect(typeof latestCommittee).equal("object");
        });
    });

    describe("getLatestHeight", () => {
        it("should return a number", async () => {
            const latestHeight = await connection.getLatestHeight();
            expect(typeof latestHeight).equal("number");
        });
    });

    describe("getStateRoot", () => {
        it("should return a string", async () => {
            const stateRoot = await connection.getStateRoot();
            expect(typeof stateRoot).equal("string");
        });
    });

    describe("getProgramImports", () => {
        it("should return the correct program import names", async () => {
            const creditImports =
                await connection.getProgramImportNames("credits.aleo");
            const expectedCreditImports: string[] = [];
            expect(creditImports).deep.equal(expectedCreditImports);
        });

        it.skip("should return all nested imports", async () => {
            const imports = await connection.getProgramImports(
                "imported_add_mul.aleo",
            );
            const expectedImports = {
                "multiply_test.aleo":
                    "program multiply_test.aleo;\n" +
                    "\n" +
                    "function multiply:\n" +
                    "    input r0 as u32.public;\n" +
                    "    input r1 as u32.private;\n" +
                    "    mul r0 r1 into r2;\n" +
                    "    output r2 as u32.private;\n",
                "double_test.aleo":
                    "import multiply_test.aleo;\n" +
                    "\n" +
                    "program double_test.aleo;\n" +
                    "\n" +
                    "function double_it:\n" +
                    "    input r0 as u32.private;\n" +
                    "    call multiply_test.aleo/multiply 2u32 r0 into r1;\n" +
                    "    output r1 as u32.private;\n",
                "addition_test.aleo":
                    "program addition_test.aleo;\n" +
                    "\n" +
                    "function binary_add:\n" +
                    "    input r0 as u32.public;\n" +
                    "    input r1 as u32.private;\n" +
                    "    add r0 r1 into r2;\n" +
                    "    output r2 as u32.private;\n",
            };
            expect(imports).equal(expectedImports);
        });
    });

    describe("retryWithBackoff", () => {
        it("should retry failed network requests and eventually give up", async () => {
            const client = new AleoNetworkClient("http://localhost:1234");

            let attemptCount = 0;

            client.fetchRaw = async () => {
                return await retryWithBackoff(async () => {
                    attemptCount++;
                    console.warn(`fake fetchRaw attempt ${attemptCount}`);
                    throw Object.assign(new Error("503 Service Unavailable"), {
                        status: 503,
                    });
                });
            };

            try {
                await client.fetchData("/block/latest");
                throw new Error("Expected fetchData to fail");
            } catch (err: any) {
                expect(err.message).to.include("503");
                expect(attemptCount).to.be.greaterThan(1);
            }
        });

        it("should retry failed transaction submissions and eventually give up", async () => {
            const client = new AleoNetworkClient("http://localhost:1234");

            let attemptCount = 0;

            client["_sendPost"] = async () => {
                attemptCount++;
                console.warn(`fake sendPost attempt ${attemptCount}`);
                const error = new Error("503 Service Unavailable") as any;
                error.status = 503;
                throw error;
            };

            try {
                await retryWithBackoff(
                    () =>
                        client["_sendPost"]("http://fakeurl", {
                            method: "POST",
                        }),
                    {
                        retryOnStatus: [503],
                    },
                );
                throw new Error("Expected retryWithBackoff to fail");
            } catch (err: any) {
                expect(err.message).to.include("503");
                expect(attemptCount).to.be.greaterThan(1);
            }
        });

        it("should retry solution submission and eventually throw", async () => {
            const client = new AleoNetworkClient("http://localhost:1234");

            let attemptCount = 0;

            client["_sendPost"] = async function () {
                attemptCount++;
                throw Object.assign(new Error("Network error"), {
                    status: 503,
                });
            };

            try {
                await retryWithBackoff(
                    () =>
                        client["_sendPost"]("http://fakeurl", {
                            method: "POST",
                        }),
                    {
                        retryOnStatus: [503],
                    },
                );
                throw new Error("Expected sendPost to fail");
            } catch (err: any) {
                expect(err.message).to.include("Network error");
                expect(attemptCount).to.be.greaterThan(1);
            }
        });
    });

    describe("setHeader", () => {
        it("should correctly update the headers map", async () => {
            connection.setHeader("X-Test-Header", "testvalue");
            expect(connection.headers["X-Test-Header"]).equal("testvalue");
        });

        it("should update existing header in map", async () => {
            connection.setHeader("X-Test-Header", "secondtestvalue");
            expect(connection.headers["X-Test-Header"]).equal(
                "secondtestvalue",
            );
        });
    });

    describe("removeHeader", () => {
        it("should remove header from the map", async () => {
            connection.removeHeader("X-Test-Header");
            expect(connection.headers["X-Test-Header"]).undefined;
        });
    });

    describe("waitForTransactionConfirmation", () => {
        const mainnetAcceptedTx =
            "at1dl9lze8wscct0dee8x9tjnfmpjvj33hh23jcnp5f0ywjn5552yrsperzl9";
        const mainnetRejectedTx =
            "at1x5ed0pyjpt3770e0m60psvdvqeww5z5f32t7velrmrjfhvzgysxqll4g6a";
        const testnetAcceptedTx =
            "at1aknmzq2k2ktuy8l55hthlzkues98fuye0s05nnxfp86ruukz5grsrrujgv";
        const testnetRejectedTx =
            "at1xmjjt0sr2nv2ah38t7j9hmema28w7xfdckz9slyfjqjqywpudvxqdlxvd3";
        const invalidTx =
            "at1dl9lze8wscct0dee8x9tjnfmpj12345678jcnp5f0ywjn5552yrsperzl9";

        const host = "https://api.provable.com/v2";

        function getTxId(
            connection: AleoNetworkClient,
            type: "accepted" | "rejected",
        ) {
            const isTestnet = connection.host.includes("/testnet");
            return type === "accepted"
                ? isTestnet
                    ? testnetAcceptedTx
                    : mainnetAcceptedTx
                : isTestnet
                    ? testnetRejectedTx
                    : mainnetRejectedTx;
        }

        it("should return confirmed transaction data for an accepted tx ID", async () => {
            if (connection.network === "mainnet") {
                const connection = new AleoNetworkClient(host);
                const txId = getTxId(connection, "accepted");
                const data = await connection.waitForTransactionConfirmation(txId);
                expect(data.status).to.equal("accepted");
                expect(data.type).to.be.a("string");
            }
        });

        it("should throw for a rejected tx ID", async () => {
            const connection = new AleoNetworkClient(host);
            const txId = getTxId(connection, "rejected");
            try {
                console.log(txId);
                await connection.waitForTransactionConfirmation(txId);
                throw new Error(
                    "Expected waitForTransactionConfirmation to throw for rejected tx",
                );
            } catch (err: any) {
                console.log(err.message);
                if (connection.network === "mainnet") {
                    expect(err.message).to.include("was rejected by the network");
                }
            }
        });

        it("should throw for a malformed tx ID", async () => {
            const connection = new AleoNetworkClient(host);
            expectThrows(() => connection.waitForTransactionConfirmation(invalidTx));
        });
    });

    describe("findUnspentRecords", () => {
        it("should fail if block heights or private keys are incorrectly specified", async () => {
            await expectThrows(() =>
                connection.findUnspentRecords(
                    5,
                    0,
                    [],
                    undefined,
                    undefined,
                    [],
                    beaconPrivateKeyString,
                ),
            );

            await expectThrows(() =>
                connection.findUnspentRecords(
                    -5,
                    5,
                    [],
                    undefined,
                    undefined,
                    [],
                    beaconPrivateKeyString,
                ),
            );

            await expectThrows(() =>
                connection.findUnspentRecords(
                    0,
                    5,
                    [],
                    undefined,
                    undefined,
                    [],
                    "definitelynotaprivatekey",
                ),
            );

            await expectThrows(() =>
                connection.findUnspentRecords(
                    0,
                    5,
                    undefined,
                    undefined,
                    undefined,
                    [],
                ),
            );
        });

        it.skip("should search a range correctly and not find records where none exist", async () => {
            const records = await connection.findUnspentRecords(
                0,
                204,
                [],
                undefined,
                undefined,
                [],
                beaconPrivateKeyString,
            );
            expect(Array.isArray(records)).equal(true);
            if (!(records instanceof Error)) {
                expect(records.length).equal(0);
            }
        });
    });

    describe("Mappings", () => {
        it("should find program mappings and read mappings", async () => {
            if (connection.network === "testnet") {
                const mappings =
                    await connection.getProgramMappingNames("credits.aleo");
                if (!(mappings instanceof Error)) {
                    expect(mappings).deep.equal([
                        "committee",
                        "delegated",
                        "metadata",
                        "bonded",
                        "unbonding",
                        "account",
                        "withdraw",
                        "pool",
                    ]);
                }
            } else {
                const mappings =
                    await connection.getProgramMappingNames("credits.aleo");
                if (!(mappings instanceof Error)) {
                    expect(mappings).deep.equal([
                        "committee",
                        "delegated",
                        "metadata",
                        "bonded",
                        "unbonding",
                        "account",
                        "withdraw",
                        "pool",
                    ]);
                }
            }
        });
    });

    describe('Test API methods that return wasm objects', () => {
        it('Plaintext returned from the API should have expected properties', async () => {
            if (connection.network === "testnet") {
                // Check a struct variant of a plaintext object.
                let plaintext = await connection.getProgramMappingPlaintext(
                    "credits.aleo",
                    "committee",
                    "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal",
                );
                expect(plaintext.plaintextType()).equal("struct");

                // Ensure the JS object representation matches the wasm representation.
                const isOpen = <Plaintext>plaintext.find("is_open").toObject();
                const commission = <Plaintext>(
                    plaintext.find("commission").toObject()
                );
                const plaintextObject = plaintext.toObject();
                expect(plaintextObject.is_open).equal(isOpen);
                expect(plaintextObject.commission).equal(commission);

                // Check a literal variant of a plaintext object.
                plaintext = await connection.getProgramMappingPlaintext(
                    "credits.aleo",
                    "account",
                    "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal",
                );
                expect(plaintext.plaintextType()).equal("u64");
                expect(plaintext.toObject()).a("bigint");
            }
        });

        it("should have correct data within the wasm object and summary object for an execution transaction", async () => {
            // Get the first transaction at block 24700 on testnet.
            if (connection.network === "testnet") {
                const transaction = await connection.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
                const transition = <Transition>transaction.transitions()[0];
                const summary = <TransactionObject>transaction.summary(true);

                // Ensure the transaction metadata was correctly computed.
                expect(transaction.id()).equal(
                    "at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd",
                );
                expect(transaction.isExecute()).equal(true);
                expect(transaction.isFee()).equals(false);
                expect(transaction.isDeploy()).equals(false);
                expect(transaction.records().length).equals(1);

                // Check the transition object contains the correct transition metadata
                expect(transition.programId()).equals(
                    "puzzle_arcade_coin_v001.aleo",
                );
                expect(transition.functionName()).equals("mint");
                expect(transition.inputs(true).length).equals(2);
                expect(transition.outputs(true).length).equals(1);
                expect(transition.tpk().toString()).equals(
                    "6666707959509237020554863505720154589525217196021270704042929032892063700604group",
                );
                expect(transition.tcm().toString()).equals(
                    "5140704971235445395514301730284508935687584564904251867869912904008739082032field",
                );
                expect(transition.scm().toString()).equals(
                    "4048085747685910464005835076598544744404883618916202014212851266936759881218field",
                );

                // Ensure the object summary returns the correct transaction metadata.
                const execution = <ExecutionObject>summary.execution;
                expect(summary.type).equals(transaction.transactionType());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(execution.transitions.length).equals(2);
                expect(<string>execution.transitions[0].tpk).equals(
                    "6666707959509237020554863505720154589525217196021270704042929032892063700604group",
                );
                expect(<string>execution.transitions[0].tcm).equals(
                    "5140704971235445395514301730284508935687584564904251867869912904008739082032field",
                );
                expect(<string>execution.transitions[0].scm).equals(
                    "4048085747685910464005835076598544744404883618916202014212851266936759881218field",
                );
                expect(execution.transitions[0].function).equals("mint");
                expect(summary.id).equals(transaction.id());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(summary.baseFee).equals(transaction.baseFeeAmount());
                expect(summary.priorityFee).equals(
                    transaction.priorityFeeAmount(),
                );

                // Check inputs.
                const transition_summary = <TransitionObject>(
                    execution.transitions[0]
                );
                const transition_inputs = <InputObject[]>(
                    transition_summary.inputs
                );
                const transition_outputs = <OutputObject[]>(
                    transition_summary.outputs
                );
                // Ensure the transition_summary matches the wasm object.
                expect(transition_summary.tpk).equals(
                    transition.tpk().toString(),
                );
                expect(transition_summary.tcm).equals(
                    transition.tcm().toString(),
                );
                expect(transition_summary.scm).equals(
                    transition.scm().toString(),
                );
                expect(transition_summary.function).equals(
                    transition.functionName(),
                );
                expect(transition_summary.id).equals(transition.id());
                expect(transition_summary.program).equals(
                    transition.programId(),
                );
                expect(transition_inputs.length).equals(
                    transition.inputs(true).length,
                );
                expect(transition_outputs.length).equals(
                    transition.outputs(true).length,
                );

                // // Check the summary's inputs and outputs match expected values.
                const transition_input_1 = <InputObject>transition_inputs[0];
                const transition_input_2 = <InputObject>transition_inputs[1];
                const transition_output_1 = <OutputObject>transition_outputs[0];
                expect(transition_input_1.type).equals("public");
                expect(transition_input_2.type).equals("public");
                expect(<string>transition_input_1.value).equals(
                    "aleo1mltea0uj6865k5qvvf4er424wg8kqgh4ldlkgav7qzrzrw3mmvgq5rj3s8",
                );
                expect(transition_output_1.type).equals("record");
                expect(<string>transition_output_1.id).equals(
                    "5572694414900952602617575422938223520445524449912062453787036904987112234218field",
                );
                expect(<string>transition_output_1.checksum).equals(
                    "976841447793933847827686780055501802433867163411662643088590532874495495156field",
                );
                expect(<string>transition_output_1.value).equals(
                    "record1qyqsqkh52naqk7l62m9rw3emwm0swuttcs7qs6lqqeu2czc34mv7h2c8qyrxzmt0w4h8ggcqqgqsq5de236vn6h0z3cvecduyzmqmaw0ue8wk4a9a5z89r7qxv53cwgg4xqpmzq9tv35fzyt6xfem9f74qcx9qsj90e6gzajfetc874q6g9snrzkgw",
                );
            }
        });

        it.skip("should have correct data within the wasm object and summary object for a deployment transaction", async () => {
            // Get the deployment transaction for token_registry.aleo
            if (connection.network === "mainnet") {
                const transaction = await connection.getTransactionObject("at15mwg0jyhvpjjrfxwrlwzn8puusnmy7r3xzvpjht4e5gzgnp68q9qd0qqec");
                const summary = <TransactionObject>transaction.summary(true);
                const deployment = <DeploymentObject>summary.deployment;

                // Ensure the transaction metadata was correctly computed.
                expect(transaction.id()).equal(
                    "at15mwg0jyhvpjjrfxwrlwzn8puusnmy7r3xzvpjht4e5gzgnp68q9qd0qqec",
                );
                expect(transaction.isExecute()).equal(false);
                expect(transaction.isFee()).equals(false);
                expect(transaction.isDeploy()).equals(true);
                expect(transaction.records().length).equals(0);

                // Ensure the object summary returns the correct general transaction metadata.
                expect(summary.type).equals(transaction.transactionType());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(summary.execution).equals(undefined);
                expect(summary.id).equals(transaction.id());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(summary.baseFee).equals(transaction.baseFeeAmount());
                expect(summary.priorityFee).equals(
                    transaction.priorityFeeAmount(),
                );
                expect(deployment.program).equals("token_registry.aleo");
                expect(deployment.functions.length).equals(22);
            }
        });

        it('Should give the correct JSON response when requesting multiple transactions', async () => {
            if (connection.network === "testnet") {
                const transactions = await connection.getTransactions(27400);
                expect(transactions.length).equal(4);
                expect(transactions[0].status).equal("accepted");
                expect(transactions[0].type).equal("execute");
                expect(transactions[0].index).equal(BigInt(2));
                expect(transactions[0].finalize.length).equal(1);
                expect(transactions[0].transaction.id).equal(
                    "at138fg8qgtpz0t6qs2sss5xpcnu8g5tfz2vvwvqgspgulmsrmq95zsqjlffj",
                );
                expect(transactions[0].transaction.type).equal("execute");

                const execution = <ExecutionJSON>(
                    transactions[0].transaction.execution
                );
                expect(execution.transitions.length).equal(1);
                expect(execution.transitions[0].id).equal(
                    "au1938vjhpr6v8ef0zrp98u8fn2vjcyn4742fttqpxf6lhsnmqmqszq7fxsn8",
                );
                expect(execution.transitions[0].program).equal(
                    "puzzle_arcade_coin_v001.aleo",
                );
                expect(execution.transitions[0].function).equal("mint");
                expect(
                    (<InputJSON[]>execution.transitions[0].inputs).length,
                ).equal(2);

                // Get outputs and ensure they have the correct values.
                const outputs = <OutputJSON[]>execution.transitions[0].outputs;
                expect(outputs.length).equal(1);
                expect(outputs[0].type).equal("record");
                expect(outputs[0].id).equal(
                    "6817422891118474274247599913784134683996272412886646414026001662646317225059field",
                );
                expect(outputs[0].value).equal(
                    "record1qyqspvrrwn0fzhrtj02htqd27m5q4dskdq4fdksjwcdvjuduwjejrkgtqyrxzmt0w4h8ggcqqgqsqd7njmujg88tuhvr8snk5lqw5xpz5dxzv4alvclchs0mlf2xylcvqlj0lzxdf780jllfcgn0wksjyjejqrkjp0qywf7lg98nhl004vqsytjdcz",
                );
                expect(<string>outputs[0].checksum).equal(
                    "3292133074455271291191412792489196291558528545777011656317544607191050261126field",
                );
                expect(transactions[0].transaction.fee.proof).equal(
                    "proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqqha9xy3wlj6trgmp4kcmhvlj2xmj7elzzd0pnwy6mwdphcs58g4r0g4s269vrsyh25fljgmqcg7cpq882dyw0ucprxdgga3y6pcr84jfr7n9uh5sffvcmvj3unjl2mj0wuk0v535lrgg97lp6z3css88y9qg5pgsumqad96cl2n92wu3rhzylz3qfwh2p280ntlmq85mwykauugytjlc9qz2h5nv4rz3htlznx2qt9pwr9pgqygrynqmfzeh5tryudcfr305ced3yevq88kefeqgxs9h0h49m6xkgs904nd6km03q7dvqnwfrku9wqzpkn8zje07xqg88lf49ke8qhsxsnpztl0dtgz4vh0d7pcjwp5ptr3crexhc05kaa80qqys8axds3sqr3hu52sjz0sm7cjzxmma3rmnrycefmy6qsv28a3ufpv6yu48pst86xmw4xaxcxpn5sqrlhvsx0srxchpj76l5wgnf33vy5awyhv5u7at434j3pp058059d2uda5kthzykch9zldqgdhueeq92djmkunpclshfkleq28pg8vqufexqc8uma7mswr9ev77q963mgrmzm4z7t9dw6ym5x32hsx9992qk3xrp092a62yj672cs87j7yxgfuhuzy2dxph6l4uursmqx5tksu8dshjcpjuadla2a8aypwvdz6gp7tqhjwgz23dggjjh9ejf700y9syqhchrgfu9qe8ua8remj9d8uxqv3q4zdc6t3meyp48w6kg88w0sthevxxm8qxp4x9f7pppjs4vvpzly7ztkl5sxrvxwy30n50rfj0gd63mueskea9a7kuv277fr6r3q2udsm74h6wqpcrmncuwfetyrraumdvkwx8u8te25qngcw90raupru29ffs3p2swysagmmtyaxdx2ypzk2nyse2lda6cfulspxtjlwcga3jtjcz4tc7xxcez7frtrl5cqxluyh24svgt8e0lg0a7j7khqupkxlrfs9jc5gnwmp298zwmfmcs65autm67phf5jy5ar3kcfrs77y0e5vqnfexsh56jlac4vsrcfnvak3c64ppgzzqhpw6vwe0cs6dmzz3acu7ygk094usmyv7plttk7t8ff8gnfvq8rh0cckhzrmcwnmuqq6klg02hfhssdpxqpm9rpsntn5gqvvn5zg60hu7xqlnkaz9gyjqfqvqqqqqqqqqqqelp043ptq7k8hmrulh7pqygtuytn4qmwsqk73yfrnyzrvwd30nh03rm3f7l220sdgktupv9zchvsqq24q6tey0eyv82p6ks2e0cqql3gdn0q55gm2pr3rkklc0wpacfvnr7wdvp30y8mtleykmp86y5yrgqq9a0z7dhfzzp3897jgpdvhw0apqs3ul5mgetznkxpgttdxtndnj3r2wsg6tscaqxjv2lacwp798z93jl2c6ykh3gnwapx99u35sgwn03v23vx82jawf79d5uyfaq4m6vqyqquwfs0x",
                );
                expect(transactions[0].transaction.fee.global_state_root).equal(
                    "sr1uwx36xp95j7p2w7yadnj5ups6n8ktf0uwnvq0yauk2fefa2lsqysj4ydym",
                );
                expect(
                    transactions[0].transaction.fee.transition.function,
                ).equal("fee_public");
                expect(
                    transactions[0].transaction.fee.transition.program,
                ).equal("credits.aleo");

                // Check the fee inputs.
                const feeInputs = <InputJSON[]>(
                    transactions[0].transaction.fee.transition.inputs
                );
                expect(feeInputs.length).equal(3);
                expect(feeInputs[0].type).equal("public");
                // expect(feeInputs[0].value).equal("1449u64");
                expect(feeInputs[0].id).equal(
                    "7979811994391082433649905735902803438919884682173343399169977021461204057201field",
                );

                // Check the fee outputs.
                const feeOutputs = <OutputJSON[]>(
                    transactions[0].transaction.fee.transition.outputs
                );
                expect(feeOutputs.length).equal(1);
                expect(feeOutputs[0].type).equal("future");
                expect(feeOutputs[0].id).equal(
                    "1476545115130530285809395059911737967159046196284872253242026022319105772784field",
                );
                expect(feeOutputs[0].value).equal(
                    "{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo193cgzzpr5lcwq6rmzq4l2ctg5f4mznead080mclfgrc0e5k0w5pstfdfps,\n    1449u64\n  ]\n}",
                );
            }
        });
    });

    describe("getProgramImports", () => {
        it("should not fetch the same program multiple times with overlapping imports", async function() {
            // Only run on testnet - amm_orcl_intrfc_v.aleo only exists on testnet
            if (connection.network !== "testnet") {
                this.skip();
                return;
            }
            
            // Track all calls to getProgram to detect duplicates
            const fetchedPrograms = new Map<string, number>();
            const originalGetProgram = connection.getProgram.bind(connection);
            
            connection.getProgram = async function(programId: string) {
                const count = (fetchedPrograms.get(programId) || 0) + 1;
                fetchedPrograms.set(programId, count);
                return originalGetProgram(programId);
            };

            // Test with amm_orcl_intrfc_v.aleo which has 23 imports with heavy overlap
            // This program previously caused exponentially recursive API calls resulting in rate limiting.
            const imports = await connection.getProgramImports("amm_orcl_intrfc_v.aleo");
            
            // Verify we got all the imports
            expect(Object.keys(imports).length).to.be.greaterThan(0);
            
            // Verify each program was fetched exactly once (no duplicates)
            const duplicates = Array.from(fetchedPrograms.entries())
                .filter(([_, count]) => count > 1);
            
            if (duplicates.length > 0) {
                const duplicateNames = duplicates.map(([name, count]) => `${name} (${count}x)`).join(', ');
                throw new Error(`Programs fetched multiple times: ${duplicateNames}`);
            }
            
            // Verify total API calls equals number of unique imports
            const totalCalls = Array.from(fetchedPrograms.values()).reduce((a, b) => a + b, 0);
            expect(totalCalls).to.equal(fetchedPrograms.size);
        });
    });
});

describe("AleoNetworkClient JWT refresh URL", () => {
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    const jwtEdgeCases = [
        { label: "standard Provable API", host: "https://api.provable.com/v2", expectedOrigin: "https://api.provable.com" },
        { label: "custom host with path", host: "https://custom-api.example.com/v2", expectedOrigin: "https://custom-api.example.com" },
        { label: "host with deep path", host: "https://api.example.com/v2/extra", expectedOrigin: "https://api.example.com" },
        { label: "host with port", host: "https://custom-api.example.com:8080/v2", expectedOrigin: "https://custom-api.example.com:8080" },
        { label: "host with trailing slash", host: "https://api.provable.com/v2/", expectedOrigin: "https://api.provable.com" },
        { label: "localhost with port", host: "http://localhost:3030", expectedOrigin: "http://localhost:3030" },
    ];

    jwtEdgeCases.forEach(({ label, host, expectedOrigin }) => {
        it(`should derive JWT refresh origin from ${label}`, async () => {
            const client = new AleoNetworkClient(host);
            client.apiKey = "test-api-key";
            client.consumerId = "test-consumer-id";

            fetchStub.resolves({
                ok: true,
                status: 200,
                headers: new Headers({ authorization: "Bearer test-jwt-token" }),
                json: () => Promise.resolve({ exp: Math.floor(Date.now() / 1000) + 3600 }),
                text: () => Promise.resolve(JSON.stringify({ status: "ok" })),
            });

            try {
                await client.submitProvingRequestSafe({ provingRequest: "test-request" });
            } catch { }

            const firstCallUrl = fetchStub.firstCall.args[0]?.toString() ?? fetchStub.firstCall.args[0]?.url;
            expect(firstCallUrl).to.equal(`${expectedOrigin}/jwts/test-consumer-id`);
        });
    });
});
