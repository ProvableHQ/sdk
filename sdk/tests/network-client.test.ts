import {jest} from '@jest/globals'
import {Account, Block, AleoNetworkClient, TransactionModel} from "../src/node";
import {beaconAddressString, beaconPrivateKeyString} from "./data/account-data";
import {log} from "console";
jest.retryTimes(3);

describe('NetworkClient', () => {
    let connection: AleoNetworkClient;

    beforeEach(() => {
        connection = new AleoNetworkClient("https://api.explorer.aleo.org/v1");
    });

    describe('setAccount', () => {
        it('should set the account property', () => {
            const account = new Account();
            connection.setAccount(account);
            expect(connection.getAccount()).toEqual(account);
        }, 60000);
    });

    describe('getBlock', () => {
        it('should return a Block object', async () => {
            const block = await connection.getBlock(1);
            expect((block as Block).block_hash).toEqual("ab1hap8jlxaz66yt887gxlgxptkm2y0dy72x529mq6pg3ysy9tzwyqsphva9c");
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getBlock(99999999)).rejects.toThrow('Error fetching block.');
        }, 60000);
    });

    describe('getBlockRange', () => {
        it('should return an array of Block objects', async () => {
            const blockRange = await connection.getBlockRange(1, 3);
            expect(Array.isArray(blockRange)).toBe(true);
            expect((blockRange as Block[]).length).toBe(2);
            expect(((blockRange as Block[])[0] as Block).block_hash).toBe("ab1hap8jlxaz66yt887gxlgxptkm2y0dy72x529mq6pg3ysy9tzwyqsphva9c");
            expect(((blockRange as Block[])[1] as Block).block_hash).toBe("ab18dzmjgqgk5z6x4gggezca7aenqts7289chvhus4a7ydrcj4apvrqq5j5h8");

        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getBlockRange(999999999, 1000000000)).rejects.toThrow('Error fetching blocks between 999999999 and 1000000000.');
        }, 60000);
    });

    describe('getDeploymentTransactionForProgram', () => {
        it('should return a Transaction object', async () => {
            const transaction = await connection.getDeploymentTransactionForProgram('hello_hello.aleo');
            expect((transaction as TransactionModel).type).toBe("deploy");
        }, 60000);
    });

    describe('getDeploymentTransactionIDForProgram', () => {
        it('should return a Transaction object', async () => {
            const transaction = await connection.getDeploymentTransactionIDForProgram('hello_hello.aleo');
            expect(typeof transaction).toBe('string');
        }, 60000);
    });

    describe('getProgram', () => {
        it('should return a string', async () => {
            const program = await connection.getProgram('credits.aleo');
            expect(typeof program).toBe('string');
        }, 60000);

        it('should throw an error if the request fails', async () => {
            const program_id = "a" + (Math.random()).toString(32).substring(2) + ".aleo";
            await expect(connection.getProgram(program_id)).rejects.toThrow('Error fetching program');
        }, 60000);
    });

    describe('getLatestBlock', () => {
        it('should return a Block object', async () => {
            const latestBlock = await connection.getLatestBlock();
            expect(typeof (latestBlock as Block).block_hash).toBe('string');
        }, 60000);
    });

    describe('getLatestCommittee', () => {
        it('should return a string', async () => {
            const latestCommittee = await connection.getLatestCommittee();
            expect(typeof latestCommittee).toBe('object');
        }, 60000);
    });

    describe('getLatestHeight', () => {
        it('should return a number', async () => {
            const latestHeight = await connection.getLatestHeight();
            expect(typeof latestHeight).toBe('number');
        }, 60000);
    });

    describe('getStateRoot', () => {
        it('should return a string', async () => {
            const stateRoot = await connection.getStateRoot();
            expect(typeof stateRoot).toBe('string');
        }, 60000);
    });

    describe('getTransaction', () => {
        it('should return a Transaction object', async () => {
            const transaction = await connection.getTransaction('at1u833jaha7gtqk7vx0yczcg2njds2tj52lyg54c7zyylgfjvc4vpqn8gqqx');
            expect((transaction as TransactionModel).type).toBe("deploy");
        }, 60000);
    });

    describe('getTransactions', () => {
        it('should return an array of Transaction objects', async () => {
            const transactions = await connection.getTransactions(1);
            expect(Array.isArray(transactions)).toBe(true);
            expect((transactions as TransactionModel[]).length).toBeGreaterThan(0);
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransactions(999999999)).rejects.toThrow('Error fetching transactions.');
        }, 60000);
    });

    describe('getProgramImports', () => {
        it('should return the correct program import names', async () => {
            const importNames = await connection.getProgramImportNames("aleoswap05.aleo");
            const expectedNames = ["credits.aleo"];
            expect(importNames).toEqual(expectedNames);

            const creditImports = await connection.getProgramImportNames("credits.aleo");
            const expectedCreditImports: string[] = [];
            expect(creditImports).toEqual(expectedCreditImports);
        }, 60000);

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
            expect(imports).toEqual(expectedImports);
        }, 60000);
    });

    describe('findUnspentRecords', () => {
        it('should fail if block heights or private keys are incorrectly specified', async () => {
            await expect(connection.findUnspentRecords(5, 0, beaconPrivateKeyString, undefined, undefined, [])).rejects.toThrow();
            await expect(connection.findUnspentRecords(-5, 5, beaconPrivateKeyString, undefined, undefined, [])).rejects.toThrow();
            await expect(connection.findUnspentRecords(0, 5, "definitelynotaprivatekey", undefined, undefined, [])).rejects.toThrow();
            await expect(connection.findUnspentRecords(0, 5, undefined, undefined, undefined, [])).rejects.toThrow();
        }, 60000);

        it('should search a range correctly and not find records where none exist', async () => {
            const records = await connection.findUnspentRecords(0, 204, beaconPrivateKeyString, undefined, undefined, []);
            expect(Array.isArray(records)).toBe(true);
            if (!(records instanceof Error)) {
                expect(records.length).toBe(0);
            }
        }, 90000);
    });

    describe('Mappings', () => {
        it('should find program mappings and read mappings', async () => {
            const mappings = await connection.getProgramMappingNames("credits.aleo");
            if (!(mappings instanceof Error)) {
                expect(mappings).toEqual(["committee", "bonded", "unbonding", "account"]);
            }
            const mappingValue = await connection.getProgramMappingValue("credits.aleo", "account", "aleo1rlwt9w0fl242h40w454m68vttd6vm4lmetu5r57unm5g354y9yzsyexf0y");
            if (!(mappingValue instanceof Error)) {
                expect(mappingValue).toBeTruthy()
            }
        }, 60000);
    });
});
