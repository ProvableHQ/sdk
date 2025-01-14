import sinon from "sinon";
import { expect } from "chai";
import { Account, BlockJSON, AleoNetworkClient, TransactionObject, InputObject, OutputObject } from "../src/node";
import { beaconPrivateKeyString } from "./data/account-data";
import { Plaintext,  PlaintextObject, Transition, TransitionObject } from "../src/node";

async function catchError(f: () => Promise<any>): Promise<Error | null> {
    try {
        await f();
        return null;

    } catch (e) {
        return e as Error;
    }
}


async function expectThrows(f: () => Promise<any>, message: string): Promise<void> {
    const error = await catchError(f);
    expect(error).not.equal(null);
    expect(error!.message).equal(message);
}


describe('NodeConnection', () => {
    let connection: AleoNetworkClient;
    let windowFetchSpy: sinon.SinonSpy;

    beforeEach(() => {
        connection = new AleoNetworkClient("https://api.explorer.provable.com/v1");
        windowFetchSpy = sinon.spy(globalThis, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
        windowFetchSpy = null as any;
    });

    describe('setAccount', () => {
        it('should set the account property', () => {
            const account = new Account();
            connection.setAccount(account);
            expect(connection.getAccount()).equal(account);
        });
    });

    describe('getBlock', () => {
        it.skip('should return a Block object', async () => {
            const block = await connection.getBlock(1);
            expect((block as BlockJSON).block_hash).equal("ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me");
        });

        it('should throw an error if the request fails', async () => {
            await expectThrows(
                () => connection.getBlock(99999999),
                "Error fetching block.",
            );
        });
    });

    describe('getBlockRange', () => {
        it.skip('should return an array of Block objects', async () => {
            const blockRange = await connection.getBlockRange(1, 3);
            expect(Array.isArray(blockRange)).equal(true);
            expect((blockRange as BlockJSON[]).length).equal(3);
            expect(((blockRange as BlockJSON[])[0] as BlockJSON).block_hash).equal("ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me");
            expect(((blockRange as BlockJSON[])[1] as BlockJSON).block_hash).equal("ab1uqmm97qk5gzhgwh6308h48aszazhfnn0xdq84lrj7e7myyrf9yyqmqdf42");
        });

        it('should throw an error if the request fails', async () => {
            await expectThrows(
                () => connection.getBlockRange(999999999, 1000000000),
                "Error fetching blocks between 999999999 and 1000000000.",
            );
        });
    });

    describe('getProgram', () => {
        it('should return a string', async () => {
            const program = await connection.getProgram('credits.aleo');
            expect(typeof program).equal('string');
        });

        it('should throw an error if the request fails', async () => {
            const program_id = "a" + (Math.random()).toString(32).substring(2) + ".aleo";

            await expectThrows(
                () => connection.getProgram(program_id),
                "Error fetching program",
            );
        });
    });

    describe('getLatestBlock', () => {
        it('should return a Block object', async () => {
            const latestBlock = await connection.getLatestBlock();
            expect(typeof (latestBlock as BlockJSON).block_hash).equal('string');
        });

        it('should set the X-Aleo-SDK-Version header', async () => {
            expect(windowFetchSpy.args).deep.equal([]);

            await connection.getLatestBlock();

            expect(windowFetchSpy.args).deep.equal([
                [
                    "https://api.explorer.provable.com/v1/%%NETWORK%%/block/latest",
                    {
                        "headers": {
                            // @TODO: Run the Jest tests on the compiled Rollup code,
                            //        so that way the version is properly replaced.
                            "X-Aleo-SDK-Version": "%%VERSION%%"
                        }
                    }
                ],
            ]);
        });
    });

    describe('getLatestCommittee', () => {
        it('should return a string', async () => {
            const latestCommittee = await connection.getLatestCommittee();
            expect(typeof latestCommittee).equal('object');
        });
    });

    describe('getLatestHeight', () => {
        it('should return a number', async () => {
            const latestHeight = await connection.getLatestHeight();
            expect(typeof latestHeight).equal('number');
        });
    });

    describe('getStateRoot', () => {
        it('should return a string', async () => {
            const stateRoot = await connection.getStateRoot();
            expect(typeof stateRoot).equal('string');
        });
    });

    describe('getTransactions', () => {
        it('should throw an error if the request fails', async () => {
            await expectThrows(
                () => connection.getTransactions(999999999),
                "Error fetching transactions.",
            );
        });
    });

    describe('getProgramImports', () => {
        it('should return the correct program import names', async () => {
            const creditImports = await connection.getProgramImportNames("credits.aleo");
            const expectedCreditImports: string[] = [];
            expect(creditImports).deep.equal(expectedCreditImports);
        });

        it.skip('should return all nested imports', async () => {
            const imports = await connection.getProgramImports("imported_add_mul.aleo");
            const expectedImports = {
                'multiply_test.aleo': 'program multiply_test.aleo;\n' +
                    '\n' +
                    'function multiply:\n' +
                    '    input r0 as u32.public;\n' +
                    '    input r1 as u32.private;\n' +
                    '    mul r0 r1 into r2;\n' +
                    '    output r2 as u32.private;\n',
                'double_test.aleo': 'import multiply_test.aleo;\n' +
                    '\n' +
                    'program double_test.aleo;\n' +
                    '\n' +
                    'function double_it:\n' +
                    '    input r0 as u32.private;\n' +
                    '    call multiply_test.aleo/multiply 2u32 r0 into r1;\n' +
                    '    output r1 as u32.private;\n',
                'addition_test.aleo': 'program addition_test.aleo;\n' +
                    '\n' +
                    'function binary_add:\n' +
                    '    input r0 as u32.public;\n' +
                    '    input r1 as u32.private;\n' +
                    '    add r0 r1 into r2;\n' +
                    '    output r2 as u32.private;\n'
            };
            expect(imports).equal(expectedImports);
        });
    });

    describe('findUnspentRecords', () => {
        it('should fail if block heights or private keys are incorrectly specified', async () => {
            await expectThrows(
                () => connection.findUnspentRecords(5, 0, beaconPrivateKeyString, undefined, undefined, []),
                "Start height must be less than or equal to end height.",
            );

            await expectThrows(
                () => connection.findUnspentRecords(-5, 5, beaconPrivateKeyString, undefined, undefined, []),
                "Start height must be greater than or equal to 0",
            );

            await expectThrows(
                () => connection.findUnspentRecords(0, 5, "definitelynotaprivatekey", undefined, undefined, []),
                "Error parsing private key provided.",
            );

            await expectThrows(
                () => connection.findUnspentRecords(0, 5, undefined, undefined, undefined, []),
                "Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient",
            );
        });

        it.skip('should search a range correctly and not find records where none exist', async () => {
            const records = await connection.findUnspentRecords(0, 204, beaconPrivateKeyString, undefined, undefined, []);
            expect(Array.isArray(records)).equal(true);
            if (!(records instanceof Error)) {
                expect(records.length).equal(0);
            }
        });
    });

    describe('Mappings', () => {
        it('should find program mappings and read mappings', async () => {
            const mappings = await connection.getProgramMappingNames("credits.aleo");
            if (!(mappings instanceof Error)) {
                expect(mappings).deep.equal(["committee", "delegated", "metadata", "bonded", "unbonding", "account", "withdraw"]);
            }
        });
    });

    describe('Test API methods that return wasm objects', () => {
        it('should return a struct whose object representation matches the wasm representation', async () => {
            // Ensure we're on testnet.
            const transactions = await connection.getTransactionObjects(27400);
            if (transactions.length > 1) {
                // Check the credits.aleo mapping.
                const plaintext = await connection.getProgramMappingPlaintext("credits.aleo", "committee", "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal");
                const text = await connection.getProgramMappingValue("credits.aleo", "committee", "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal");

                // Ensure the plaintext toString is the same as the api response.
                expect(text).equal(plaintext.toString());

                // Ensure the JS object representation matches the wasm representation.
                const isOpen = (<Plaintext>plaintext.find("is_open")).toObject();
                const commission = (<Plaintext>plaintext.find("commission")).toObject();
                const plaintextObject = plaintext.toObject();
                expect(plaintextObject.is_open).equal(isOpen);
                expect(plaintextObject.commission).equal(commission);
            }
        });

        it('should have a correct transaction summary', async () => {
            // Get the transactions at block 27400 on testnet.
            const transactions = await connection.getTransactionObjects(27400);
            if (transactions.length > 1) {
                const transaction = transactions[0];
                const transition = <Transition>transaction.transitions()[0];
                const summary = <TransactionObject>transactions[0].summary(true);

                // Ensure the transaction metadata was correctly computed.
                expect(transactions.length).equal(3);
                expect(transaction.id()).equal("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
                expect(transaction.isExecute()).equal(true);
                expect(transaction.isFee()).equals(false);
                expect(transaction.isDeploy()).equals(false);
                expect(transaction.records().length).equals( 0);

                // Check the transition object contains the correct transition metadata
                expect(transition.programId()).equals("puzzle_arcade_coin_v001.aleo")
                expect(transition.functionName()).equals("mint");
                expect(transition.inputs(true).length).equals(2);
                expect(transition.outputs(true).length).equals(1);
                expect(transition.tpk().toString()).equals("6666707959509237020554863505720154589525217196021270704042929032892063700604group");
                expect(transition.tcm().toString()).equals("5140704971235445395514301730284508935687584564904251867869912904008739082032field");
                expect(transition.scm().toString()).equals("4048085747685910464005835076598544744404883618916202014212851266936759881218field");

                // Ensure the object summary returns the correct transaction metadata.
                expect(summary.type).equals(transaction.transactionType());
                expect(summary.fee).equals(transaction.feeAmount());
                expect(summary.transitions.length).equals(1);
                expect(<string>summary.transitions[0].tpk).equals("6666707959509237020554863505720154589525217196021270704042929032892063700604group");
                expect(<string>summary.transitions[0].tcm).equals("5140704971235445395514301730284508935687584564904251867869912904008739082032field");
                expect(<string>summary.transitions[0].scm).equals("4048085747685910464005835076598544744404883618916202014212851266936759881218field");
                expect(summary.transitions[0].functionName).equals("transfer_public");
                expect(summary.id).equals(transaction.transactionId());
                expect(summary.fee).equals(transaction.feeAmount());
                expect(summary.baseFee).equals(transaction.baseFeeAmount());
                expect(summary.priorityFee).equals(transaction.priorityFeeAmount());

                // Check inputs.
                const transition_summary = <TransitionObject>summary.transitions[0];
                const transition_inputs = <InputObject[]>transition_summary.inputs;
                const transition_outputs = <OutputObject[]>transition_summary.outputs;
                // Ensure the transition_summary matches the wasm object.
                expect(transition_summary.tpk).equals(transition.tpk().toString());
                expect(transition_summary.tcm).equals(transition.tcm().toString());
                expect(transition_summary.scm).equals(transition.scm().toString());
                expect(transition_summary.functionName).equals(transition.functionName());
                expect(transition_summary.id).equals(transition.id());
                expect(transition_summary.program).equals(transition.programId());
                expect(transition_inputs.length).equals(transition.inputs(true).length);
                expect(transition_outputs.length).equals(transition.outputs(true).length);

                // Check the summary's inputs and outputs match expected values.
                const transition_input_1 = <InputObject>transition_inputs[0];
                const transition_input_2 = <InputObject>transition_inputs[1];
                const transition_output_1 = <OutputObject>transition_outputs[0];
                const transition_future_arguments = <PlaintextObject[]>transition_output_1.arguments;
                expect(transition_input_1.type).equals("public");
                expect(transition_input_2.type).equals("public");
                expect(<string>transition_input_1.value).equals("aleo1mltea0uj6865k5qvvf4er424wg8kqgh4ldlkgav7qzrzrw3mmvgq5rj3s8");
                expect(<bigint>transition_input_1.value).equals(BigInt(1000000));
                expect(transition_output_1.type).equals("future");
                expect(<string>transition_output_1.programId).equals("credits.aleo");
                expect(<string>transition_output_1.functionName).equals("transfer_public");
                expect(transition_future_arguments.length).equals(2);
                expect(<string>transition_future_arguments[0]).equals("aleo193cgzzpr5lcwq6rmzq4l2ctg5f4mznead080mclfgrc0e5k0w5pstfdfps");
                expect(<bigint>transition_future_arguments[1]).equals(BigInt(1449));
            }
        });
    })
});
