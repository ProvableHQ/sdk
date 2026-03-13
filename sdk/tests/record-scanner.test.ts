import { Account } from "../src/account";
import {
    CHECK_SNS_RESPONSE,
    CHECK_TAGS_RESPONSE,
    ENCRYPTED_RECORDS,
    OWNED_RECORDS,
} from "./data/records";
import { expect } from "chai";
import sodium from "libsodium-wrappers";
import {
    DecryptionNotEnabledError,
    RecordNotFoundError,
    RecordScannerRequestError,
    UUIDError,
    ViewKeyNotStoredError,
} from "../src/models/record-scanner/error";
import { OwnedFilter } from "../src/models/record-scanner/ownedFilter";
import { OwnedRecordsResponseFilter } from "../src/models/record-scanner/ownedRecordsResponseFilter";
import { RecordScanner } from "../src/record-scanner";
import { RecordsFilter } from "../src/models/record-scanner/recordsFilter";
import { RecordsResponseFilter } from "../src/models/record-scanner/recordsResponseFilter";
import { ViewKey } from "../src/node";
import { encryptRegistrationRequest } from "../src/security";
import sinon from "sinon";

const sandboxUrl = process.env.RECORD_SCANNER_URL ?? "";
const viewKeyStr = process.env.PUZZLE_VK as string;
const apiKey = process.env.KONG_API_KEY as string;
const consumerId = process.env.CONSUMER_ID as string | undefined;

describe("RecordScanner", () => {
    const defaultAccount = new Account({
        privateKey:
            "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    });
    let recordScanner: RecordScanner;
    let fetchStub: sinon.SinonStub;
    const baseUrl = "https://record-scanner.aleo.org";
    const network = "/%%NETWORK%%";

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, "fetch");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should intialize with the correct url", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        expect(recordScanner.url).to.equal(baseUrl + network);
    });

    const validTestUuid =
        "7884164224800444110633570141944665301008802280502652120359195870264061098703field";

    it("should intialize with the correct api key as a string", async () => {
        recordScanner = new RecordScanner({
            url: baseUrl,
            apiKey: "1234567890",
        });

        const mockResponse = {
            ok: true,
            status: 201,
            text: () =>
                Promise.resolve(JSON.stringify({ uuid: validTestUuid })),
            json: () => Promise.resolve({ uuid: validTestUuid }),
        };
        const revokeResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve('{"status": "OK"}'),
            json: () => Promise.resolve({ status: "OK" }),
        };
        fetchStub.onCall(0).resolves(mockResponse);
        fetchStub.onCall(1).resolves(revokeResponse);
        await recordScanner.register(defaultAccount.viewKey(), 0);

        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.headers.get("X-Provable-API-Key")).to.equal(
            "1234567890",
        );

        const revokeResult = await recordScanner.revoke(validTestUuid);
        expect(revokeResult.ok).to.equal(true);
        expect(fetchStub.callCount).to.equal(2);
        const revokeRequest = fetchStub.secondCall.args[0] as Request;
        expect(revokeRequest.url).to.equal(recordScanner.url + "/revoke");
        expect(revokeRequest.method).to.equal("POST");
    });

    it("should intialize with the correct api key as an object", async () => {
        recordScanner = new RecordScanner({
            url: baseUrl,
            apiKey: { header: "Some-API-Key", value: "1234567890" },
        });

        const mockResponse = {
            ok: true,
            status: 201,
            text: () =>
                Promise.resolve(JSON.stringify({ uuid: validTestUuid })),
            json: () => Promise.resolve({ uuid: validTestUuid }),
        };
        const revokeResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve('{"status": "OK"}'),
            json: () => Promise.resolve({ status: "OK" }),
        };
        fetchStub.onCall(0).resolves(mockResponse);
        fetchStub.onCall(1).resolves(revokeResponse);
        await recordScanner.register(defaultAccount.viewKey(), 0);

        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.headers.get("Some-API-Key")).to.equal("1234567890");

        const revokeResult = await recordScanner.revoke(validTestUuid);
        expect(revokeResult.ok).to.equal(true);
    });

    it("should return RegisterResult with data after successfully registering the account", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });

        const mockResponse = {
            ok: true,
            status: 201,
            text: () =>
                Promise.resolve(JSON.stringify({ uuid: validTestUuid })),
            json: () => Promise.resolve({ uuid: validTestUuid }),
        };
        const revokeResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve('{"status": "OK"}'),
            json: () => Promise.resolve({ status: "OK" }),
        };
        fetchStub.onCall(0).resolves(mockResponse);
        fetchStub.onCall(1).resolves(revokeResponse);
        const result = await recordScanner.register(
            defaultAccount.viewKey(),
            0,
        );

        expect(fetchStub.called).to.be.true;
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.url).to.equal(recordScanner.url + "/register");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );

        const body = await request.text();
        const expectedBody = JSON.stringify({
            view_key: defaultAccount.viewKey().to_string(),
            start: 0,
        });
        expect(body).to.equal(expectedBody);

        expect(result.ok).to.equal(true);
        if (result.ok) expect(result.data.uuid).equal(validTestUuid);

        const revokeResult = await recordScanner.revoke(
            result.ok ? result.data.uuid : undefined,
        );
        expect(revokeResult.ok).to.equal(true);
        const revokeRequest = fetchStub.secondCall.args[0] as Request;
        expect(revokeRequest.url).to.equal(recordScanner.url + "/revoke");
        expect(revokeRequest.method).to.equal("POST");
    });

    it("should return the optional fields of RegistrationResponse if present after successfully registering the account", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });

        const mockResponse = {
            ok: true,
            status: 201,
            text: () =>
                Promise.resolve(
                    JSON.stringify({ uuid: validTestUuid, status: "pending" }),
                ),
            json: () =>
                Promise.resolve({ uuid: validTestUuid, status: "pending" }),
        };
        const revokeResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve('{"status": "OK"}'),
            json: () => Promise.resolve({ status: "OK" }),
        };
        fetchStub.onCall(0).resolves(mockResponse);
        fetchStub.onCall(1).resolves(revokeResponse);
        const result = await recordScanner.register(
            defaultAccount.viewKey(),
            0,
        );

        expect(fetchStub.called).to.be.true;
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.url).to.equal(recordScanner.url + "/register");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );

        const body = await request.text();
        const expectedBody = JSON.stringify({
            view_key: defaultAccount.viewKey().to_string(),
            start: 0,
        });
        expect(body).to.equal(expectedBody);

        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.data.uuid).equal(validTestUuid);
            expect(result.data.status).equal("pending");
        }

        if (result.ok) {
            const revokeResult = await recordScanner.revoke(result.data.uuid);
            expect(revokeResult.ok).to.equal(true);
        }
    });

    it("should return RevokeResult with data after successfully revoking", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        const revokeResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve('{"status": "OK"}'),
            json: () => Promise.resolve({ status: "OK" }),
        };
        fetchStub.resolves(revokeResponse);
        const result = await recordScanner.revoke(validTestUuid);
        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.data.status).to.equal("OK");
        }
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.url).to.equal(recordScanner.url + "/revoke");
        expect(request.method).to.equal("POST");
        expect(await request.text()).to.equal(JSON.stringify(validTestUuid));
    });

    it("revoke throws UUIDError when no UUID configured and none provided", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        let thrown: UUIDError | undefined;
        try {
            await recordScanner.revoke();
        } catch (err) {
            thrown = err as UUIDError;
        }
        expect(thrown).to.be.instanceOf(UUIDError);
        expect(thrown!.name).to.equal("UUIDError");
        expect(thrown!.message).to.include("No UUID configured");
        expect(fetchStub.called).to.be.false;
    });

    it("revoke throws UUIDError for invalid UUID string", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        let thrown: UUIDError | undefined;
        try {
            await recordScanner.revoke("not-a-valid-field");
        } catch (err) {
            thrown = err as UUIDError;
        }
        expect(thrown).to.be.instanceOf(UUIDError);
        expect(thrown!.name).to.equal("UUIDError");
        expect(thrown!.message).to.include("invalid");
        expect(thrown!.uuid).to.equal("not-a-valid-field");
        expect(fetchStub.called).to.be.false;
    });

    it("should return EncryptedRecord[] after successfully getting encrypted records", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(ENCRYPTED_RECORDS)),
            json: () => Promise.resolve(ENCRYPTED_RECORDS),
        };

        fetchStub.resolves(mockResponse);
        const responseFilter: RecordsResponseFilter = {
            commitment: true,
            checksum: true,
            block_height: true,
            program_name: true,
            function_name: true,
            output_index: true,
            owner: true,
            record_ciphertext: true,
            record_name: true,
            nonce: true,
            transition_id: true,
            transaction_id: true,
            transaction_index: true,
            transition_index: true,
        };
        const filter: RecordsFilter = {
            start: 10002000,
            end: 10003000,
            programs: ["credits.aleo", "token_registry.aleo"],
            response: responseFilter,
        };
        const encryptedRecords = await recordScanner.encryptedRecords(filter);
        expect(encryptedRecords).to.equal(ENCRYPTED_RECORDS);

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify(filter);
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/records/encrypted");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should return OwnedRecord[] after successfully getting owned records", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        recordScanner.setUuid(defaultAccount.viewKey());

        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(OWNED_RECORDS)),
            json: () => Promise.resolve(OWNED_RECORDS),
        };
        fetchStub.resolves(mockResponse);

        const responseFilter: OwnedRecordsResponseFilter = {
            block_height: true,
            commitment: true,
            function_name: true,
            output_index: true,
            owner: true,
            program_name: true,
            record_ciphertext: true,
            record_name: true,
            spent: true,
            tag: true,
            transaction_id: true,
            transition_id: true,
            transaction_index: true,
            transition_index: true,
        };
        const filter: OwnedFilter = {
            uuid: "test-uuid",
            decrypt: true,
            filter: {
                spent: false,
                response: responseFilter,
            },
        };
        const ownedRecords = await recordScanner.findRecords(filter);
        expect(ownedRecords).to.equal(OWNED_RECORDS);

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify(filter);
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/records/owned");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should return OwnedRecord after successfully getting owned record", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        recordScanner.setUuid(defaultAccount.viewKey());

        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(OWNED_RECORDS)),
            json: () => Promise.resolve(OWNED_RECORDS),
        };
        fetchStub.resolves(mockResponse);
        const ownedRecord = await recordScanner.findRecord({
            uuid: "test-uuid",
        });
        expect(ownedRecord).to.deep.equal(OWNED_RECORDS[0]);

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify({
            uuid: "7884164224800444110633570141944665301008802280502652120359195870264061098703field",
        });
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/records/owned");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should throw UUIDError if the uuid is not set on scanner and filter uuid is invalid", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        let thrown: UUIDError | undefined;
        try {
            await recordScanner.findRecords({
                uuid: "test-uuid",
                filter: {
                    spent: false,
                    response: {
                        block_height: true,
                        commitment: true,
                        function_name: true,
                        output_index: true,
                        owner: true,
                    },
                },
                decrypt: true,
            });
        } catch (err) {
            thrown = err as UUIDError;
        }
        expect(thrown).to.be.instanceOf(UUIDError);
        expect(thrown!.name).to.equal("UUIDError");
        expect(thrown!.message).to.include("UUID");
    });

    it("should return record of string->boolean after successfully checking serial numbers", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(CHECK_SNS_RESPONSE)),
            json: () => Promise.resolve(CHECK_SNS_RESPONSE),
        };
        fetchStub.resolves(mockResponse);
        const sns = await recordScanner.checkSerialNumbers([
            "1621694306596217216370326054181178914897851479837084979111511176605457690717field",
            "5684626152578699086223993752521225507576791345254401210560771329591763880242field",
        ]);
        expect(sns).to.deep.equal(CHECK_SNS_RESPONSE);

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify([
            "1621694306596217216370326054181178914897851479837084979111511176605457690717field",
            "5684626152578699086223993752521225507576791345254401210560771329591763880242field",
        ]);
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/records/sns");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should return record of string->boolean after successfully checking tags", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify(CHECK_TAGS_RESPONSE)),
            json: () => Promise.resolve(CHECK_TAGS_RESPONSE),
        };
        fetchStub.resolves(mockResponse);
        const tags = await recordScanner.checkTags([
            "2965517500209150226508265073635793457193572667031485750956287906078711930968field",
            "8421937347379608036510120951995833971195343843566214313082589116311107280540field",
            "5941252181432651644402279701137165256963073258332916685063623109173576520831field",
        ]);
        expect(tags).to.deep.equal(CHECK_TAGS_RESPONSE);

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify([
            "2965517500209150226508265073635793457193572667031485750956287906078711930968field",
            "8421937347379608036510120951995833971195343843566214313082589116311107280540field",
            "5941252181432651644402279701137165256963073258332916685063623109173576520831field",
        ]);
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/records/tags");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should return StatusResponse after successfully checking status", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        const mockResponse = {
            ok: true,
            status: 200,
            text: () =>
                Promise.resolve(
                    JSON.stringify({ synced: true, percentage: 100 }),
                ),
            json: () => Promise.resolve({ synced: true, percentage: 100 }),
        };
        recordScanner.setUuid(defaultAccount.viewKey());
        fetchStub.resolves(mockResponse);
        const statusResponse = await recordScanner.status();
        expect(statusResponse.ok).to.equal(true);
        if (statusResponse.ok) {
            expect(statusResponse.data).to.deep.equal({
                synced: true,
                percentage: 100,
            });
        }

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify(
            recordScanner.computeUUID(defaultAccount.viewKey()).toString(),
        );
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal(recordScanner.url + "/status");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal(
            "application/json",
        );
    });

    it("should handle HTTP errors", async () => {
        recordScanner = new RecordScanner({ url: baseUrl });
        let mockResponse = {
            ok: false,
            status: 500,
            text: () => Promise.resolve('{"error": "Internal server error"}'),
        };

        fetchStub.resolves(mockResponse);
        let result = await recordScanner.register(defaultAccount.viewKey(), 0);
        expect(result.ok).to.equal(false);
        if (!result.ok) {
            expect(result.status).to.equal(500);
            expect(result.error.message).to.equal(
                '{"error": "Internal server error"}',
            );
        }

        mockResponse = {
            ok: false,
            status: 422,
            text: () => Promise.resolve('{"error": "Invalid view key"}'),
        };

        fetchStub.resolves(mockResponse);
        result = await recordScanner.register(defaultAccount.viewKey(), 0);
        expect(result.ok).to.equal(false);
        if (!result.ok) {
            expect(result.status).to.equal(422);
            expect(result.error.message).to.equal(
                '{"error": "Invalid view key"}',
            );
        }

        fetchStub.rejects(new Error("Unknown error"));
        let failed = false;
        try {
            await recordScanner.register(defaultAccount.viewKey(), 0);
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("Unknown error");
            failed = true;
        }
        expect(failed).to.be.true;
    });

    describe("registerEncrypted error handling", () => {
        it("registerEncrypted returns ok: false with status 422 when server returns 422", async () => {
            await sodium.ready;
            const keyPair = sodium.crypto_box_keypair();
            const pubKeyB64 = sodium.to_base64(
                keyPair.publicKey,
                sodium.base64_variants.ORIGINAL,
            );
            recordScanner = new RecordScanner({ url: baseUrl });
            fetchStub.onCall(0).resolves({
                ok: true,
                text: () =>
                    Promise.resolve(
                        JSON.stringify({
                            key_id: "test-key-id",
                            public_key: pubKeyB64,
                        }),
                    ),
            });
            fetchStub.onCall(1).resolves({
                ok: false,
                status: 422,
                text: () =>
                    Promise.resolve(
                        "Something went wrong: Encrypted registration failed",
                    ),
            });
            const viewKey = defaultAccount.viewKey();
            const result = await recordScanner.registerEncrypted(viewKey, 0);
            expect(result.ok).to.equal(false);
            if (!result.ok) {
                expect(result.status).to.equal(422);
                expect(result.error.message).to.include(
                    "Encrypted registration failed",
                );
            }
        });

        it("registerEncrypted returns ok: false with status 500 when server returns 500", async () => {
            await sodium.ready;
            const keyPair = sodium.crypto_box_keypair();
            const pubKeyB64 = sodium.to_base64(
                keyPair.publicKey,
                sodium.base64_variants.ORIGINAL,
            );
            recordScanner = new RecordScanner({ url: baseUrl });
            fetchStub.onCall(0).resolves({
                ok: true,
                text: () =>
                    Promise.resolve(
                        JSON.stringify({
                            key_id: "test-key-id",
                            public_key: pubKeyB64,
                        }),
                    ),
            });
            fetchStub.onCall(1).resolves({
                ok: false,
                status: 500,
                text: () =>
                    Promise.resolve(
                        "Something went wrong: Unable to register view key.",
                    ),
            });
            const viewKey = defaultAccount.viewKey();
            const result = await recordScanner.registerEncrypted(viewKey, 0);
            expect(result.ok).to.equal(false);
            if (!result.ok) {
                expect(result.status).to.equal(500);
                expect(result.error.message).to.include(
                    "Unable to register view key",
                );
            }
        });
    });

    describe("JWT refresh URL", () => {
        const jwtEdgeCases = [
            {
                label: "standard scanner URL",
                url: "https://record-scanner.aleo.org",
                expectedOrigin: "https://record-scanner.aleo.org",
            },
            {
                label: "Provable API with /scanner path",
                url: "https://api.provable.com/scanner",
                expectedOrigin: "https://api.provable.com",
            },
            {
                label: "URL with deep path",
                url: "https://api.example.com/v2/extra",
                expectedOrigin: "https://api.example.com",
            },
            {
                label: "URL with port",
                url: "https://custom-api.example.com:8080/scanner",
                expectedOrigin: "https://custom-api.example.com:8080",
            },
            {
                label: "URL with trailing slash",
                url: "https://api.provable.com/scanner/",
                expectedOrigin: "https://api.provable.com",
            },
            {
                label: "localhost with port",
                url: "http://localhost:3030",
                expectedOrigin: "http://localhost:3030",
            },
        ];

        jwtEdgeCases.forEach(({ label, url, expectedOrigin }) => {
            it(`should derive JWT refresh origin from ${label}`, async () => {
                recordScanner = new RecordScanner({
                    url,
                    apiKey: "test-api-key",
                    consumerId: "test-consumer-id",
                });

                fetchStub.resolves({
                    ok: true,
                    status: 200,
                    headers: new Headers({
                        authorization: "Bearer test-jwt-token",
                    }),
                    json: () =>
                        Promise.resolve({
                            exp: Math.floor(Date.now() / 1000) + 3600,
                        }),
                    text: () =>
                        Promise.resolve(
                            JSON.stringify({
                                exp: Math.floor(Date.now() / 1000) + 3600,
                            }),
                        ),
                });

                try {
                    await recordScanner.status(
                        "7884164224800444110633570141944665301008802280502652120359195870264061098703field",
                    );
                } catch {}

                const firstCallUrl =
                    fetchStub.firstCall.args[0]?.toString() ??
                    fetchStub.firstCall.args[0]?.url;
                expect(firstCallUrl).to.equal(
                    `${expectedOrigin}/jwts/test-consumer-id`,
                );
            });
        });
    });
});

describe("Record scanner encrypted registration", function () {
    it("should fetch ephemeral public key from /pubkey", async function () {
        this.retries(3);
        const recordScanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const pubkey = await recordScanner.getPubkey();
        expect(pubkey).to.have.property("key_id");
        expect(pubkey).to.have.property("public_key");
        expect(pubkey.key_id).to.be.a("string");
        expect(pubkey.public_key).to.be.a("string");
    });

    it("should execute encrypted registration (/register/encrypted)", async function () {
        const startBlock = 0;

        // Ensure encryption roundtrip works locally (same pattern as program-manager encrypted proving test).
        await sodium.ready;
        const keyPair = sodium.crypto_box_keypair();
        const viewKey = new Account().viewKey();
        const ciphertext = encryptRegistrationRequest(
            sodium.to_base64(
                keyPair.publicKey,
                sodium.base64_variants.ORIGINAL,
            ),
            viewKey,
            startBlock,
        );
        const plaintextBytes = sodium.crypto_box_seal_open(
            sodium.from_base64(ciphertext, sodium.base64_variants.ORIGINAL),
            keyPair.publicKey,
            keyPair.privateKey,
        );
        const vkBytes = viewKey.toBytesLe();
        expect(plaintextBytes.length).to.equal(vkBytes.length + 4);
        const decodedStart = new DataView(plaintextBytes.buffer).getUint32(
            plaintextBytes.length - 4,
            true,
        );
        expect(decodedStart).to.equal(startBlock);

        // Register via encrypted flow against sandbox.
        const recordScanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const result = await recordScanner.registerEncrypted(
            viewKey,
            startBlock,
        );
        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.data).to.have.property("uuid");
            expect(result.data.uuid).to.equal(
                recordScanner.computeUUID(viewKey).toString(),
            );
            await new Promise((r) => setTimeout(r, 5000));
            const revokeResult = await recordScanner.revoke(result.data.uuid);
            expect(revokeResult.ok).to.equal(true);
        }
    });

    it("should execute unencrypted registration (/register)", async function () {
        const startBlock = 0;

        const viewKey = new Account().viewKey();

        // Register via encrypted flow against sandbox.
        const recordScanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const result = await recordScanner.register(viewKey, startBlock);
        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.data).to.have.property("uuid");
            expect(result.data.uuid).to.equal(
                recordScanner.computeUUID(viewKey).toString(),
            );
            await new Promise((r) => setTimeout(r, 5000));
            const revokeResult = await recordScanner.revoke(result.data.uuid);
            expect(revokeResult.ok).to.equal(true);
        }
    });
});

const hasRealApiEnv = Boolean(sandboxUrl && viewKeyStr);

describe("RecordScanner (real API)", function () {
    this.timeout(30000);

    const viewKey = viewKeyStr ? ViewKey.from_string(viewKeyStr) : null;
    const accountFromEnv = process.env.PUZZLE_PK
        ? new Account({ privateKey: process.env.PUZZLE_PK as string })
        : null;

    // Ensure the view key is registered before running tests that depend on it.
    // This is needed because the test account may not be pre-registered on every network.
    let registeredUuid: string | null = null;
    before(async function () {
        if (!hasRealApiEnv || !viewKey) return;
        const scanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const result = await scanner.register(viewKey, 0);
        if (result.ok) {
            registeredUuid = result.data.uuid;
        }
    });

    after(async function () {
        if (!registeredUuid) return;
        const scanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        await scanner.revoke(registeredUuid);
    });

    describe("utility methods", function () {
        it("computeUUID returns the same value for the same view key", function () {
            if (!viewKey) this.skip();
            const scanner = new RecordScanner({ url: sandboxUrl });
            const a = scanner.computeUUID(viewKey).toString();
            const b = scanner.computeUUID(viewKey).toString();
            expect(a).to.equal(b);
        });

        it("uuidIsValid accepts a valid field string and rejects invalid", function () {
            if (!viewKey) this.skip();
            const scanner = new RecordScanner({ url: sandboxUrl });
            const validUuid = scanner.computeUUID(viewKey).toString();
            expect(scanner.uuidIsValid(validUuid)).to.equal(true);
            expect(scanner.uuidIsValid("not-a-valid-uuid")).to.equal(false);
        });

        it("when Account is set, view key is stored and owned/findRecords can use it", async function () {
            if (!hasRealApiEnv || !accountFromEnv) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                account: accountFromEnv,
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const uuid = scanner
                .computeUUID(accountFromEnv.viewKey())
                .toString();
            const result = await scanner.owned({
                uuid,
                unspent: true,
                filter: { program: "credits.aleo", records: ["credits"] },
                responseFilter: { record_ciphertext: true },
            });
            console.log(result);
            expect(result.ok).to.equal(true);
            if (result.ok) {
                expect(result.data).to.be.an("array");
                if (
                    result.data.length > 0 &&
                    result.data[0].record_ciphertext
                ) {
                    expect(result.data[0].record_plaintext).to.be.a("string");
                }
            }
        });
    });

    describe("UUID only, no view keys or account", function () {
        it("findCreditsRecord throws DecryptionNotEnabledError when decryptEnabled is false", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const uuid = scanner.computeUUID(viewKey).toString();
            try {
                await scanner.findCreditsRecord(1, { uuid, unspent: true });
                expect.fail("should have thrown DecryptionNotEnabledError");
            } catch (err) {
                expect(err).to.be.instanceOf(DecryptionNotEnabledError);
            }
        });

        it("findCreditsRecord throws ViewKeyNotStoredError when decryptEnabled is true but no view key stored", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const uuid = scanner.computeUUID(viewKey).toString();
            try {
                await scanner.findCreditsRecord(1, { uuid, unspent: true });
                expect.fail("should have thrown ViewKeyNotStoredError");
            } catch (err) {
                expect(err).to.be.instanceOf(ViewKeyNotStoredError);
            }
        });

        it("findCreditsRecords throws DecryptionNotEnabledError when decryptEnabled is false", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const uuid = scanner.computeUUID(viewKey).toString();
            try {
                await scanner.findCreditsRecords([1], { uuid, unspent: true });
                expect.fail("should have thrown DecryptionNotEnabledError");
            } catch (err) {
                expect(err).to.be.instanceOf(DecryptionNotEnabledError);
            }
        });

        it("findCreditsRecords throws ViewKeyNotStoredError when decryptEnabled is true but no view key stored", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const uuid = scanner.computeUUID(viewKey).toString();
            try {
                await scanner.findCreditsRecords([1], { uuid, unspent: true });
                expect.fail("should have thrown ViewKeyNotStoredError");
            } catch (err) {
                expect(err).to.be.instanceOf(ViewKeyNotStoredError);
            }
        });

        it("owned returns records without record_plaintext when only UUID set and decryptEnabled false", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const uuid = scanner.computeUUID(viewKey).toString();
            const result = await scanner.owned({
                uuid,
                unspent: true,
                filter: { program: "credits.aleo", records: ["credits"] },
                responseFilter: { record_ciphertext: true },
            });
            expect(result.ok).to.equal(true);
            if (result.ok && result.data.length > 0) {
                const first = result.data[0];
                if (first.record_ciphertext) {
                    expect(first.record_plaintext).to.satisfy(
                        (v: unknown) =>
                            v === undefined ||
                            v === "" ||
                            (typeof v === "string" && v.trim() === ""),
                    );
                }
            }
        });
    });

    describe("view key or account set", function () {
        it("owned with decryptEnabled and addViewKey returns records with record_plaintext", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                viewKeys: [viewKey],
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const uuid = scanner.computeUUID(viewKey).toString();
            const result = await scanner.owned({
                uuid,
                unspent: true,
                filter: { program: "credits.aleo", records: ["credits"] },
                responseFilter: { record_ciphertext: true },
            });
            expect(result.ok).to.equal(true);
            if (result.ok && result.data.length > 0) {
                const withCipher = result.data.find((r) =>
                    r.record_ciphertext?.trim(),
                );
                if (withCipher) {
                    expect(withCipher.record_plaintext).to.be.a("string");
                    expect(
                        withCipher.record_plaintext!.trim().length,
                    ).to.be.greaterThan(0);
                }
            }
        });

        it("findCreditsRecord returns a record when view key and decryptEnabled are set", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                viewKeys: [viewKey],
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const uuid = scanner.computeUUID(viewKey).toString();
            try {
                const record = await scanner.findCreditsRecord(1, {
                    uuid,
                    unspent: true,
                });
                expect(record).to.have.property("record_plaintext");
                expect(record.record_plaintext).to.be.a("string");
            } catch (err) {
                if (err instanceof RecordNotFoundError) {
                    this.skip();
                }
                throw err;
            }
        });

        it("findCreditsRecords returns records when view key and decryptEnabled are set", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                viewKeys: [viewKey],
                decryptEnabled: true,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const uuid = scanner.computeUUID(viewKey).toString();
            const records = await scanner.findCreditsRecords([1, 100], {
                uuid,
                unspent: true,
            });
            expect(records).to.be.an("array");
            for (const record of records) {
                expect(record).to.have.property("record_plaintext");
                expect(record.record_plaintext).to.be.a("string");
            }
        });
    });

    describe("register and status", function () {
        it("register returns ok and uuid matches computeUUID", async function () {
            const ephemeralViewKey = new Account().viewKey();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const result = await scanner.register(ephemeralViewKey, 0);
            const expectedUUID = scanner
                .computeUUID(ephemeralViewKey)
                .toString();
            expect(result.ok).to.equal(true);
            let actualUUID = expectedUUID;
            if (result.ok) {
                actualUUID = result.data.uuid;
                expect(actualUUID).to.equal(expectedUUID);
                const revokeResult = await scanner.revoke(result.data.uuid);
                expect(revokeResult.ok).to.equal(true);
            }
        });

        it("registerEncrypted returns ok and uuid matches computeUUID", async function () {
            await sodium.ready;
            const ephemeralViewKey = new Account().viewKey();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            const result = await scanner.registerEncrypted(ephemeralViewKey, 0);
            expect(result.ok).to.equal(true);
            if (result.ok) {
                expect(result.data.uuid).to.equal(
                    scanner.computeUUID(ephemeralViewKey).toString(),
                );
                const revokeResult = await scanner.revoke(result.data.uuid);
                expect(revokeResult.ok).to.equal(true);
            }
        });

        it("status returns expected shape when UUID is set", async function () {
            if (!hasRealApiEnv || !viewKey) this.skip();
            const scanner = new RecordScanner({
                url: sandboxUrl,
                ...(apiKey && { apiKey }),
                ...(consumerId && { consumerId }),
            });
            scanner.setUuid(viewKey);
            const result = await scanner.status();
            expect(result.ok).to.equal(true);
            if (result.ok) {
                expect(result.data).to.have.property("synced");
                expect(result.data).to.have.property("percentage");
                expect(typeof result.data.synced).to.equal("boolean");
                expect(typeof result.data.percentage).to.equal("number");
            }
        });
    });
});
