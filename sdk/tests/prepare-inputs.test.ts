import { expect } from "chai";
import {
    ProgramManager,
    stringToField,
} from "@provablehq/sdk/%%NETWORK%%.js";

const DD_CALLER_PROGRAM = `program dd_caller.aleo;

function call_and_increment:
    input r0 as field.public;
    input r1 as field.public;
    input r2 as field.public;
    call.dynamic r0 r1 r2 into r3 (as u128.private);
    add r3 1u128 into r4;
    output r4 as u128.public;

constructor:
    assert.eq true true;
`;

describe("ProgramManager.prepareInputs", () => {
    it("should convert bare strings to field elements for field-typed inputs", () => {
        const manager = new ProgramManager();
        const result = manager.prepareInputs(DD_CALLER_PROGRAM, "call_and_increment", [
            "dd_constants",
            "aleo",
            "get_value",
        ]);
        expect(result[0]).to.equal(stringToField("dd_constants").toString());
        expect(result[1]).to.equal(stringToField("aleo").toString());
        expect(result[2]).to.equal(stringToField("get_value").toString());
    });

    it("should leave numeric field literals (e.g. '123field') untouched", () => {
        const manager = new ProgramManager();
        const alreadyFieldLiteral = "123field";
        const result = manager.prepareInputs(DD_CALLER_PROGRAM, "call_and_increment", [
            alreadyFieldLiteral,
            "456field",
            "789field",
        ]);
        expect(result[0]).to.equal(alreadyFieldLiteral);
        expect(result[1]).to.equal("456field");
        expect(result[2]).to.equal("789field");
    });

    it("should convert identifiers ending with 'field' when a field is expected", () => {
        const manager = new ProgramManager();
        const result = manager.prepareInputs(DD_CALLER_PROGRAM, "call_and_increment", [
            "battlefield",
            "my_field",
            "outfield",
        ]);
        // These are NOT numeric field literals — they must be converted
        expect(result[0]).to.equal(stringToField("battlefield").toString());
        expect(result[1]).to.equal(stringToField("my_field").toString());
        expect(result[2]).to.equal(stringToField("outfield").toString());
    });

    it("should leave stringToField output untouched since it is a numeric field literal", () => {
        const manager = new ProgramManager();
        const encoded = stringToField("dd_constants").toString();
        const result = manager.prepareInputs(DD_CALLER_PROGRAM, "call_and_increment", [
            encoded,
            stringToField("aleo").toString(),
            stringToField("get_value").toString(),
        ]);
        expect(result[0]).to.equal(encoded);
        expect(result[1]).to.equal(stringToField("aleo").toString());
        expect(result[2]).to.equal(stringToField("get_value").toString());
    });

    it("should not convert non-field inputs", () => {
        const program = `program test_non_field.aleo;\n\nfunction add:\n    input r0 as u32.public;\n    input r1 as u32.private;\n    add r0 r1 into r2;\n    output r2 as u32.private;\n`;
        const manager = new ProgramManager();
        const result = manager.prepareInputs(program, "add", ["5u32", "10u32"]);
        expect(result[0]).to.equal("5u32");
        expect(result[1]).to.equal("10u32");
    });

    it("should return original inputs when input count mismatches", () => {
        const manager = new ProgramManager();
        const result = manager.prepareInputs(DD_CALLER_PROGRAM, "call_and_increment", [
            "dd_constants",
            "aleo",
        ]);
        expect(result[0]).to.equal("dd_constants");
        expect(result[1]).to.equal("aleo");
        expect(result.length).to.equal(2);
    });

    it("should return original inputs for invalid program source", () => {
        const manager = new ProgramManager();
        const inputs = ["a", "b", "c"];
        const result = manager.prepareInputs("not a valid program", "foo", inputs);
        expect(result).to.deep.equal(inputs);
    });

    it("should handle mixed field and non-field inputs", () => {
        const program = `program mixed.aleo;\n\nfunction mix:\n    input r0 as field.public;\n    input r1 as u64.private;\n    input r2 as field.private;\n    output r0 as field.public;\n`;
        const manager = new ProgramManager();
        const result = manager.prepareInputs(program, "mix", ["hello", "42u64", "world"]);
        expect(result[0]).to.equal(stringToField("hello").toString());
        expect(result[1]).to.equal("42u64");
        expect(result[2]).to.equal(stringToField("world").toString());
    });
});
