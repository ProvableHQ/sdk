import sinon from "sinon";
import { expect } from "chai";
import { Field, Scalar, Group, Boolean, I8, I16, I32, I64, I128, U8, U16, U32, U64, U128} from "../src/node.js";
import { FieldGenerator, GroupGenerator, ScalarGenerator } from "./data/algebra.js";

describe('Field and Group Arithmetic Tests', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('Field and Group arithmetic', () => {
        it('Check field arithmetic functions work as expected', () => {
            // Create the 2 field element.
            const a = Field.fromString("2field");
            // Create the inverse of the 2 field element.
            const ainv = a.inverse();
            // Create another 2 scale element.
            const b = Field.fromString("2field");
            // Double the field through addition.
            const c = a.add(b);
            // Double the field through the double operation.
            const d = a.double();
            // Create the 8 field from string.
            const eight = Field.fromString("8field");
            // Create the 0 field.
            const zero = Field.zero();
            // Create the 0 field through adding a and ainv.
            const zero_inv = a.add(ainv);
            // Create the zero element through subtraction (same operation as a + ainv).
            const zero_sub = a.subtract(b);
            // Take the 2 element to the power 4.
            const two_power_four = a.pow(c);
            // Multiply the two element by the 8 element.
            const two_times_eight = a.multiply(eight);
            // Ensure two elements of the same value are equal.
            expect(a.equals(b)).equal(true);
            // Ensure adding 2 same valued elements and the doubling operation lead to the same value.
            expect(c.equals(d)).equal(true);
            // Ensure that a + ainv i zero.
            expect(zero_inv.equals(zero)).equal(true);
            // Ensure that 2 - 2 (i.e. 2 + inv(2)) == 0.
            expect(zero_sub.equals(zero)).equal(true);
            // Ensure 2^4 & 2*8 are equal.
            expect(two_power_four.equals(two_times_eight)).equal(true);
        });

        it('Check boolean creation and serialization', () => {
            const t = Boolean.fromString("true");
            const f = Boolean.fromString("false");

            expect(t.toString()).equals("true");
            expect(f.toString()).equals("false");

            const tBytes = t.toBytesLe();
            const fBytes = f.toBytesLe();

            const tFromBytes = Boolean.fromBytesLe(tBytes);
            const fFromBytes = Boolean.fromBytesLe(fBytes);

            expect(t.equals(tFromBytes)).equals(true);
            expect(f.equals(fFromBytes)).equals(true);

            const tBits = t.toBitsLe();
            const fBits = f.toBitsLe();

            const tFromBits = Boolean.fromBitsLe(tBits);
            const fFromBits = Boolean.fromBitsLe(fBits);

            expect(t.equals(tFromBits)).equals(true);
            expect(f.equals(fFromBits)).equals(true);
        });

        it('Check boolean logical operations', () => {
            const t = new Boolean(true);
            const f = new Boolean(false);

            expect(t.not().toString()).equals("false");
            expect(f.not().toString()).equals("true");

            expect(t.and(t).toString()).equals("true");
            expect(t.and(f).toString()).equals("false");
            expect(f.and(f).toString()).equals("false");

            expect(t.or(t).toString()).equals("true");
            expect(t.or(f).toString()).equals("true");
            expect(f.or(f).toString()).equals("false");

            expect(t.xor(t).toString()).equals("false");
            expect(t.xor(f).toString()).equals("true");
            expect(f.xor(f).toString()).equals("false");

            expect(t.nand(t).toString()).equals("false");
            expect(t.nand(f).toString()).equals("true");

            expect(f.nor(f).toString()).equals("true");
            expect(t.nor(f).toString()).equals("false");
        });

        it('Check I8 serialization and arithmetic', () => {
            const i8 = I8.fromString("42i8");
            const i8Clone = i8.clone();

            expect(i8.toString()).equals("42i8");
            expect(i8Clone.equals(i8)).equal(true);

            const i8Bytes = i8.toBytesLe();
            const i8FromBytes = I8.fromBytesLe(i8Bytes);
            expect(i8.equals(i8FromBytes)).equal(true);

            const i8Bits = i8.toBitsLe();
            const i8FromBits = I8.fromBitsLe(i8Bits);
            expect(i8.equals(i8FromBits)).equal(true);

            const sum = i8.addWrapped(i8);
            const diff = i8.subWrapped(i8);
            const prod = i8.mulWrapped(i8);
            const quot = i8.divWrapped(i8);

            expect(I8.fromString("0i8").neg().toString()).equal("0i8");
            expect(I8.fromString("-42i8").neg().toString()).equal("42i8");

            expect(sum.toString()).equals("84i8");
            expect(diff.toString()).equals("0i8");
            expect(prod.toString()).equals("-28i8");
            expect(quot.toString()).equals("1i8");

            const int = I8.fromString("42i8");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42i8");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const i8FromFields = I8.fromFields(arr);
            expect(i8FromFields.toString()).equal("12i8");

            const a = I8.fromString("7i8");
            const b = I8.fromString("3i8");

            expect(a.rem(b).toString()).equal("1i8");
            expect(a.remWrapped(b).toString()).equal("1i8");

            const base = I8.fromString("2i8");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i8");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i8");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i8");
        });

        it('Check I16 serialization and arithmetic', () => {
            const i16 = I16.fromString("42i16");
            const i16Clone = i16.clone();

            expect(i16.toString()).equals("42i16");
            expect(i16Clone.equals(i16)).equal(true);

            const i16Bytes = i16.toBytesLe();
            const i16FromBytes = I16.fromBytesLe(i16Bytes);
            expect(i16.equals(i16FromBytes)).equal(true);

            const i16Bits = i16.toBitsLe();
            const i16FromBits = I16.fromBitsLe(i16Bits);
            expect(i16.equals(i16FromBits)).equal(true);

            const sum = i16.addWrapped(i16);
            const diff = i16.subWrapped(i16);
            const prod = i16.mulWrapped(i16);
            const quot = i16.divWrapped(i16);

            expect(I16.fromString("0i16").neg().toString()).equal("0i16");
            expect(I16.fromString("-42i16").neg().toString()).equal("42i16");

            expect(sum.toString()).equals("84i16");
            expect(diff.toString()).equals("0i16");
            expect(prod.toString()).equals("1764i16");
            expect(quot.toString()).equals("1i16");

            const int = I16.fromString("42i16");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42i16");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const i16FromFields = I16.fromFields(arr);
            expect(i16FromFields.toString()).equal("12i16");

            const a = I16.fromString("7i16");
            const b = I16.fromString("3i16");

            expect(a.rem(b).toString()).equal("1i16");
            expect(a.remWrapped(b).toString()).equal("1i16");

            const base = I16.fromString("2i16");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i16");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i16");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i16");
        });

        it('Check I32 serialization and arithmetic', () => {
            const i32 = I32.fromString("42i32");
            const i32Clone = i32.clone();

            expect(i32.toString()).equals("42i32");
            expect(i32Clone.equals(i32)).equal(true);

            const i32Bytes = i32.toBytesLe();
            const i32FromBytes = I32.fromBytesLe(i32Bytes);
            expect(i32.equals(i32FromBytes)).equal(true);

            const i32Bits = i32.toBitsLe();
            const i32FromBits = I32.fromBitsLe(i32Bits);
            expect(i32.equals(i32FromBits)).equal(true);

            const sum = i32.addWrapped(i32);
            const diff = i32.subWrapped(i32);
            const prod = i32.mulWrapped(i32);
            const quot = i32.divWrapped(i32);

            expect(I32.fromString("0i32").neg().toString()).equal("0i32");
            expect(I32.fromString("-42i32").neg().toString()).equal("42i32");

            expect(sum.toString()).equals("84i32");
            expect(diff.toString()).equals("0i32");
            expect(prod.toString()).equals("1764i32");
            expect(quot.toString()).equals("1i32");

            const int = I32.fromString("42i32");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42i32");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const i32FromFields = I32.fromFields(arr);
            expect(i32FromFields.toString()).equal("12i32");

            const a = I32.fromString("7i32");
            const b = I32.fromString("3i32");

            expect(a.rem(b).toString()).equal("1i32");
            expect(a.remWrapped(b).toString()).equal("1i32");

            const base = I32.fromString("2i32");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i32");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i32");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i32");
        });

        it('Check I64 serialization and arithmetic', () => {
            const i64 = I64.fromString("42i64");
            const i64Clone = i64.clone();

            expect(i64.toString()).equals("42i64");
            expect(i64Clone.equals(i64)).equal(true);

            const i64Bytes = i64.toBytesLe();
            const i64FromBytes = I64.fromBytesLe(i64Bytes);
            expect(i64.equals(i64FromBytes)).equal(true);

            const i64Bits = i64.toBitsLe();
            const i64FromBits = I64.fromBitsLe(i64Bits);
            expect(i64.equals(i64FromBits)).equal(true);

            const sum = i64.addWrapped(i64);
            const diff = i64.subWrapped(i64);
            const prod = i64.mulWrapped(i64);
            const quot = i64.divWrapped(i64);

            expect(I64.fromString("0i64").neg().toString()).equal("0i64");
            expect(I64.fromString("-42i64").neg().toString()).equal("42i64");

            expect(sum.toString()).equals("84i64");
            expect(diff.toString()).equals("0i64");
            expect(prod.toString()).equals("1764i64");
            expect(quot.toString()).equals("1i64");

            const int = I64.fromString("42i64");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42i64");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const i64FromFields = I64.fromFields(arr);
            expect(i64FromFields.toString()).equal("12i64");

            const a = I64.fromString("7i64");
            const b = I64.fromString("3i64");

            expect(a.rem(b).toString()).equal("1i64");
            expect(a.remWrapped(b).toString()).equal("1i64");

            const base = I64.fromString("2i64");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i64");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i64");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i64");
        });

        it('Check I128 serialization and arithmetic', () => {
            const i128 = I128.fromString("42i128");
            const i128Clone = i128.clone();

            expect(i128.toString()).equals("42i128");
            expect(i128Clone.equals(i128)).equal(true);

            const i128Bytes = i128.toBytesLe();
            const i128FromBytes = I128.fromBytesLe(i128Bytes);
            expect(i128.equals(i128FromBytes)).equal(true);

            const i128Bits = i128.toBitsLe();
            const i128FromBits = I128.fromBitsLe(i128Bits);
            expect(i128.equals(i128FromBits)).equal(true);

            const sum = i128.addWrapped(i128);
            const diff = i128.subWrapped(i128);
            const prod = i128.mulWrapped(i128);
            const quot = i128.divWrapped(i128);

            expect(I128.fromString("0i128").neg().toString()).equal("0i128");
            expect(I128.fromString("-42i128").neg().toString()).equal("42i128");

            expect(sum.toString()).equals("84i128");
            expect(diff.toString()).equals("0i128");
            expect(prod.toString()).equals("1764i128");
            expect(quot.toString()).equals("1i128");

            const int = I128.fromString("42i128");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42i128");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const i128FromFields = I128.fromFields(arr);
            expect(i128FromFields.toString()).equal("12i128");

            const a = I128.fromString("7i128");
            const b = I128.fromString("3i128");

            expect(a.rem(b).toString()).equal("1i128");
            expect(a.remWrapped(b).toString()).equal("1i128");

            const base = I128.fromString("2i128");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i128");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i128");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i128");
        });

        it('Check U8 serialization and arithmetic', () => {
            const u8 = U8.fromString("42u8");
            const u8Clone = u8.clone();

            expect(u8.toString()).equals("42u8");
            expect(u8Clone.equals(u8)).equal(true);

            const u8Bytes = u8.toBytesLe();
            const u8FromBytes = U8.fromBytesLe(u8Bytes);
            expect(u8.equals(u8FromBytes)).equal(true);

            const u8Bits = u8.toBitsLe();
            const u8FromBits = U8.fromBitsLe(u8Bits);
            expect(u8.equals(u8FromBits)).equal(true);

            const sum = u8.addWrapped(u8);
            const diff = u8.subWrapped(u8);
            const prod = u8.mulWrapped(u8);
            const quot = u8.divWrapped(u8);

            expect(sum.toString()).equals("84u8");
            expect(diff.toString()).equals("0u8");
            expect(prod.toString()).equals("228u8");
            expect(quot.toString()).equals("1u8");

            const int = U8.fromString("42u8");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42u8");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const u8FromFields = U8.fromFields(arr);
            expect(u8FromFields.toString()).equal("12u8");

            const a = U8.fromString("7u8");
            const b = U8.fromString("3u8");

            expect(a.rem(b).toString()).equal("1u8");
            expect(a.remWrapped(b).toString()).equal("1u8");

            const base = U8.fromString("2u8");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8u8");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8u8");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8u8");
        });

        it('Check U16 serialization and arithmetic', () => {
            const u16 = U16.fromString("42u16");
            const u16Clone = u16.clone();

            expect(u16.toString()).equals("42u16");
            expect(u16Clone.equals(u16)).equal(true);

            const u16Bytes = u16.toBytesLe();
            const u16FromBytes = U16.fromBytesLe(u16Bytes);
            expect(u16.equals(u16FromBytes)).equal(true);

            const u16Bits = u16.toBitsLe();
            const u16FromBits = U16.fromBitsLe(u16Bits);
            expect(u16.equals(u16FromBits)).equal(true);

            const sum = u16.addWrapped(u16);
            const diff = u16.subWrapped(u16);
            const prod = u16.mulWrapped(u16);
            const quot = u16.divWrapped(u16);

            expect(sum.toString()).equals("84u16");
            expect(diff.toString()).equals("0u16");
            expect(prod.toString()).equals("1764u16");
            expect(quot.toString()).equals("1u16");

            const int = U16.fromString("42u16");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42u16");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const u16FromFields = U16.fromFields(arr);
            expect(u16FromFields.toString()).equal("12u16");

            const a = U16.fromString("7u16");
            const b = U16.fromString("3u16");

            expect(a.rem(b).toString()).equal("1u16");
            expect(a.remWrapped(b).toString()).equal("1u16");

            const base = U16.fromString("2u16");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8u16");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8u16");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8u16");
        });

        it('Check U32 serialization and arithmetic', () => {
            const u32 = U32.fromString("42u32");
            const u32Clone = u32.clone();

            expect(u32.toString()).equals("42u32");
            expect(u32Clone.equals(u32)).equal(true);

            const u32Bytes = u32.toBytesLe();
            const u32FromBytes = U32.fromBytesLe(u32Bytes);
            expect(u32.equals(u32FromBytes)).equal(true);

            const u32Bits = u32.toBitsLe();
            const u32FromBits = U32.fromBitsLe(u32Bits);
            expect(u32.equals(u32FromBits)).equal(true);

            const sum = u32.addWrapped(u32);
            const diff = u32.subWrapped(u32);
            const prod = u32.mulWrapped(u32);
            const quot = u32.divWrapped(u32);

            expect(sum.toString()).equals("84u32");
            expect(diff.toString()).equals("0u32");
            expect(prod.toString()).equals("1764u32");
            expect(quot.toString()).equals("1u32");

            const int = U32.fromString("42u32");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42u32");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const u32FromFields = U32.fromFields(arr);
            expect(u32FromFields.toString()).equal("12u32");

            const a = U32.fromString("7u32");
            const b = U32.fromString("3u32");

            expect(a.rem(b).toString()).equal("1u32");
            expect(a.remWrapped(b).toString()).equal("1u32");

            const base = U32.fromString("2u32");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8u32");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8u32");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8u32");
        });


        it('Check U64 serialization and arithmetic', () => {
            const u64 = U64.fromString("42u64");
            const u64Clone = u64.clone();

            expect(u64.toString()).equals("42u64");
            expect(u64Clone.equals(u64)).equal(true);

            const u64Bytes = u64.toBytesLe();
            const u64FromBytes = U64.fromBytesLe(u64Bytes);
            expect(u64.equals(u64FromBytes)).equal(true);

            const u64Bits = u64.toBitsLe();
            const u64FromBits = U64.fromBitsLe(u64Bits);
            expect(u64.equals(u64FromBits)).equal(true);

            const sum = u64.addWrapped(u64);
            const diff = u64.subWrapped(u64);
            const prod = u64.mulWrapped(u64);
            const quot = u64.divWrapped(u64);

            expect(sum.toString()).equals("84u64");
            expect(diff.toString()).equals("0u64");
            expect(prod.toString()).equals("1764u64");
            expect(quot.toString()).equals("1u64");

            const int = U64.fromString("42u64");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42u64");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const u64FromFields = U64.fromFields(arr);
            expect(u64FromFields.toString()).equal("12u64");

            const a = U64.fromString("7u64");
            const b = U64.fromString("3u64");

            expect(a.rem(b).toString()).equal("1u64");
            expect(a.remWrapped(b).toString()).equal("1u64");

            const base = U64.fromString("2u64");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8u64");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8u64");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8u64");
        });

        it('Check U128 serialization and arithmetic', () => {
            const u128 = U128.fromString("42u128");
            const u128Clone = u128.clone();

            expect(u128.toString()).equals("42u128");
            expect(u128Clone.equals(u128)).equal(true);

            const u128Bytes = u128.toBytesLe();
            const u128FromBytes = U128.fromBytesLe(u128Bytes);
            expect(u128.equals(u128FromBytes)).equal(true);

            const u128Bits = u128.toBitsLe();
            const u128FromBits = U128.fromBitsLe(u128Bits);
            expect(u128.equals(u128FromBits)).equal(true);

            const sum = u128.addWrapped(u128);
            const diff = u128.subWrapped(u128);
            const prod = u128.mulWrapped(u128);
            const quot = u128.divWrapped(u128);

            expect(sum.toString()).equals("84u128");
            expect(diff.toString()).equals("0u128");
            expect(prod.toString()).equals("1764u128");
            expect(quot.toString()).equals("1u128");

            const int = U128.fromString("42u128");
            const plaintext = int.toPlaintext();
            expect(plaintext.toString()).equal("42u128");

            const f = Field.fromString("12field");
            const arr = new Array();
            arr.push(f.toString());
            const u128FromFields = U128.fromFields(arr);
            expect(u128FromFields.toString()).equal("12u128");

            const a = U128.fromString("7u128");
            const b = U128.fromString("3u128");

            expect(a.rem(b).toString()).equal("1u128");
            expect(a.remWrapped(b).toString()).equal("1u128");

            const base = U128.fromString("2u128");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8u128");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8u128");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8u128");
        });

        it('Check scalar field arithmetic', () => {
            // Create the 2 scalar element.
            const a = Scalar.fromString("2scalar");
            // Create the inverse of the 2 scalar element.
            const ainv = a.inverse();
            // Create another 2 scale element.
            const b = Scalar.fromString("2scalar");
            // Double the scalar through addition.
            const c = a.add(b);
            // Double the scalar through the double operation.
            const d = a.double();
            // Create the 8 scalar from string.
            const eight = Scalar.fromString("8scalar");
            // Create the 0 scalar.
            const zero = Scalar.zero();
            // Create the 0 scalar through adding a and ainv.
            const zero_inv = a.add(ainv);
            // Create the zero element through subtraction (same operation as a + ainv).
            const zero_sub = a.subtract(b);
            // Take the 2 element to the power 4.
            const two_power_four = a.pow(c);
            // Multiply the two element by the 8 element.
            const two_times_eight = a.multiply(eight);
            // Ensure two elements of the same value are equal.
            expect(a.equals(b)).equal(true);
            // Ensure adding 2 same valued elements and the doubling operation lead to the same value.
            expect(c.equals(d)).equal(true);
            // Ensure that a + ainv i zero.
            expect(zero_inv.equals(zero)).equal(true);
            // Ensure that 2 - 2 (i.e. 2 + inv(2)) == 0.
            expect(zero_sub.equals(zero)).equal(true);
            // Ensure 2^4 & 2*8 are equal.
            expect(two_power_four.equals(two_times_eight)).equal(true);
        });

        it('Test group operations', () => {
            // Get the 2 element of the group.
            const G = Group.fromString("2group");
            // Get the point at infinity (i.e. "0"/additive identity in elliptic curves).
            const Ginf = Group.zero();
            // Get a 2 element of the scalar field.
            const a = Scalar.fromString("2scalar");
            // Double the point through addition.
            const b = G.add(G);
            // Double the point through the addition operation.
            const c = G.double();
            // Do a point doubling through scalar multiplication.
            const d = G.scalarMultiply(a);
            // Find point (x, -y)
            const G_inv= G.inverse();
            // Ensure addition and doubling landed on the same point.
            expect(b.equals(c)).equals(true);
            // Ensure point doubling and scalar multiplication by 2scalar ends up as the same element as doubling.
            expect(c.equals(d)).equals(true);
            // Ensure adding the inverse element leads to the point at infinity.
            expect((G.add(G_inv)).equals(Ginf)).equals(true);
        });

        it('Ensure bit and byte serialization is correctly implemented', () => {
            // Create the chosen generators.
            const G = Group.generator();
            const a = Scalar.fromString(ScalarGenerator);
            const f = Field.fromString(FieldGenerator);

            // Serialize the algebraic objects to bytes.
            const GBytesLe = G.toBytesLe();
            const aBytesLe = a.toBytesLe();
            const fBytesLe = f.toBytesLe();

            // Serialize the algebraic objects to bits.
            const GBits = G.toBitsLe();
            const aBits = a.toBitsLe();
            const fBits = f.toBitsLe();

            // Deserialize the bytes to the original algebraic objects.
            const GDeserializedBytes = Group.fromBytesLe(GBytesLe).toString();
            const aDeserializedBytes = Scalar.fromBytesLe(aBytesLe).toString();
            const fDeserializedBytes = Field.fromBytesLe(fBytesLe).toString();

            // Deserialize the bits to the original algebraic objects.
            const GDeserializedBits = Group.fromBitsLe(GBits).toString();
            const aDeserializedBits = Scalar.fromBitsLe(aBits).toString();
            const fDeserializedBits = Field.fromBitsLe(fBits).toString();

            // Ensure the deserialized objects are the same as the original objects.
            expect(GDeserializedBytes).equals(GroupGenerator);
            expect(aDeserializedBytes).equals(ScalarGenerator);
            expect(fDeserializedBytes).equals(FieldGenerator);
            expect(GDeserializedBits).equals(GroupGenerator);
            expect(aDeserializedBits).equals(ScalarGenerator);
            expect(fDeserializedBits).equals(FieldGenerator);
        });
    });
});
