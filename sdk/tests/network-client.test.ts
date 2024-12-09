import sinon from "sinon";
import { expect } from "chai";
import {Account, BlockModel, AleoNetworkClient, TransactionSummary} from "../src/node";
import {beaconPrivateKeyString} from "./data/account-data";
import { Plaintext, Transition } from "@provablehq/wasm";

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
            expect((block as BlockModel).block_hash).equal("ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me");
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
            expect((blockRange as BlockModel[]).length).equal(3);
            expect(((blockRange as BlockModel[])[0] as BlockModel).block_hash).equal("ab1eddc3np4h6duwf5a7ht6u0x5maa08780l885j6xq0s7l88df0qrq3d72me");
            expect(((blockRange as BlockModel[])[1] as BlockModel).block_hash).equal("ab1uqmm97qk5gzhgwh6308h48aszazhfnn0xdq84lrj7e7myyrf9yyqmqdf42");
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
            expect(typeof (latestBlock as BlockModel).block_hash).equal('string');
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

    describe('Test object api methods', () => {
        it('should return a plaintext object that matches the text representation', async () => {
            // Get both the plaintext and text.
            const plaintext = await connection.getProgramMappingPlaintext("credits.aleo", "committee", "aleo1n6c5ugxk6tp09vkrjegcpcprssdfcf7283agcdtt8gu9qex2c5xs9c28ay");
            const text = await connection.getProgramMappingValue("credits.aleo", "committee", "aleo1n6c5ugxk6tp09vkrjegcpcprssdfcf7283agcdtt8gu9qex2c5xs9c28ay");

            // Ensure the plaintext toString is the same as the api response.
            expect(text).equal(plaintext.toString());

            // Get the fields one by one and ensure they're equal to the object representation's fields.
            const isOpen = (<Plaintext>plaintext.find("is_open")).toObject();
            const commission = (<Plaintext>plaintext.find("commission")).toObject();
            const plaintextObject = plaintext.toObject();
            expect(plaintextObject.is_open).equal(isOpen);
            expect(plaintextObject.commission).equal(commission);
        });

        it('should return a plaintext object that matches the text representation', async () => {
            // Get the transactions at block 2758488.
            const transactions = await connection.getTransactionObjects(2758488);
            const transaction = transactions[0];
            const transition = <Transition>transaction.transitions()[0];
            const summary = <TransactionSummary>transactions[0].summary(true);

            // Ensure the transaction metadata was correctly computed.
            expect(transactions.length).equal(8);
            expect(transaction.transactionId()).equal("at1y0afe3p5g09mu55tgu82fqsxsn6upp454lp5txfvp8k9jcneayxqhwuvj9");
            expect(transaction.isExecute()).equal(true);
            expect(transaction.isFee()).equals(false);
            expect(transaction.isDeploy()).equals(false);
            expect(transaction.records().length).equals( 0);
            expect(transaction).equals("transfer_public");

            // Check the transition object contains the correct transition metadata
            expect(transition.functionName()).equals("transfer_public");
            expect(transition.inputs(true).length).equals(2);
            expect(transition.outputs(true).length).equals(1);
            expect(transition.tpk().toString()).equals("5505786677709730139587687856338355349602954343267614082103195360896482413755group");
            expect(transition.tcm()).equals("1455559603629217842263476269813313185104442044684294581757708680601708025726field");

            // Ensure the object summary returns the correct transaction metadata.
            expect(summary.type).equals(transaction.transactionType());
            expect(summary.fee).equals(transaction.feeAmount());
            expect(summary.transitions.length).equals(1);
            expect(summary.id).equals(transaction.transactionId());
            expect(summary.fee).equals(transaction.feeAmount());
            expect(summary.baseFee).equals(transaction.baseFeeAmount());
            expect(summary.priorityFee).equals(transaction.priorityFeeAmount());
        });
    })
});
