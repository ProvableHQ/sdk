import { expect } from "chai";
import {
    Address,
    Field,
    Scalar,
    Group,
    Boolean,
    I8, I16, I32, I64, I128,
    U8, U16, U32, U64, U128,
} from "../src/node.js";

describe('cast_lossy type conversions', () => {

    describe('Field conversions', () => {
        it('Field.toScalarLossy() round-trips for small values', () => {
            const scalar = Scalar.fromString("42scalar");
            const field = scalar.toField();
            const back = field.toScalarLossy();
            expect(back.toString()).to.equal(scalar.toString());
        });

        it('Field.toBooleanLossy() extracts LSB', () => {
            expect(Field.fromString("0field").toBooleanLossy().toString()).to.equal("false");
            expect(Field.fromString("1field").toBooleanLossy().toString()).to.equal("true");
            expect(Field.fromString("2field").toBooleanLossy().toString()).to.equal("false");
            expect(Field.fromString("3field").toBooleanLossy().toString()).to.equal("true");
        });

        it('Field.toGroup() (strict) may fail for arbitrary fields', () => {
            // Valid x-coordinate may or may not work depending on the curve
            // Just ensure the method exists and returns Result-like behavior
            expect(() => Field.fromString("0field").toGroup()).to.not.throw();
        });

        it('Field.toGroupLossy() never throws', () => {
            expect(() => Field.fromString("0field").toGroupLossy()).to.not.throw();
            expect(() => Field.fromString("1field").toGroupLossy()).to.not.throw();
            expect(() => Field.fromString("12345field").toGroupLossy()).to.not.throw();
        });

        it('Field.toAddressLossy() produces valid address', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Field.toU32Lossy() preserves small values', () => {
            expect(Field.fromString("255field").toU32Lossy().toString()).to.equal("255u32");
        });

        it('Field.toU8Lossy() truncates large values', () => {
            expect(Field.fromString("256field").toU8Lossy().toString()).to.equal("0u8");
            expect(Field.fromString("257field").toU8Lossy().toString()).to.equal("1u8");
        });

        it('Field has all integer lossy conversion methods', () => {
            const f = Field.fromString("42field");
            expect(f.toU8Lossy().toString()).to.equal("42u8");
            expect(f.toU16Lossy().toString()).to.equal("42u16");
            expect(f.toU32Lossy().toString()).to.equal("42u32");
            expect(f.toU64Lossy().toString()).to.equal("42u64");
            expect(f.toU128Lossy().toString()).to.equal("42u128");
            expect(f.toI8Lossy().toString()).to.equal("42i8");
            expect(f.toI16Lossy().toString()).to.equal("42i16");
            expect(f.toI32Lossy().toString()).to.equal("42i32");
            expect(f.toI64Lossy().toString()).to.equal("42i64");
            expect(f.toI128Lossy().toString()).to.equal("42i128");
        });
    });

    describe('Scalar conversions', () => {
        it('Scalar.toBooleanLossy() extracts LSB', () => {
            expect(Scalar.fromString("0scalar").toBooleanLossy().toString()).to.equal("false");
            expect(Scalar.fromString("1scalar").toBooleanLossy().toString()).to.equal("true");
        });

        it('Scalar.toGroupLossy() never throws', () => {
            expect(() => Scalar.fromString("42scalar").toGroupLossy()).to.not.throw();
        });

        it('Scalar.toAddressLossy() produces valid address', () => {
            const addr = Scalar.fromString("42scalar").toAddressLossy();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Scalar.toU32Lossy() preserves small values', () => {
            expect(Scalar.fromString("100scalar").toU32Lossy().toString()).to.equal("100u32");
        });
    });

    describe('Boolean conversions (lossless)', () => {
        it('Boolean.toField() converts correctly', () => {
            expect(Boolean.fromString("true").toField().toString()).to.equal("1field");
            expect(Boolean.fromString("false").toField().toString()).to.equal("0field");
        });

        it('Boolean.toScalar() converts correctly', () => {
            expect(Boolean.fromString("true").toScalar().toString()).to.equal("1scalar");
            expect(Boolean.fromString("false").toScalar().toString()).to.equal("0scalar");
        });

        it('Boolean.toGroupLossy() never throws', () => {
            expect(() => Boolean.fromString("true").toGroupLossy()).to.not.throw();
            expect(() => Boolean.fromString("false").toGroupLossy()).to.not.throw();
        });

        it('Boolean.toU8() converts correctly', () => {
            expect(Boolean.fromString("true").toU8().toString()).to.equal("1u8");
            expect(Boolean.fromString("false").toU8().toString()).to.equal("0u8");
        });

        it('Boolean round-trips through Field', () => {
            const t = Boolean.fromString("true");
            expect(t.toField().toBooleanLossy().toString()).to.equal("true");

            const f = Boolean.fromString("false");
            expect(f.toField().toBooleanLossy().toString()).to.equal("false");
        });
    });

    describe('Integer conversions', () => {
        it('Integer.toField() is lossless', () => {
            const val = U32.fromString("42u32");
            const field = val.toField();
            const back = U32.fromField(field);
            expect(back.toString()).to.equal("42u32");
        });

        it('Integer.fromFieldLossy() round-trips for in-range values', () => {
            const val = U8.fromString("200u8");
            const field = val.toField();
            const back = U8.fromFieldLossy(field);
            expect(back.toString()).to.equal("200u8");
        });

        it('Integer.toBooleanLossy() extracts LSB', () => {
            expect(U32.fromString("0u32").toBooleanLossy().toString()).to.equal("false");
            expect(U32.fromString("1u32").toBooleanLossy().toString()).to.equal("true");
            expect(U32.fromString("4u32").toBooleanLossy().toString()).to.equal("false");
        });

        it('Integer cross-cast lossy: U32.toU8Lossy() truncates', () => {
            expect(U32.fromString("256u32").toU8Lossy().toString()).to.equal("0u8");
            expect(U32.fromString("257u32").toU8Lossy().toString()).to.equal("1u8");
        });

        it('Integer cross-cast lossy: U8.toU32Lossy() widens', () => {
            expect(U8.fromString("255u8").toU32Lossy().toString()).to.equal("255u32");
        });

        it('Integer cross-cast lossy: I32.toU32Lossy() works', () => {
            expect(I32.fromString("42i32").toU32Lossy().toString()).to.equal("42u32");
        });

        it('Integer cross-cast lossy: identity', () => {
            expect(U32.fromString("42u32").toU32Lossy().toString()).to.equal("42u32");
        });
    });

    describe('Group conversions', () => {
        it('Group.toField() returns x-coordinate', () => {
            const group = Group.generator();
            const field = group.toField();
            const xCoord = group.toXCoordinate();
            expect(field.toString()).to.equal(xCoord.toString());
        });

        it('Group.toScalarLossy() does not throw', () => {
            expect(() => Group.generator().toScalarLossy()).to.not.throw();
        });

        it('Group.toBooleanLossy() extracts LSB of x-coordinate', () => {
            const group = Group.generator();
            const groupBool = group.toBooleanLossy();
            const fieldBool = group.toField().toBooleanLossy();
            expect(groupBool.toString()).to.equal(fieldBool.toString());
        });

        it('Group.toAddress() produces valid address (lossless)', () => {
            const addr = Group.generator().toAddress();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Group.toU32Lossy() does not throw', () => {
            expect(() => Group.generator().toU32Lossy()).to.not.throw();
        });
    });

    describe('Address conversions', () => {
        it('Address.toField() does not throw', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            expect(() => addr.toField()).to.not.throw();
        });

        it('Address.toScalarLossy() does not throw', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            expect(() => addr.toScalarLossy()).to.not.throw();
        });

        it('Address.toBooleanLossy() does not throw', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            expect(() => addr.toBooleanLossy()).to.not.throw();
        });

        it('Address.toU32Lossy() does not throw', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            expect(() => addr.toU32Lossy()).to.not.throw();
        });

        it('Address → Group → Address round-trips', () => {
            const addr = Field.fromString("42field").toAddressLossy();
            const group = addr.toGroup();
            const back = group.toAddress();
            expect(back.toString()).to.equal(addr.toString());
        });
    });
});
