import sinon from "sinon";
import { expect } from "chai";
import { Field, Scalar, Group, Boolean, I8, I16, I32, U8, U16, U32} from "../src/node.js";
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

        it('Check integer serialization and arithmetic', () => {
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
            const i16 = I16.fromFields(arr);
            expect(i16.toString()).equal("12i16");

            const a = I8.fromString("7i8");
            const b = I8.fromString("3i8");

            expect(a.rem(b).toString()).equal("1i8");
            expect(a.remWrapped(b).toString()).equal("1i8");

            const base = I8.fromString("2i8");
            expect(base.powU8(U8.fromString("3u8")).toString()).equal("8i8");
            expect(base.powU16(U16.fromString("3u16")).toString()).equal("8i8");
            expect(base.powU32(U32.fromString("3u32")).toString()).equal("8i8");
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
