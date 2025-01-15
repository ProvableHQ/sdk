import sinon from "sinon";
import { expect } from "chai";
import { Account, BlockJSON, AleoNetworkClient, TransactionObject, InputObject, OutputObject } from "../src/node";
import { beaconPrivateKeyString } from "./data/account-data";
import { DeploymentObject, ExecutionJSON, InputJSON, OutputJSON, Plaintext, PlaintextObject, Transition, TransitionObject } from "../src/node";

async function catchError(f: () => Promise<any>): Promise<Error | null> {
    try {
        await f();
        return null;

    } catch (e) {
        return e as Error;
    }
}


async function expectThrowsMessage(f: () => Promise<any>, message: string): Promise<void> {
    const error = await catchError(f);
    expect(error).not.equal(null);
    expect(error!.message).equal(message);
}
async function expectThrows(f: () => Promise<any>): Promise<void> {
    const error = await catchError(f);
    expect(error).not.equal(null);
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
            await expectThrowsMessage(
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
            await expectThrowsMessage(
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

            await expectThrowsMessage(
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
            await expectThrowsMessage(
                () => connection.findUnspentRecords(5, 0, beaconPrivateKeyString, undefined, undefined, []),
                "Start height must be less than or equal to end height.",
            );

            await expectThrowsMessage(
                () => connection.findUnspentRecords(-5, 5, beaconPrivateKeyString, undefined, undefined, []),
                "Start height must be greater than or equal to 0",
            );

            await expectThrowsMessage(
                () => connection.findUnspentRecords(0, 5, "definitelynotaprivatekey", undefined, undefined, []),
                "Error parsing private key provided.",
            );

            await expectThrowsMessage(
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
        it('Plaintext mapping content should match that of the plaintext object', async () => {
            const transactions = await connection.getTransactions(27400);
            if (transactions.length > 0) {
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

        it('should have correct data within the wasm object and summary object for an execution transaction', async () => {
            // Get the first transaction at block 24700 on testnet.
            const transactions = await connection.getTransactions(27400);
            if (transactions.length > 0) {
                const transaction = await connection.getTransactionObject("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
                const transition = <Transition>transaction.transitions()[0];
                const summary = <TransactionObject>transaction.summary(true);

                // Ensure the transaction metadata was correctly computed.
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
                expect(summary.id).equals(transaction.id());
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

        it('should have correct data within the wasm object and summary object for a deployment transaction', async () => {
            // Get the deployment transaction for token_registry.aleo
            const transactions = await connection.getTransactions(27400);
            if (transactions.length === 0) {
                const transaction = await connection.getTransactionObject("at15mwg0jyhvpjjrfxwrlwzn8puusnmy7r3xzvpjht4e5gzgnp68q9qd0qqec");
                const summary = <TransactionObject>transaction.summary(true);
                const deployment = <DeploymentObject>summary.deployment;

                // Ensure the transaction metadata was correctly computed.
                expect(transaction.id()).equal("at15mwg0jyhvpjjrfxwrlwzn8puusnmy7r3xzvpjht4e5gzgnp68q9qd0qqec");
                expect(transaction.isExecute()).equal(false);
                expect(transaction.isFee()).equals(false);
                expect(transaction.isDeploy()).equals(true);
                expect(transaction.records().length).equals( 0);

                // Ensure the object summary returns the correct general transaction metadata.
                expect(summary.type).equals(transaction.transactionType());
                expect(summary.fee).equals(transaction.feeAmount());
                expect(summary.transitions.length).equals(0);
                expect(summary.id).equals(transaction.id());
                expect(summary.fee).equals(transaction.feeAmount());
                expect(summary.baseFee).equals(transaction.baseFeeAmount());
                expect(summary.priorityFee).equals(transaction.priorityFeeAmount());
                expect(deployment.program).equals("token_registry.aleo");
                expect(deployment.functions.length).equals(22);
            }
        });

        it('Should give the correct JSON response when requesting multiple transactions', async () => {
            const transactions = await connection.getTransactions(27400);
            if (transactions.length > 0) {
                expect(transactions.length).equal(4);
                expect(transactions[0].status).equal("accepted");
                expect(transactions[0].type).equal("execute");
                expect(transactions[0].index).equal(0);
                expect(transactions[0].finalize.length).equal(1);
                expect(transactions[0].transaction.id).equal("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
                expect(transactions[0].transaction.type).equal(true);

                const execution = <ExecutionJSON>transactions[0].transaction.execution;
                expect(execution.transitions.length).equal(1);
                expect(execution.transitions[0].id).equal("au1j529auupdhlc2jcl802fm2uf3khcwm7xt7wxkrl2jv3pvj7zhu8qvna5pp");
                expect(execution.transitions[0].program).equal("puzzle_arcade_coin_v001.aleo");
                expect(execution.transitions[0].function).equal("mint");
                expect((<InputJSON[]>execution.transitions[0].inputs).length).equal(2);

                // Get outputs and ensure they have the correct values.
                const outputs = <OutputJSON[]>execution.transitions[0].outputs
                expect(outputs.length).equal(1);
                expect(outputs[0].type).equal("record");
                expect(outputs[0].id).equal("5572694414900952602617575422938223520445524449912062453787036904987112234218field");
                expect(outputs[0].value).equal("record1qyqsqkh52naqk7l62m9rw3emwm0swuttcs7qs6lqqeu2czc34mv7h2c8qyrxzmt0w4h8ggcqqgqsq5de236vn6h0z3cvecduyzmqmaw0ue8wk4a9a5z89r7qxv53cwgg4xqpmzq9tv35fzyt6xfem9f74qcx9qsj90e6gzajfetc874q6g9snrzkgw");
                expect(<string>outputs[0].checksum).equal("976841447793933847827686780055501802433867163411662643088590532874495495156field");
                expect(transactions[0].transaction.fee.proof).equal("proof1qyqsqqqqqqqqqqqpqqqqqqqqqqq89k9zdaf38ssnk3znaue2xv0uax8dcvydrrssgfxwuvm7w0h7wtcwu4qdkvhc4yxy73m8m4z0hssqq8xn4t5qyj88zvhfausgzez7w0e8fhhdj6gnfgpw20k46ml4thyzjc9xj3rhuzn6qdrsvlm05amd0q96plngd7txlcjykyspyja0qnvljtte2s9v23s3x7rekhc29khqrmrp2hl9pwv8ckyx7z8p4uh64zq8lgkum20sk6klu462ahnnrerqzaaksvtk64wdsj5dwr0wcg8e63pxcfjucch3224xwkxppwtcwsqqkdw07r53e2zt402jekqmlju3c66kmzcaz0lh5ctacluce39rycg8g3x9gs8vgrxnmjzgqu95ntqqqwdhjhpx5ztvk0x35559prjlm3a54wcd6tk9k3m2fs0xkx7pty9v4urlzg6029l9mfp0tsafxq72szzhhaymx0hqztu4pr2gvqfg2nqjpmqv9c8wkrjgsm7mcpnhxdu703xkzc2tz2l4hljlv7jdpdgvyqr4pf80tzp6w0vdtupfhfj2nhmmc9s38g0na5698p8eg0n6vtcdzksfp64rveukf8yq4pk2re2zujqpy0rfr65rd3l4s63hj78nqfft70r463ym8sfan7sa2nypeyy7urkgxwsjv5n5924dc67jtm28upypvpllg4sceam4jfv603s2hgfz4dwgeuswc258uq6teftsxf7xdvrll68rqz7xtpjzl7qkaq028x44g3m52k9csrv8mlfewrklavyg7rcf4qh6htcxe39vcd63790s4s4phmfc940uhhshd7hnxrp6p7dyp73686zpa7hv59k7xrztjmer4h7yrdwd06zgwe97p7as955vafqsrlg26jt675nj4cs7z733y7gr9qtfj42j33clkcup5g3k8ww3pug25vmdqcdmrz07a6azf7h6ugj6wuvs3y5c6gjmxy3ks94ny20fd5gwmahweegq73t4nhytu55nc5xa0jy8qchstu7r23psfjk7day55p4yyejrhh89hlc93zlcnu48tqjul35wn0us20w7rmwe7cwgy2q9quaaxz5n4rueeey4hm9cxlu828h2y29wkwr3p8h6nxfqdu905txsr604gnzurkz7rjnuy44a2a8afgplfgt4wd77tlfg8ec7tacjyqgrqvqqqqqqqqqqpqg7sm3jcaeqajsucveqam4mjajv0hps5lvqe7hhg93psqnjpu8aqpn0x8t92c3fjcke385h2yuvsqq2zvx9t6g9y3qnzza9k4tje8yzxzsmpaaf5un7vc78syypyplm5psr3rs5vp5n6ru4zm5vlukkf2vqqyhl84enh2p3q35t2c5n9ve4fdpa9pcg4pjms7j3alm3ctvv55e3qqmjv7lccnkh00utzhjwv2hglqaqmuh84kz5wug0pmwn0n8ua373ttqjdksd3eq7e4z3f69yvnn0sqqqcnztcq");
                expect(transactions[0].transaction.fee.global_state_root).equal("sr1uwx36xp95j7p2w7yadnj5ups6n8ktf0uwnvq0yauk2fefa2lsqysj4ydym");
                expect(transactions[0].transaction.fee.transition.function).equal("fee_public");
                expect(transactions[0].transaction.fee.transition.program).equal("credits.aleo");

                // Check the fee inputs.
                const feeInputs = <InputJSON[]>transactions[0].transaction.fee.transition.inputs;
                expect(feeInputs.length).equal(3);
                expect(feeInputs[0].type).equal("public");
                expect(feeInputs[0].value).equal("1449u64");
                expect(feeInputs[0].id).equal("4386982425102730230159169800986934827054209772356695389341764668009606015212field");

                // Check the fee outputs.
                const feeOutputs = <OutputJSON[]>transactions[0].transaction.fee.transition.outputs;
                expect(feeOutputs.length).equal(1);
                expect(feeOutputs[0].type).equal("future");
                expect(feeOutputs[0].id).equal("5266202420911953477603237216561767366202408116662663021354607932182034937240field");
                expect(feeOutputs[0].value).equal("{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo193cgzzpr5lcwq6rmzq4l2ctg5f4mznead080mclfgrc0e5k0w5pstfdfps,\n    1449u64\n  ]\n}");
            }
        });
    })
});
