import {jest} from '@jest/globals'
import {Account, Block, AleoNetworkClient, Transaction} from "../src/node";
import {beaconAddressString, beaconPrivateKeyString} from "./data/account-data";
import {log} from "console";
jest.retryTimes(3);

describe('NodeConnection', () => {
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
            expect((block as Block).block_hash).toEqual("ab1n79nyqnxa76wpz40efqlq53artsw86wrez4tw9kn5xrpuc65xyxquh3wnw");
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
            expect(((blockRange as Block[])[0] as Block).block_hash).toBe("ab1n79nyqnxa76wpz40efqlq53artsw86wrez4tw9kn5xrpuc65xyxquh3wnw");
            expect(((blockRange as Block[])[1] as Block).block_hash).toBe("ab1ywy38xs5c73s2q9v3mgyes5cup5wwtg8r2mlad0534zdmltadcrq9dpuw6");

        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getBlockRange(999999999, 1000000000)).rejects.toThrow('Error fetching blocks between 999999999 and 1000000000.');
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

    describe('getLatestHash', () => {
        it('should return a string', async () => {
            const latestHash = await connection.getLatestHash();
            expect(typeof latestHash).toBe('string');
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
            const transaction = await connection.getTransaction('at1ps9rynpue84asfhswp305fzytdy3a99w3yrml2zgg84d7p32wuxq4mq9cc');
            expect((transaction as Transaction).type).toBe("execute");
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransaction('nonexistentid')).rejects.toThrow('Error fetching transaction.');
        }, 60000);
    });

    describe('getTransactions', () => {
        it('should return an array of Transaction objects', async () => {
            const transactions = await connection.getTransactions(1);
            expect(Array.isArray(transactions)).toBe(true);
            expect((transactions as Transaction[]).length).toBeGreaterThan(0);
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransactions(999999999)).rejects.toThrow('Error fetching transactions.');
        }, 60000);
    });

    describe('getTransitionId', () => {
        it('should return a transition id', async () => {
            const transition = await connection.getTransitionId('5933570015305968530125784572086807293992783852506506765106247734494477879199field')
            expect(typeof transition).toBe('string');
        }, 60000);

        it('should throw an error if the request fails', async () => {
            await expect(connection.getTransitionId("garbage")).rejects.toThrow("Error fetching transition ID.");
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

    describe('getProgramImports', () => {
        it('should return the correct program import names', async () => {
            const importNames = await connection.getProgramImportNames("disperse_multiple_transactions.aleo");
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
