import sodium from "libsodium-wrappers";
import { expect } from "chai";
import { base64 } from "@scure/base";
import {
    Account,
    encryptAuthorization,
    encryptProvingRequest,
    encryptSerializedProvingRequest,
    encryptViewKey,
    encryptRegistrationRequest,
    serializeProvingRequest,
    zeroizeBytes,
    Authorization,
    ProvingRequest,
} from "../src/node.js";

describe("security", () => {
    before(async () => {
        // Only needed because the tests use libsodium to decrypt and cross-check.
        // The SDK itself no longer depends on libsodium at runtime.
        await sodium.ready;
    });

    describe("sync API contract", () => {
        it("encrypt* return strings synchronously (no Promise)", () => {
            const keyPair = sodium.crypto_box_keypair();
            const pub = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);
            const viewKey = new Account().viewKey();

            const viewKeyCt = encryptViewKey(pub, viewKey);
            expect(viewKeyCt).to.be.a("string");
            expect(viewKeyCt).to.not.be.an.instanceOf(Promise);

            const regCt = encryptRegistrationRequest(pub, viewKey, 0);
            expect(regCt).to.be.a("string");
            expect(regCt).to.not.be.an.instanceOf(Promise);
        });

        it("all encrypt/zeroize exports exist as functions", () => {
            expect(encryptAuthorization).to.be.a("function");
            expect(encryptProvingRequest).to.be.a("function");
            expect(encryptSerializedProvingRequest).to.be.a("function");
            expect(encryptViewKey).to.be.a("function");
            expect(encryptRegistrationRequest).to.be.a("function");
            expect(serializeProvingRequest).to.be.a("function");
            expect(zeroizeBytes).to.be.a("function");
            // Guard against WASM types being tree-shaken away.
            expect(Authorization).to.exist;
            expect(ProvingRequest).to.exist;
        });
    });

    describe("libsodium interop — encrypt with SDK, decrypt with libsodium", () => {
        it("encryptViewKey round-trips through sodium.crypto_box_seal_open", () => {
            const keyPair = sodium.crypto_box_keypair();
            const viewKey = new Account().viewKey();
            const viewKeyBytes = viewKey.toBytesLe();

            const ciphertext = encryptViewKey(
                sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL),
                viewKey,
            );

            const plaintextBytes = sodium.crypto_box_seal_open(
                sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
                keyPair.publicKey,
                keyPair.privateKey,
            );

            expect(plaintextBytes).to.deep.equal(viewKeyBytes);
        });

        it("encryptRegistrationRequest round-trips and embeds start block as LE u32", () => {
            const keyPair = sodium.crypto_box_keypair();
            const viewKey = new Account().viewKey();
            const viewKeyBytes = viewKey.toBytesLe();
            const startBlock = 123456;

            const ciphertext = encryptRegistrationRequest(
                sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL),
                viewKey,
                startBlock,
            );

            const plaintextBytes = sodium.crypto_box_seal_open(
                sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
                keyPair.publicKey,
                keyPair.privateKey,
            );

            expect(plaintextBytes.length).to.equal(viewKeyBytes.length + 4);
            expect(plaintextBytes.slice(0, viewKeyBytes.length)).to.deep.equal(viewKeyBytes);
            const view = new DataView(plaintextBytes.buffer, plaintextBytes.byteOffset, plaintextBytes.byteLength);
            expect(view.getUint32(viewKeyBytes.length, true)).to.equal(startBlock);
        });

        it("ciphertext output has the crypto_box_seal wire shape: epk(32) || body", () => {
            const keyPair = sodium.crypto_box_keypair();
            const viewKey = new Account().viewKey();
            const viewKeyBytes = viewKey.toBytesLe();

            const ciphertext = encryptViewKey(
                sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL),
                viewKey,
            );
            const raw = base64.decode(ciphertext);

            // 32-byte ephemeral public key prefix + 16-byte Poly1305 tag + payload
            expect(raw.length).to.equal(32 + 16 + viewKeyBytes.length);
        });

        it("encryptSerializedProvingRequest round-trips through sodium.crypto_box_seal_open", () => {
            const keyPair = sodium.crypto_box_keypair();
            const pub = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);
            // Arbitrary request bytes — the function is agnostic to the payload.
            const requestBytes = new Account().viewKey().toBytesLe();

            const ciphertext = encryptSerializedProvingRequest(pub, base64.encode(requestBytes));

            const plaintextBytes = sodium.crypto_box_seal_open(
                sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
                keyPair.publicKey,
                keyPair.privateKey,
            );
            expect(plaintextBytes).to.deep.equal(requestBytes);
        });

        it("the serialized path is byte-compatible with the typed encrypt* wrappers", () => {
            const keyPair = sodium.crypto_box_keypair();
            const pub = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);
            const viewKey = new Account().viewKey();
            const expected = viewKey.toBytesLe();

            // encryptViewKey(pk, vk) and encryptSerializedProvingRequest(pk,
            // base64(vk.toBytesLe())) feed the same bytes into the same sealed
            // box, so both ciphertexts must decrypt to identical plaintext.
            const typed = encryptViewKey(pub, viewKey);
            const serialized = encryptSerializedProvingRequest(pub, base64.encode(expected));

            for (const ciphertext of [typed, serialized]) {
                const plaintextBytes = sodium.crypto_box_seal_open(
                    sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
                    keyPair.publicKey,
                    keyPair.privateKey,
                );
                expect(plaintextBytes).to.deep.equal(expected);
            }
        });

        it("fuzz: 50 random messages all decrypt back to the original", () => {
            const keyPair = sodium.crypto_box_keypair();
            const pub = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);

            for (let i = 0; i < 50; i++) {
                const viewKey = new Account().viewKey();
                const expected = viewKey.toBytesLe();
                const ciphertext = encryptViewKey(pub, viewKey);
                const decrypted = sodium.crypto_box_seal_open(
                    sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
                    keyPair.publicKey,
                    keyPair.privateKey,
                );
                expect(decrypted).to.deep.equal(expected);
            }
        });

        it("each call produces a distinct ciphertext (fresh ephemeral key)", () => {
            const keyPair = sodium.crypto_box_keypair();
            const pub = sodium.to_base64(keyPair.publicKey, sodium.base64_variants.ORIGINAL);
            const viewKey = new Account().viewKey();

            const ciphertexts = new Set<string>();
            for (let i = 0; i < 10; i++) {
                ciphertexts.add(encryptViewKey(pub, viewKey));
            }
            expect(ciphertexts.size).to.equal(10);
        });
    });

    describe("zeroizeBytes", () => {
        it("is synchronous and overwrites every byte with zero", () => {
            const bytes = new Uint8Array([1, 2, 3, 4, 5]);
            const result = zeroizeBytes(bytes);
            expect(result).to.equal(undefined);
            expect(bytes).to.deep.equal(new Uint8Array([0, 0, 0, 0, 0]));
        });
    });
});
