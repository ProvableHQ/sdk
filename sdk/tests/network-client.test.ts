import sinon from "sinon";
import { expect } from "chai";
import {
    Account,
    BlockJSON,
    AleoNetworkClient,
    TransactionObject,
    InputObject,
    OutputObject,
    ExecutionObject
} from "../src/node";
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
        it('Plaintext returned from the API should have expected properties', async () => {
            const transactions = await connection.getTransactions(27400);
            if (transactions.length > 0) {
                // Check a struct variant of a plaintext object.
                let plaintext = await connection.getProgramMappingPlaintext("credits.aleo", "committee", "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal");
                expect(plaintext.plaintextType()).equal("struct");

                // Ensure the JS object representation matches the wasm representation.
                const isOpen = <Plaintext>plaintext.find("is_open").toObject();
                const commission = <Plaintext>plaintext.find("commission").toObject();
                const plaintextObject = plaintext.toObject();
                expect(plaintextObject.is_open).equal(isOpen);
                expect(plaintextObject.commission).equal(commission);

                // Check a literal variant of a plaintext object.
                plaintext = await connection.getProgramMappingPlaintext("credits.aleo", "account", "aleo17m3l8a4hmf3wypzkf5lsausfdwq9etzyujd0vmqh35ledn2sgvqqzqkqal");
                expect(plaintext.plaintextType()).equal("u64");
                expect(plaintext.toObject()).a("bigint");
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
                expect(transaction.records().length).equals( 1);

                // Check the transition object contains the correct transition metadata
                expect(transition.programId()).equals("puzzle_arcade_coin_v001.aleo")
                expect(transition.functionName()).equals("mint");
                expect(transition.inputs(true).length).equals(2);
                expect(transition.outputs(true).length).equals(1);
                expect(transition.tpk().toString()).equals("6666707959509237020554863505720154589525217196021270704042929032892063700604group");
                expect(transition.tcm().toString()).equals("5140704971235445395514301730284508935687584564904251867869912904008739082032field");
                expect(transition.scm().toString()).equals("4048085747685910464005835076598544744404883618916202014212851266936759881218field");

                // Ensure the object summary returns the correct transaction metadata.
                const execution = <ExecutionObject>summary.execution;
                expect(summary.type).equals(transaction.transactionType());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(execution.transitions.length).equals(2);
                expect(<string>execution.transitions[0].tpk).equals("6666707959509237020554863505720154589525217196021270704042929032892063700604group");
                expect(<string>execution.transitions[0].tcm).equals("5140704971235445395514301730284508935687584564904251867869912904008739082032field");
                expect(<string>execution.transitions[0].scm).equals("4048085747685910464005835076598544744404883618916202014212851266936759881218field");
                expect(execution.transitions[0].function).equals("mint");
                expect(summary.id).equals(transaction.id());
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(summary.baseFee).equals(transaction.baseFeeAmount());
                expect(summary.priorityFee).equals(transaction.priorityFeeAmount());

                // Check inputs.
                const transition_summary = <TransitionObject>execution.transitions[0];
                const transition_inputs = <InputObject[]>transition_summary.inputs;
                const transition_outputs = <OutputObject[]>transition_summary.outputs;
                // Ensure the transition_summary matches the wasm object.
                expect(transition_summary.tpk).equals(transition.tpk().toString());
                expect(transition_summary.tcm).equals(transition.tcm().toString());
                expect(transition_summary.scm).equals(transition.scm().toString());
                expect(transition_summary.function).equals(transition.functionName());
                expect(transition_summary.id).equals(transition.id());
                expect(transition_summary.program).equals(transition.programId());
                expect(transition_inputs.length).equals(transition.inputs(true).length);
                expect(transition_outputs.length).equals(transition.outputs(true).length);

                // // Check the summary's inputs and outputs match expected values.
                const transition_input_1 = <InputObject>transition_inputs[0];
                const transition_input_2 = <InputObject>transition_inputs[1];
                const transition_output_1 = <OutputObject>transition_outputs[0];
                expect(transition_input_1.type).equals("public");
                expect(transition_input_2.type).equals("public");
                expect(<string>transition_input_1.value).equals("aleo1mltea0uj6865k5qvvf4er424wg8kqgh4ldlkgav7qzrzrw3mmvgq5rj3s8");
                expect(transition_output_1.type).equals("record");
                expect(<string>transition_output_1.id).equals("5572694414900952602617575422938223520445524449912062453787036904987112234218field");
                expect(<string>transition_output_1.checksum).equals("976841447793933847827686780055501802433867163411662643088590532874495495156field");
                expect(<string>transition_output_1.value).equals("record1qyqsqkh52naqk7l62m9rw3emwm0swuttcs7qs6lqqeu2czc34mv7h2c8qyrxzmt0w4h8ggcqqgqsq5de236vn6h0z3cvecduyzmqmaw0ue8wk4a9a5z89r7qxv53cwgg4xqpmzq9tv35fzyt6xfem9f74qcx9qsj90e6gzajfetc874q6g9snrzkgw");
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
                expect(summary.feeAmount).equals(transaction.feeAmount());
                expect(summary.execution).equals(undefined);
                expect(summary.id).equals(transaction.id());
                expect(summary.feeAmount).equals(transaction.feeAmount());
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
                expect(transactions[0].index).equal(BigInt(0));
                expect(transactions[0].finalize.length).equal(1);
                expect(transactions[0].transaction.id).equal("at1fjy6s9md2v4rgcn3j3q4qndtfaa2zvg58a4uha0rujvrn4cumu9qfazxdd");
                expect(transactions[0].transaction.type).equal("execute");

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
                expect(transactions[0].transaction.fee.proof).equal("proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqys4nj07zk5yc2xrzccul4ghsyjd3zh86wpxk2jy7r4fludh27jsjaf4saz40sss0e22ge74xgz5spqxqpe56uw3c6c27p80glmxwegkkkdpxfnd6yww2pwsrtwtl8c0a80dyd7jfw66retckp7uk93qcx5qt7h2xql37xx4umft9aqrlls2xgtuxvvap3j6d7l4gkdwy3dtn5xg32zr7ywndpl3dle54fdnku0kq3c6f0f4lqmrd3dmmdg6tu7cqmx4h3d9lc56duws2y3628fpfw2v4877pf2v4exvlx4h5mrl5zaeqq6rht59wewjnuzsvhwkjrrxl6ur9mr4mxluahrg3zug7vrmg43p6x4fsrgztun49a5qrtmelv64fgpdeyk4m2dp0y3zwet4wmj2cx4euausakj2k4paeql74xn7yv63m5evt9uymx3ygav8ysj58hd3q0sp8a79cvd83s0rmq2gy443mpe2tfdamxzufpz9jts4fhe9sf7mk82fc602wv279mughzztu3t93k3q8glzqaj3ltjx4cnvr3a99ukngxunvzgw6wd77msg396vffn8gtlhe5fepzkum3q9xvqpd4hqymr7qyx0q7vup99443kyvrh0v962gc26p47zghgsh9hfmah46vd9jej9drvwn25sm8mrysew7zwr5r24yqup2jlh9k0pdtswus7mw0gnlzsphpqc4n6ck23932ekrt438ntuxenzzjk8y2qh006ddvztzky6stq8ylyzh2ezcn75pnzsql8aq6ky2kawwllsqay4eymmth2k22nlk2g7l2gyzkgg7vw5gsnavdfp5vq09dzwm30uq7348qwd3eqna6j7zyygexdwgdtrt5pf3ankyl360s2mxmrxsu2zy9ghw99dk7vv7dh9hcfrsy8j8ezygjc72dtzra4vqgpmq7ufpkhurw7mhl70eg674zxfehhaugfn44h70efq3azy00nuqh8ncztrkzq0zut90r4aeyd9f43qw33309zf62selcyq22f7u4cywxgjxac6vs8nmfrcdtthys7jghcct8v3zal00nx3vyjn0qa7lzpjphg653779sqzhhrwjy588mjp9dpvzvpslsd594as2zgumz9l0qy673u6sp4ukfyln6jjdyz5n03xcn7ntdl69uqwdpajg8l4d782sxqvqqqqqqqqqqpwj6l0njz3pyaa6d4k7jf3shynxuamh48qlg02vsl9cdd9cqh050mndm6a77ldye0jtyu882yj4zsqqvfkqadh2gvhlwqmrlfvn79wn0uh006uyes4cptqytgm6w9ufefqzdpz0vr85nl34cjvs849p6efvqqxvrklggzu92te588dtal4n8pr9q2fnl2e46v83z0flcyt398xspzcl4920jaj54umh60ndhh6rqhqudna94uftlhfxk0652lruhxpw2xcncjm5lywt4tzu8et0kg9rwqyqqruc9kg");
                expect(transactions[0].transaction.fee.global_state_root).equal("sr13gjf6m2h2evlyvqdmrg0k69wlnpzruasxeekytx3gj7xf5ht6sxs27ldvh");
                expect(transactions[0].transaction.fee.transition.function).equal("fee_public");
                expect(transactions[0].transaction.fee.transition.program).equal("credits.aleo");

                // Check the fee inputs.
                const feeInputs = <InputJSON[]>transactions[0].transaction.fee.transition.inputs;
                expect(feeInputs.length).equal(3);
                expect(feeInputs[0].type).equal("public");
                // expect(feeInputs[0].value).equal("1449u64");
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
