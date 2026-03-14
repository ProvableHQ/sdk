import { expect } from "chai";
import { Address } from "../dist/node.js"

const beaconAddressString = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
const creditsAddressString = "aleo1lqmly7ez2k48ajf5hs92ulphaqr05qm4n8qwzj8v0yprmasgpqgsez59gg";

describe('Address', () => {
    describe('fromProgramId', () => {
        it('converts credits.aleo to the expected address', () => {
            const address = Address.fromProgramId("credits.aleo");
            expect(address.to_string()).equal(creditsAddressString);
        });
    });

    describe('isValid', () => {
        it('returns true for a valid address string', () => {
            expect(Address.isValid(beaconAddressString)).equal(true);
        });

        it('returns false for invalid address strings', () => {
            expect(Address.isValid('invalid_address')).equal(false);
            expect(Address.isValid('aleo1xyz')).equal(false);
            expect(Address.isValid('')).equal(false);
        });

        it('returns true for valid address bytes', () => {
            const address = Address.from_string(beaconAddressString);
            const bytes = address.toBytesLe();
            expect(Address.isValid(bytes)).equal(true);
        });

        it('returns false for invalid address bytes', () => {
            expect(Address.isValid(new Uint8Array([1, 2, 3]))).equal(false);
            expect(Address.isValid(new Uint8Array([]))).equal(false);
        });
    });
});
