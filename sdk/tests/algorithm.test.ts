import sinon from "sinon";
import { expect } from "chai";
import { Field, Group, Scalar, BHP256, BHP512, BHP768, BHP1024, Pedersen64, Pedersen128, Poseidon2, Poseidon4, Poseidon8 } from "@provablehq/sdk/%%NETWORK%%.js";
import * as algebraicData from "./data/algebra.js";

const Fg = Field.fromString(algebraicData.FieldGenerator);
const F2 = Fg.multiply(Fg);
const F3 = F2.multiply(Fg);
const F4 = F3.multiply(Fg);
const SFg = Scalar.fromString(algebraicData.ScalarGenerator);
const fieldArray = [Fg, F2, F3, F4];
const finiteFieldBytes = fieldArray.map(field => field.toBitsLe()).flat();

function deepCopyFieldArray(array: Field[]): Field[] {
    return array.map(item => item.clone());
}

describe('Hash Function Export Tests', () => {
    afterEach(() => {
        sinon.restore();
    });

    describe('BHP Hasher Tests', () => {
        it('Check BHP Hashers hash to expected values.', () => {
            // Create all BHP hashers.
            const BHP256Hasher = new BHP256();
            const BHP512Hasher = new BHP512();
            const BHP768Hasher = new BHP768();
            const BHP1024Hasher = new BHP1024();

            // Run all possible operations for BHP256.
            expect(BHP256Hasher.hash(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP256Hash);
            expect(BHP256Hasher.hashToGroup(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP256HashToGroup);
            expect(BHP256Hasher.commit(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP256Commit);
            expect(BHP256Hasher.commitToGroup(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP256CommitToGroup);

            // Run all possible operations for BHP512.
            expect(BHP512Hasher.hash(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP512Hash);
            expect(BHP512Hasher.hashToGroup(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP512HashToGroup);
            expect(BHP512Hasher.commit(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP512Commit);
            expect(BHP512Hasher.commitToGroup(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP512CommitToGroup);

            // Run all possible operations for BHP768.
            expect(BHP768Hasher.hash(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP768Hash);
            expect(BHP768Hasher.hashToGroup(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP768HashToGroup);
            expect(BHP768Hasher.commit(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP768Commit);
            expect(BHP768Hasher.commitToGroup(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP768CommitToGroup);

            // Run all possible operations for BHP1024.
            expect(BHP1024Hasher.hash(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP1024Hash);
            expect(BHP1024Hasher.hashToGroup(finiteFieldBytes).toString()).equals(algebraicData.expectedBHP1024HashToGroup);
            expect(BHP1024Hasher.commit(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP1024Commit);
            expect(BHP1024Hasher.commitToGroup(finiteFieldBytes, SFg.clone()).toString()).equals(algebraicData.expectedBHP1024CommitToGroup);
        });

        it('Check Pedersen hashers hash to expected values', () => {
            // Create all Pedersen hashers.
            const Pedersen64Hasher = new Pedersen64();
            const Pedersen128Hasher = new Pedersen128();

            // Create a bit array which is 2 2u32 elements concatenated.
            const bitArray = [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

            // Run all possible operations for Pedersen64.
            expect(Pedersen64Hasher.hash(bitArray).toString()).equals(algebraicData.expectedPedersen64Hash);
            expect(Pedersen64Hasher.commit(bitArray, SFg.clone()).toString()).equals(algebraicData.expectedPedersen64Commit);
            expect(Pedersen64Hasher.commitToGroup(bitArray, SFg.clone()).toString()).equals(algebraicData.expectedPedersen64CommitToGroup);

            // Run all possible operations for Pedersen128.
            expect(Pedersen128Hasher.hash(bitArray).toString()).equals(algebraicData.expectedPedersen128Hash);
            expect(Pedersen128Hasher.commit(bitArray, SFg.clone()).toString()).equals(algebraicData.expectedPedersen128Commit);
            expect(Pedersen128Hasher.commitToGroup(bitArray, SFg.clone()).toString()).equals(algebraicData.expectedPedersen128CommitToGroup);
        });

        it('Check Poseidon hashers hash to expected values', () => {
            // Create all Poseidon hashers.
            const Poseidon2Hasher = new Poseidon2();
            const Poseidon4Hasher = new Poseidon4();
            const Poseidon8Hasher = new Poseidon8();

            // Run all possible operations for Poseidon2.
            expect(Poseidon2Hasher.hash(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon2Hash);
            expect(Poseidon2Hasher.hashToScalar(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon2HashToScalar);
            expect(Poseidon2Hasher.hashToGroup(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon2HashToGroup);
            expect(Poseidon2Hasher.hashMany(deepCopyFieldArray(fieldArray), 2).map(field => field.toString())).deep.equals(algebraicData.expectedPoseidon2HashMany);

            // Run all possible operations for Poseidon4.
            expect(Poseidon4Hasher.hash(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon4Hash);
            expect(Poseidon4Hasher.hashToScalar(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon4HashToScalar);
            expect(Poseidon4Hasher.hashToGroup(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon4HashToGroup);
            expect(Poseidon4Hasher.hashMany(deepCopyFieldArray(fieldArray), 2).map(field => field.toString())).deep.equals(algebraicData.expectedPoseidon4HashMany);

            // Run all possible operations for Poseidon8.
            expect(Poseidon8Hasher.hash(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon8Hash);
            expect(Poseidon8Hasher.hashToScalar(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon8HashToScalar);
            expect(Poseidon8Hasher.hashToGroup(deepCopyFieldArray(fieldArray)).toString()).equals(algebraicData.expectedPoseidon8HashToGroup);
            expect(Poseidon8Hasher.hashMany(deepCopyFieldArray(fieldArray), 2).map(field => field.toString())).deep.equals(algebraicData.expectedPoseidon8HashMany);
        });
    });
});
