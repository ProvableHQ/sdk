import { Account } from '../src'
import { PrivateKey, ViewKey } from '@aleohq/wasm';

describe('Account', () => {
    describe('constructor', () => {
        test('creates a new account if no parameters are passed', () => {
            const account = new Account();
            expect(account.pk).toBeInstanceOf(PrivateKey);
            expect(account.vk).toBeInstanceOf(ViewKey);
        });

        test('throws an error if parameters are invalid', () => {
            expect(() => new Account({privateKey: 'invalidPrivateKey'})).toThrow();
        });
    });

    describe('decryptRecord', () => {
        test('decrypts a record in ciphertext form', () => {
            const account = new Account();
            const ciphertext = 'testCiphertext';
            account.vk.decrypt = jest.fn().mockReturnValue('testRecord');
            const decryptedRecord = account.decryptRecord(ciphertext);
            expect(account.vk.decrypt).toHaveBeenCalledWith(ciphertext);
            expect(decryptedRecord).toBe('testRecord');
        });
    });

    describe('decryptRecords', () => {
        test('decrypts an array of records in ciphertext form', () => {
            const account = new Account();
            const ciphertexts = ['testCiphertext1', 'testCiphertext2'];
            account.vk.decrypt = jest.fn().mockReturnValue('testRecord');
            const decryptedRecords = account.decryptRecords(ciphertexts);
            expect(account.vk.decrypt).toHaveBeenCalledTimes(2);
            expect(account.vk.decrypt).toHaveBeenCalledWith(ciphertexts[0]);
            expect(account.vk.decrypt).toHaveBeenCalledWith(ciphertexts[1]);
            expect(decryptedRecords).toEqual(['testRecord', 'testRecord']);
        });
    });

    describe('sign', () => {
        test('signs a message with the account private key', () => {
            const account = new Account();
            const message = new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]);
            account.pk.sign = jest.fn().mockReturnValue('testSignature');
            const signature = account.sign(message);
            expect(account.pk.sign).toHaveBeenCalledWith(message);
            expect(signature).toBe('testSignature');
        });
    });
});