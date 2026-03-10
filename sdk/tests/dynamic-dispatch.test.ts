import { expect } from "chai";
import {
    Account,
    AleoKeyProvider,
    Authorization,
    PrivateKey,
    ProgramImportsBuilder,
    ProgramManagerBase,
    ProgramManager,
    ProvingRequest,
    Transaction,
    TransactionObject,
    InputObject,
    OutputObject,
    ExecutionObject,
    TransitionObject,
} from "@provablehq/sdk/%%NETWORK%%.js";
import {
    DD_CALLER_PROGRAM,
    DD_CONSTANTS_PROGRAM,
    DD_CONSTANTS_FIELD,
    DD_ALEO_FIELD,
    DD_GET_VALUE_FIELD,
    FIXTURE_DYNAMIC_TRANSFER_PUB_TO_PRIV,
    FIXTURE_DYNAMIC_TRANSFER_PRIVATE,
    FIXTURE_EXTERNAL_RECORD_DYNAMIC,
    FIXTURE_UNIVERSAL_SWAP,
} from "./data/dynamic-dispatch.js";

describe("Dynamic Dispatch", () => {
    describe("Fixture 1: dynamic_transfer_pub_to_priv", () => {
        let transaction: Transaction;
        let summary: TransactionObject;

        before(() => {
            transaction = Transaction.fromString(FIXTURE_DYNAMIC_TRANSFER_PUB_TO_PRIV);
            summary = transaction.summary(true) as TransactionObject;
        });

        it("should parse the transaction successfully", () => {
            expect(transaction.id()).equal(
                "at1jdfcgjg2rj557an4yp3jqd7l082lnaf8glwa9kms6udejm0rmuyscl23dj",
            );
            expect(transaction.isExecute()).equal(true);
        });

        it("should have record_with_dynamic_id output in the inner transition", () => {
            const execution = summary.execution as ExecutionObject;
            const innerTransition = execution.transitions[0] as TransitionObject;
            const outputs = innerTransition.outputs as OutputObject[];

            expect(innerTransition.program).equal("credits.aleo");
            expect(innerTransition.function).equal("transfer_public_to_private");

            // Output 0: record_with_dynamic_id
            expect(outputs[0].type).equal("record_with_dynamic_id");
            expect(outputs[0].id).to.be.a("string");
            expect(outputs[0].checksum).to.be.a("string");
            expect(outputs[0].value).to.be.a("string");
            expect(outputs[0].dynamic_id).to.be.a("string");
            expect((outputs[0].dynamic_id as string)).to.match(/^\d+field$/);

            // Output 1: future (unchanged type)
            expect(outputs[1].type).equal("future");
        });

        it("should have record_dynamic output in the outer transition", () => {
            const execution = summary.execution as ExecutionObject;
            const outerTransition = execution.transitions[1] as TransitionObject;
            const outputs = outerTransition.outputs as OutputObject[];

            expect(outerTransition.program).equal("test_dcall.aleo");
            expect(outerTransition.function).equal("dynamic_transfer_pub_to_priv");

            // Output 0: record_dynamic (opaque — id only)
            expect(outputs[0].type).equal("record_dynamic");
            expect(outputs[0].id).to.be.a("string");
            expect((outputs[0].id as string)).to.match(/^\d+field$/);
            expect(outputs[0].checksum).to.be.undefined;
            expect(outputs[0].value).to.be.undefined;
            expect(outputs[0].dynamic_id).to.be.undefined;

            // Output 1: future
            expect(outputs[1].type).equal("future");
        });
    });

    describe("Fixture 2: dynamic_transfer_private", () => {
        let transaction: Transaction;
        let summary: TransactionObject;

        before(() => {
            transaction = Transaction.fromString(FIXTURE_DYNAMIC_TRANSFER_PRIVATE);
            summary = transaction.summary(true) as TransactionObject;
        });

        it("should parse the transaction successfully", () => {
            expect(transaction.id()).equal(
                "at1v82rljem6grav07tum7sk7qtrk96sn24wa47s9y7hr9jsp8vzyzslrajv4",
            );
            expect(transaction.isExecute()).equal(true);
        });

        it("should have record_with_dynamic_id input in the inner transition", () => {
            const execution = summary.execution as ExecutionObject;
            const innerTransition = execution.transitions[0] as TransitionObject;
            const inputs = innerTransition.inputs as InputObject[];

            expect(innerTransition.program).equal("credits.aleo");
            expect(innerTransition.function).equal("transfer_private");

            // Input 0: record_with_dynamic_id
            expect(inputs[0].type).equal("record_with_dynamic_id");
            expect(inputs[0].id).to.be.a("string");
            expect(inputs[0].tag).to.be.a("string");
            expect(inputs[0].dynamic_id).to.be.a("string");
            expect((inputs[0].dynamic_id as string)).to.match(/^\d+field$/);
        });

        it("should have record_with_dynamic_id outputs in the inner transition", () => {
            const execution = summary.execution as ExecutionObject;
            const innerTransition = execution.transitions[0] as TransitionObject;
            const outputs = innerTransition.outputs as OutputObject[];

            // Both outputs: record_with_dynamic_id
            expect(outputs[0].type).equal("record_with_dynamic_id");
            expect(outputs[0].id).to.be.a("string");
            expect(outputs[0].checksum).to.be.a("string");
            expect(outputs[0].value).to.be.a("string");
            expect(outputs[0].dynamic_id).to.be.a("string");

            expect(outputs[1].type).equal("record_with_dynamic_id");
            expect(outputs[1].dynamic_id).to.be.a("string");
        });

        it("should have record_dynamic input in the outer transition", () => {
            const execution = summary.execution as ExecutionObject;
            const outerTransition = execution.transitions[1] as TransitionObject;
            const inputs = outerTransition.inputs as InputObject[];

            expect(outerTransition.program).equal("test_dcall.aleo");
            expect(outerTransition.function).equal("dynamic_transfer_private");

            // Input 3: record_dynamic
            expect(inputs[3].type).equal("record_dynamic");
            expect(inputs[3].id).to.be.a("string");
            expect(inputs[3].tag).to.be.undefined;
            expect(inputs[3].dynamic_id).to.be.undefined;
        });

        it("should have record_dynamic outputs in the outer transition", () => {
            const execution = summary.execution as ExecutionObject;
            const outerTransition = execution.transitions[1] as TransitionObject;
            const outputs = outerTransition.outputs as OutputObject[];

            // Both outputs: record_dynamic (opaque)
            expect(outputs[0].type).equal("record_dynamic");
            expect(outputs[0].id).to.be.a("string");
            expect(outputs[0].checksum).to.be.undefined;
            expect(outputs[0].dynamic_id).to.be.undefined;

            expect(outputs[1].type).equal("record_dynamic");
            expect(outputs[1].id).to.be.a("string");
        });
    });

    describe("Fixture 3: universal_swap (cross-program)", () => {
        let transaction: Transaction;
        let summary: TransactionObject;

        before(() => {
            transaction = Transaction.fromString(FIXTURE_UNIVERSAL_SWAP);
            summary = transaction.summary(true) as TransactionObject;
        });

        it("should parse the transaction successfully", () => {
            expect(transaction.id()).equal(
                "at1d0jkklkk0dhrshwz0rs79gphw5xsuy4579pd97ejwydgxwzmssrqxeq9m4",
            );
            expect(transaction.isExecute()).equal(true);
        });

        it("should have record_with_dynamic_id input in credits_a transition", () => {
            const execution = summary.execution as ExecutionObject;
            const transition = execution.transitions[0] as TransitionObject;
            const inputs = transition.inputs as InputObject[];

            expect(transition.program).equal("credits_a.aleo");
            expect(transition.function).equal("transfer_private_to_public");

            expect(inputs[0].type).equal("record_with_dynamic_id");
            expect(inputs[0].id).to.be.a("string");
            expect(inputs[0].tag).to.be.a("string");
            expect(inputs[0].dynamic_id).to.be.a("string");
        });

        it("should have record_with_dynamic_id output in credits_a transition", () => {
            const execution = summary.execution as ExecutionObject;
            const transition = execution.transitions[0] as TransitionObject;
            const outputs = transition.outputs as OutputObject[];

            expect(outputs[0].type).equal("record_with_dynamic_id");
            expect(outputs[0].dynamic_id).to.be.a("string");
        });

        it("should have record_with_dynamic_id output in credits_b transition", () => {
            const execution = summary.execution as ExecutionObject;
            const transition = execution.transitions[1] as TransitionObject;
            const outputs = transition.outputs as OutputObject[];

            expect(transition.program).equal("credits_b.aleo");
            expect(outputs[0].type).equal("record_with_dynamic_id");
            expect(outputs[0].dynamic_id).to.be.a("string");
        });

        it("should have record_dynamic input in the AMM transition", () => {
            const execution = summary.execution as ExecutionObject;
            const ammTransition = execution.transitions[2] as TransitionObject;
            const inputs = ammTransition.inputs as InputObject[];

            expect(ammTransition.program).equal("amm.aleo");
            expect(ammTransition.function).equal("buy_token_b");

            // Input 5: record_dynamic
            expect(inputs[5].type).equal("record_dynamic");
            expect(inputs[5].id).to.be.a("string");
            expect(inputs[5].tag).to.be.undefined;
            expect(inputs[5].dynamic_id).to.be.undefined;
        });

        it("should have record_dynamic outputs in the AMM transition", () => {
            const execution = summary.execution as ExecutionObject;
            const ammTransition = execution.transitions[2] as TransitionObject;
            const outputs = ammTransition.outputs as OutputObject[];

            expect(outputs[0].type).equal("record_dynamic");
            expect(outputs[0].id).to.be.a("string");
            expect(outputs[0].checksum).to.be.undefined;

            expect(outputs[1].type).equal("record_dynamic");
            expect(outputs[1].id).to.be.a("string");

            // Output 2: future (dynamic future resolved to concrete)
            expect(outputs[2].type).equal("future");
        });
    });

    describe("Fixture 4: external_record_with_dynamic_id", () => {
        let transaction: Transaction;
        let summary: TransactionObject;

        before(() => {
            transaction = Transaction.fromString(FIXTURE_EXTERNAL_RECORD_DYNAMIC);
            summary = transaction.summary(true) as TransactionObject;
        });

        it("should parse the transaction successfully", () => {
            expect(transaction.id()).equal(
                "at1w47c2x8nqu60vlvkstr33dnss5cjcu6m67u3js62c0dhtf889sps5j4e7u",
            );
            expect(transaction.isExecute()).equal(true);
        });

        it("should have external_record_with_dynamic_id input in the inner transition", () => {
            const execution = summary.execution as ExecutionObject;
            const innerTransition = execution.transitions[0] as TransitionObject;
            const inputs = innerTransition.inputs as InputObject[];

            expect(innerTransition.program).equal("flow_external.aleo");
            expect(innerTransition.function).equal("get_external_liters");

            // Input 0: external_record_with_dynamic_id
            expect(inputs[0].type).equal("external_record_with_dynamic_id");
            expect(inputs[0].id).to.be.a("string");
            expect((inputs[0].id as string)).to.match(/^\d+field$/);
            expect(inputs[0].dynamic_id).to.be.a("string");
            expect((inputs[0].dynamic_id as string)).to.match(/^\d+field$/);
            expect(inputs[0].tag).to.be.undefined;
        });

        it("should have public output in the inner transition", () => {
            const execution = summary.execution as ExecutionObject;
            const innerTransition = execution.transitions[0] as TransitionObject;
            const outputs = innerTransition.outputs as OutputObject[];

            expect(outputs[0].type).equal("public");
            expect(outputs[0].value).equal(BigInt(100));
        });

        it("should have record_dynamic input in the outer transition", () => {
            const execution = summary.execution as ExecutionObject;
            const outerTransition = execution.transitions[1] as TransitionObject;
            const inputs = outerTransition.inputs as InputObject[];

            expect(outerTransition.program).equal("gas_manager_external.aleo");
            expect(outerTransition.function).equal("call_external_liters");

            // Input 0: record_dynamic
            expect(inputs[0].type).equal("record_dynamic");
            expect(inputs[0].id).to.be.a("string");
            expect((inputs[0].id as string)).to.match(/^\d+field$/);
            expect(inputs[0].tag).to.be.undefined;
            expect(inputs[0].dynamic_id).to.be.undefined;
        });

        it("should have public output in the outer transition", () => {
            const execution = summary.execution as ExecutionObject;
            const outerTransition = execution.transitions[1] as TransitionObject;
            const outputs = outerTransition.outputs as OutputObject[];

            expect(outputs[0].type).equal("public");
            expect(outputs[0].value).equal(BigInt(100));
        });
    });

    describe("Dynamic Dispatch Authorization", () => {
        let programManager: ProgramManager;
        const imports = {
            "dd_constants.aleo": DD_CONSTANTS_PROGRAM,
        };

        before(() => {
            const keyProvider = new AleoKeyProvider();
            programManager = new ProgramManager(
                "https://api.provable.com/v2",
                keyProvider,
            );
            programManager.setAccount(new Account());
        });

        it("should build an authorization for a call.dynamic program via buildAuthorization", async () => {
            const authorization = await programManager.buildAuthorization({
                programName: "dd_caller.aleo",
                functionName: "call_and_increment",
                inputs: [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
                programSource: DD_CALLER_PROGRAM,
                programImports: imports,
                edition: 0,
            });

            // The authorization should have 2 transitions: dd_constants/get_value + dd_caller/call_and_increment.
            expect(authorization.transitions().length).equal(2);

            // Verify serialization round-trips.
            const fromString = Authorization.fromString(authorization.toString());
            const fromBytes = Authorization.fromBytesLe(authorization.toBytesLe());
            expect(fromString.equals(authorization)).equal(true);
            expect(fromBytes.equals(authorization)).equal(true);
        });

        it("should build an unchecked authorization for a call.dynamic program via buildAuthorizationUnchecked", async () => {
            const authorization = await programManager.buildAuthorizationUnchecked({
                programName: "dd_caller.aleo",
                functionName: "call_and_increment",
                inputs: [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
                programSource: DD_CALLER_PROGRAM,
                programImports: imports,
                edition: 0,
            });

            // The authorization should have 2 transitions: dd_constants/get_value + dd_caller/call_and_increment.
            expect(authorization.transitions().length).equal(2);

            // Verify serialization round-trips.
            const fromString = Authorization.fromString(authorization.toString());
            const fromBytes = Authorization.fromBytesLe(authorization.toBytesLe());
            expect(fromString.equals(authorization)).equal(true);
            expect(fromBytes.equals(authorization)).equal(true);
        });

        it("should build an authorization using ProgramImportsBuilder instead of plain object", async () => {
            // Create a ProgramImportsBuilder and add the import via the builder API.
            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM, 0);

            const authorization = await programManager.buildAuthorization({
                programName: "dd_caller.aleo",
                functionName: "call_and_increment",
                inputs: [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
                programSource: DD_CALLER_PROGRAM,
                programImportsBuilder: builder,
                edition: 0,
            });

            // Same result as the plain-object path: 2 transitions.
            expect(authorization.transitions().length).equal(2);

            // Verify serialization round-trips.
            const fromString = Authorization.fromString(authorization.toString());
            const fromBytes = Authorization.fromBytesLe(authorization.toBytesLe());
            expect(fromString.equals(authorization)).equal(true);
            expect(fromBytes.equals(authorization)).equal(true);
        });

        it("should build an authorization with pre-computed keys via ProgramImportsBuilder", async function() {
            // This test synthesizes keys which is expensive.
            this.timeout(120_000);

            // Synthesize keys for the imported program's function.
            const privateKey = new PrivateKey();
            const keyPair = await ProgramManagerBase.synthesizeKeyPair(
                privateKey,
                DD_CONSTANTS_PROGRAM,
                "get_value",
                [],        // get_value takes no inputs
                undefined, // no legacy imports
                0,         // edition
                undefined, // no program_imports builder
            );
            const provingKey = keyPair.provingKey();
            const verifyingKey = keyPair.verifyingKey();

            // Build a ProgramImportsBuilder with the program source AND pre-computed keys.
            const builder = new ProgramImportsBuilder();
            builder.addProgram("dd_constants.aleo", DD_CONSTANTS_PROGRAM, 0);
            builder.addProvingKey("dd_constants.aleo", "get_value", provingKey);
            builder.addVerifyingKey("dd_constants.aleo", "get_value", verifyingKey);

            // Build the authorization using the builder with keys.
            const authorization = await programManager.buildAuthorization({
                programName: "dd_caller.aleo",
                functionName: "call_and_increment",
                inputs: [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
                programSource: DD_CALLER_PROGRAM,
                programImportsBuilder: builder,
                edition: 0,
            });

            // Same result as the plain-object path: 2 transitions.
            expect(authorization.transitions().length).equal(2);

            // Verify serialization round-trips.
            const fromString = Authorization.fromString(authorization.toString());
            const fromBytes = Authorization.fromBytesLe(authorization.toBytesLe());
            expect(fromString.equals(authorization)).equal(true);
            expect(fromBytes.equals(authorization)).equal(true);
        });

        it("should build a proving request for a call.dynamic program via provingRequest", async () => {
            const provingRequest = await programManager.provingRequest({
                programName: "dd_caller.aleo",
                functionName: "call_and_increment",
                priorityFee: 0,
                privateFee: false,
                inputs: [DD_CONSTANTS_FIELD, DD_ALEO_FIELD, DD_GET_VALUE_FIELD],
                programSource: DD_CALLER_PROGRAM,
                programImports: imports,
                edition: 0,
                broadcast: false,
                useFeeMaster: true,
            });

            // The proving request should have an authorization with 2 transitions.
            const authorization = provingRequest.authorization();
            expect(authorization.transitions().length).equal(2);

            // No fee authorization when useFeeMaster is true.
            expect(provingRequest.feeAuthorization()).equal(undefined);

            // Verify serialization round-trips.
            const fromString = ProvingRequest.fromString(provingRequest.toString());
            const fromBytes = ProvingRequest.fromBytesLe(provingRequest.toBytesLe());
            expect(fromString.equals(provingRequest)).equal(true);
            expect(fromBytes.equals(provingRequest)).equal(true);
        });
    });
});
