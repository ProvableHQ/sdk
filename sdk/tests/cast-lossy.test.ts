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
        it('Field.toScalar() round-trips for small values', () => {
            const scalar = Scalar.fromString("42scalar");
            const field = scalar.toField();
            const back = field.toScalar();
            expect(back.toString()).to.equal(scalar.toString());
        });

        it('Field.toBoolean() extracts LSB', () => {
            expect(Field.fromString("0field").toBoolean().toString()).to.equal("false");
            expect(Field.fromString("1field").toBoolean().toString()).to.equal("true");
            expect(Field.fromString("2field").toBoolean().toString()).to.equal("false");
            expect(Field.fromString("3field").toBoolean().toString()).to.equal("true");
        });

        it('Field.toGroup() never throws', () => {
            expect(() => Field.fromString("0field").toGroup()).to.not.throw();
            expect(() => Field.fromString("1field").toGroup()).to.not.throw();
            expect(() => Field.fromString("12345field").toGroup()).to.not.throw();
        });

        it('Field.toAddress() produces valid address', () => {
            const addr = Field.fromString("42field").toAddress();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Field.toU32() preserves small values', () => {
            expect(Field.fromString("255field").toU32().toString()).to.equal("255u32");
        });

        it('Field.toU8() truncates large values', () => {
            expect(Field.fromString("256field").toU8().toString()).to.equal("0u8");
            expect(Field.fromString("257field").toU8().toString()).to.equal("1u8");
        });

        it('Field has all integer conversion methods', () => {
            const f = Field.fromString("42field");
            expect(f.toU8().toString()).to.equal("42u8");
            expect(f.toU16().toString()).to.equal("42u16");
            expect(f.toU32().toString()).to.equal("42u32");
            expect(f.toU64().toString()).to.equal("42u64");
            expect(f.toU128().toString()).to.equal("42u128");
            expect(f.toI8().toString()).to.equal("42i8");
            expect(f.toI16().toString()).to.equal("42i16");
            expect(f.toI32().toString()).to.equal("42i32");
            expect(f.toI64().toString()).to.equal("42i64");
            expect(f.toI128().toString()).to.equal("42i128");
        });
    });

    describe('Scalar conversions', () => {
        it('Scalar.toBoolean() extracts LSB', () => {
            expect(Scalar.fromString("0scalar").toBoolean().toString()).to.equal("false");
            expect(Scalar.fromString("1scalar").toBoolean().toString()).to.equal("true");
        });

        it('Scalar.toGroup() never throws', () => {
            expect(() => Scalar.fromString("42scalar").toGroup()).to.not.throw();
        });

        it('Scalar.toAddress() produces valid address', () => {
            const addr = Scalar.fromString("42scalar").toAddress();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Scalar.toU32() preserves small values', () => {
            expect(Scalar.fromString("100scalar").toU32().toString()).to.equal("100u32");
        });
    });

    describe('Boolean conversions', () => {
        it('Boolean.toField() converts correctly', () => {
            expect(Boolean.fromString("true").toField().toString()).to.equal("1field");
            expect(Boolean.fromString("false").toField().toString()).to.equal("0field");
        });

        it('Boolean.toScalar() converts correctly', () => {
            expect(Boolean.fromString("true").toScalar().toString()).to.equal("1scalar");
            expect(Boolean.fromString("false").toScalar().toString()).to.equal("0scalar");
        });

        it('Boolean.toGroup() never throws', () => {
            expect(() => Boolean.fromString("true").toGroup()).to.not.throw();
            expect(() => Boolean.fromString("false").toGroup()).to.not.throw();
        });

        it('Boolean.toU8() converts correctly', () => {
            expect(Boolean.fromString("true").toU8().toString()).to.equal("1u8");
            expect(Boolean.fromString("false").toU8().toString()).to.equal("0u8");
        });

        it('Boolean round-trips through Field', () => {
            const t = Boolean.fromString("true");
            expect(t.toField().toBoolean().toString()).to.equal("true");

            const f = Boolean.fromString("false");
            expect(f.toField().toBoolean().toString()).to.equal("false");
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

        it('Integer.toBoolean() extracts LSB', () => {
            expect(U32.fromString("0u32").toBoolean().toString()).to.equal("false");
            expect(U32.fromString("1u32").toBoolean().toString()).to.equal("true");
            expect(U32.fromString("4u32").toBoolean().toString()).to.equal("false");
        });

        it('Integer.toGroup() never throws', () => {
            expect(() => U32.fromString("42u32").toGroup()).to.not.throw();
        });

        it('Integer.toAddress() produces valid address', () => {
            const addr = U32.fromString("42u32").toAddress();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Integer cross-cast: U32.toU8() truncates', () => {
            expect(U32.fromString("256u32").toU8().toString()).to.equal("0u8");
            expect(U32.fromString("257u32").toU8().toString()).to.equal("1u8");
        });

        it('Integer cross-cast: U8.toU32() widens', () => {
            expect(U8.fromString("255u8").toU32().toString()).to.equal("255u32");
        });

        it('Integer cross-cast: I32.toU32() works', () => {
            expect(I32.fromString("42i32").toU32().toString()).to.equal("42u32");
        });

        it('Integer cross-cast: identity', () => {
            expect(U32.fromString("42u32").toU32().toString()).to.equal("42u32");
        });
    });

    describe('Group conversions', () => {
        it('Group.toField() returns x-coordinate', () => {
            const group = Group.generator();
            const field = group.toField();
            const xCoord = group.toXCoordinate();
            expect(field.toString()).to.equal(xCoord.toString());
        });

        it('Group.toScalar() does not throw', () => {
            expect(() => Group.generator().toScalar()).to.not.throw();
        });

        it('Group.toBoolean() extracts LSB of x-coordinate', () => {
            const group = Group.generator();
            const groupBool = group.toBoolean();
            const fieldBool = group.toField().toBoolean();
            expect(groupBool.toString()).to.equal(fieldBool.toString());
        });

        it('Group.toAddress() produces valid address', () => {
            const addr = Group.generator().toAddress();
            expect(addr.toString()).to.match(/^aleo1/);
        });

        it('Group.toU32() does not throw', () => {
            expect(() => Group.generator().toU32()).to.not.throw();
        });
    });

    describe('Address conversions', () => {
        it('Address.toField() does not throw', () => {
            const addr = Field.fromString("42field").toAddress();
            expect(() => addr.toField()).to.not.throw();
        });

        it('Address.toScalar() does not throw', () => {
            const addr = Field.fromString("42field").toAddress();
            expect(() => addr.toScalar()).to.not.throw();
        });

        it('Address.toBoolean() does not throw', () => {
            const addr = Field.fromString("42field").toAddress();
            expect(() => addr.toBoolean()).to.not.throw();
        });

        it('Address.toU32() does not throw', () => {
            const addr = Field.fromString("42field").toAddress();
            expect(() => addr.toU32()).to.not.throw();
        });

        it('Address → Group → Address round-trips', () => {
            const addr = Field.fromString("42field").toAddress();
            const group = addr.toGroup();
            const back = group.toAddress();
            expect(back.toString()).to.equal(addr.toString());
        });
    });
});
