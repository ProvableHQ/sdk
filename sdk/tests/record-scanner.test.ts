import { Account } from "../src/account";
import { CHECK_SNS_RESPONSE, CHECK_TAGS_RESPONSE, ENCRYPTED_RECORDS, OWNED_RECORDS } from "./data/records";
import { expect } from "chai";
import sodium from "libsodium-wrappers";
import { OwnedFilter } from "../src/models/record-scanner/ownedFilter";
import { OwnedRecordsResponseFilter } from "../src/models/record-scanner/ownedRecordsResponseFilter";
import { RecordScanner } from "../src/record-scanner";
import { RecordsFilter } from "../src/models/record-scanner/recordsFilter";
import { RecordsResponseFilter } from "../src/models/record-scanner/recordsResponseFilter";
import { ViewKey } from "../src/node";
import { encryptRegistrationRequest } from "../src/security";
import sinon from "sinon";

const SCANNER_URL = process.env.RECORD_SCANNER_URL ?? "";

describe("RecordScanner", () => {
    const defaultAccount = new Account({ privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" });
    let recordScanner: RecordScanner;
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should intialize with the correct url", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        expect(recordScanner.url).equal("https://record-scanner.aleo.org");
    });

    it("should intialize with the correct api key as a string", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org", apiKey: "1234567890" });
        
        const mockResponse = {
            ok: true,
            status: 201,
            text: () => Promise.resolve('{"uuid": "test-uuid"}'),
            json: () => Promise.resolve({ uuid: "test-uuid" })
        };
        
        fetchStub.resolves(mockResponse);
        await recordScanner.register(defaultAccount.viewKey(), 0);
        
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.headers.get("X-Provable-API-Key")).to.equal("1234567890");
    });

    it("should intialize with the correct api key as an object", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org", apiKey: { header: "Some-API-Key", value: "1234567890" } });
        
        const mockResponse = {
            ok: true,
            status: 201,
            text: () => Promise.resolve('{"uuid": "test-uuid"}'),
            json: () => Promise.resolve({ uuid: "test-uuid" })
        };
        
        fetchStub.resolves(mockResponse);
        await recordScanner.register(defaultAccount.viewKey(), 0);
        
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.headers.get("Some-API-Key")).to.equal("1234567890");
    });

    it("should return RegistrationResponse after successfully registering the account", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        
        const mockResponse = {
            ok: true,
            status: 201,
            text: () => Promise.resolve('{"uuid": "test-uuid"}'),
            json: () => Promise.resolve({ uuid: "test-uuid" })
        };
        
        fetchStub.resolves(mockResponse);
        const registrationResponse = await recordScanner.register(defaultAccount.viewKey(), 0);
        
        expect(fetchStub.calledOnce).to.be.true;
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.url).to.equal("https://record-scanner.aleo.org/register");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
        
        const body = await request.text();
        const expectedBody = JSON.stringify({ view_key: defaultAccount.viewKey().to_string(), start: 0 });
        expect(body).to.equal(expectedBody);
        
        expect(registrationResponse.uuid).equal("test-uuid");
    });

    it("should return the optional fields of RegistrationResponse if present after successfully registering the account", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        
        const mockResponse = {
            ok: true,
            status: 201,
            text: () => Promise.resolve('{"uuid": "test-uuid", "job_id": "test-job-id", "status": "pending"}'),
            json: () => Promise.resolve({ uuid: "test-uuid", job_id: "test-job-id", status: "pending" })
        };
        
        fetchStub.resolves(mockResponse);
        const registrationResponse = await recordScanner.register(defaultAccount.viewKey(), 0);

        expect(fetchStub.calledOnce).to.be.true;
        const request = fetchStub.firstCall.args[0] as Request;
        expect(request.url).to.equal("https://record-scanner.aleo.org/register");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
        
        const body = await request.text();
        const expectedBody = JSON.stringify({ view_key: defaultAccount.viewKey().to_string(), start: 0 });
        expect(body).to.equal(expectedBody);
        
        expect(registrationResponse.uuid).equal("test-uuid");
        expect(registrationResponse.job_id).equal("test-job-id");
        expect(registrationResponse.status).equal("pending");
    });

    
    it("should return EncryptedRecord[] after successfully getting encrypted records", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
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
        expect(request.url).to.equal("https://record-scanner.aleo.org/records/encrypted");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should return OwnedRecord[] after successfully getting owned records", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
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
        expect(request.url).to.equal("https://record-scanner.aleo.org/records/owned");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should return OwnedRecord after successfully getting owned record", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
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
        expect(request.url).to.equal("https://record-scanner.aleo.org/records/owned");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should throw an error if the uuid is not registered", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        let failed = false;
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
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("You are using the RecordScanner implementation of the RecordProvider. No account has been registered with the RecordScanner which is required to use the findRecords method. Please set an with the setAccount method before calling the findRecords method again.");
            failed = true;
        }
        expect(failed).to.be.true;
    });

    it("should return record of string->boolean after successfully checking serial numbers", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
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
        expect(request.url).to.equal("https://record-scanner.aleo.org/records/sns");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should return record of string->boolean after successfully checking tags", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
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
        expect(request.url).to.equal("https://record-scanner.aleo.org/records/tags");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should return StatusResponse after successfully checking status", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        const mockResponse = {
            ok: true,
            status: 200,
            text: () => Promise.resolve(JSON.stringify({ synced: true, percentage: 100 })),
            json: () => Promise.resolve({ synced: true, percentage: 100 }),
        };
        recordScanner.setUuid(defaultAccount.viewKey());
        fetchStub.resolves(mockResponse);
        const statusResponse = await recordScanner.checkStatus();
        expect(statusResponse).to.deep.equal({ synced: true, percentage: 100 });

        const request = fetchStub.firstCall.args[0] as Request;
        const body = await request.text();
        const expectedBody = JSON.stringify(recordScanner.computeUUID(defaultAccount.viewKey()).toString());
        expect(body).to.equal(expectedBody);
        expect(request.url).to.equal("https://record-scanner.aleo.org/status");
        expect(request.method).to.equal("POST");
        expect(request.headers.get("Content-Type")).to.equal("application/json");
    });

    it("should handle HTTP errors", async () => {
        recordScanner = new RecordScanner({ url: "https://record-scanner.aleo.org" });
        let mockResponse = {
            ok: false,
            status: 500,
            text: () => Promise.resolve('{"error": "Internal server error"}'),
        };

        fetchStub.resolves(mockResponse);
        let failed = false;
        try {
            await recordScanner.register(defaultAccount.viewKey(), 0);
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal('{"error": "Internal server error"}');
            failed = true;
        }
        expect(failed).to.be.true;

        mockResponse = {
            ok: false,
            status: 422,
            text: () => Promise.resolve('{"error": "Invalid view key"}'),
        };

        fetchStub.resolves(mockResponse);
        failed = false;
        try {
            await recordScanner.register(defaultAccount.viewKey(), 0);
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal('{"error": "Invalid view key"}');
            failed = true;
        }
        expect(failed).to.be.true;

        fetchStub.rejects(new Error("Unknown error"));
        failed = false;
        try {
            await recordScanner.register(defaultAccount.viewKey(), 0);
        } catch (err: any) {
            expect(err).to.be.instanceOf(Error);
            expect(err.message).to.equal("Unknown error");
            failed = true;
        }
        expect(failed).to.be.true;
    });
});

describe("Record scanner encrypted registration", function () {
    const sandboxUrl = SCANNER_URL;
    const apiKey = process.env.KONG_API_KEY as string;
    const consumerId = process.env.CONSUMER_ID as string | undefined;

    it.only("should fetch ephemeral public key from /pubkey", async function () {
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

    it.only("should execute encrypted registration (/register/encrypted)", async function () {
        this.retries(3);
        const startBlock = 0;

        // Ensure encryption roundtrip works locally (same pattern as program-manager encrypted proving test).
        await sodium.ready;
        const keyPair = sodium.crypto_box_keypair();
        const viewKey = new Account().viewKey();
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
        const vkBytes = viewKey.toBytesLe();
        expect(plaintextBytes.length).to.equal(vkBytes.length + 4);
        const decodedStart = new DataView(plaintextBytes.buffer).getUint32(plaintextBytes.length - 4, true);
        expect(decodedStart).to.equal(startBlock);

        // Register via encrypted flow against sandbox.
        const recordScanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const response = await recordScanner.registerEncrypted(viewKey, startBlock);
        expect(response).to.have.property("uuid");
        expect(response.uuid).to.equal(recordScanner.computeUUID(viewKey).toString());
    });

    it.only("should execute unencrypted registration (/register)", async function () {
        this.retries(3);
        const startBlock = 0;

        const viewKey = new Account().viewKey();

        // Register via encrypted flow against sandbox.
        const recordScanner = new RecordScanner({
            url: sandboxUrl,
            ...(apiKey && { apiKey }),
            ...(consumerId && { consumerId }),
        });
        const response = await recordScanner.register(
            viewKey,
            startBlock,
        );
        expect(response).to.have.property("uuid");
        expect(response.uuid).to.equal(
            recordScanner.computeUUID(viewKey).toString(),
        );
    });
});