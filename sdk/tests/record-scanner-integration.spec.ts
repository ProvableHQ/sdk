import { expect } from "chai";
import { ViewKey } from "../src/node";
import { RecordScanner } from "../src/record-scanner";

describe("RecordScanner", () => {
    const recordScannerUrl = process.env.RECORD_SCANNER_URL as string;
    const apiKey = process.env.KONG_API_KEY as string;
    const viewKeyStr = process.env.VIEW_KEY as string;
    const viewKey = new ViewKey(viewKeyStr);
    let recordScanner = new RecordScanner({ url: recordScannerUrl, apiKey });

    it("should successfully register a view key", async () => {
        const result = await recordScanner.register(viewKey, 0);
        expect(result.ok).to.equal(true);
        if (result.ok) {
            expect(result.data.uuid).to.equal(recordScanner.computeUUID(viewKey).toString());
        }
    });

    it("should successfully get owned records", async () => {
        let response = await recordScanner.findRecords({
            filter: {
                program: "credits.aleo",
                records: ["credits"],
                start: 0,
                end: 10332941,
            },
            response: {
                block_height: true,
                program_name: true,
                record_name: true,
                commitment: true,
            }
        });
        expect(response.length).to.equal(9);
        for (const record of response) {
            expect(record.program_name).to.equal("credits.aleo");
            expect(record.record_name).to.equal("credits");
            expect(record.block_height).to.be.greaterThan(0);
            expect(record.block_height).to.be.lessThan(10332941);
            expect(record.commitment).to.exist;
            expect(record.output_index).to.not.exist;
        }

        response = await recordScanner.findRecords({
            filter: {
                program: "credits.aleo",
                records: ["credits"],
                start: 10000000,
                end: 10332941,
            },
        });
        expect(response.length).to.equal(3);
        for (const record of response) {
            expect(record.program_name).to.equal("credits.aleo");
            expect(record.record_name).to.equal("credits");
            expect(record.block_height).to.be.greaterThan(10000000);
            expect(record.block_height).to.be.lessThan(10332941);
            expect(record.commitment).to.exist;
            expect(record.output_index).to.exist;
        }
    });

    it("should successfully get encrypted records", async () => {
        let response = await recordScanner.encryptedRecords({
            program: "credits.aleo",
            records: ["credits"],
            results_per_page: 50,
            response: {
                commitment: true,
                block_height: true,
                program_name: true,
                record_name: true,
            },
        });

        expect(response.length).to.equal(50);
        for (const record of response) {
            expect(record.program_name).to.equal("credits.aleo");
            expect(record.record_name).to.equal("credits");
            expect(record.commitment).to.exist;
            expect(record.block_height).to.exist;
            expect(record.output_index).to.not.exist;
        }

        response = await recordScanner.encryptedRecords({
            program: "credits.aleo",
            records: ["credits"],
            results_per_page: 30,
        });
        expect(response.length).to.equal(30);
        for (const record of response) {
            expect(record.program_name).to.equal("credits.aleo");
            expect(record.record_name).to.equal("credits");
            expect(record.commitment).to.exist;
            expect(record.block_height).to.exist;
            expect(record.output_index).to.exist;
        }
    });

    it("should successfully check serial numbers", async () => {
        let response = await recordScanner.checkSerialNumbers([
            "2497968624879919117393326048350070098671407363450098197552864797993755823036field",
            "1050894655374138905808887909092891940183499902306462627909572997011712750387field",
        ]);
        expect(response).to.deep.equal({
            "2497968624879919117393326048350070098671407363450098197552864797993755823036field": false,
            "1050894655374138905808887909092891940183499902306462627909572997011712750387field": false,
        });
    });

    it("should successfully check tags", async () => {
        let response = await recordScanner.checkTags([
            "2726311268578079710210289900019159614843633435399431654197596897028642765098field",
            "448505083045691117285710413252063292683250969684463991322463606849073525242field",
        ]);
        expect(response).to.deep.equal({
            "2726311268578079710210289900019159614843633435399431654197596897028642765098field": false,
            "448505083045691117285710413252063292683250969684463991322463606849073525242field": false,
        });
    });

    it("should successfully get a job status", async () => {
        let response = await recordScanner.checkStatus();
        expect(response.synced).to.be.instanceOf(Boolean);
        expect(response.percentage).to.be.instanceOf(Number);
    })
});