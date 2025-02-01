program nft_data.aleo {

    ///////////////////////////////
    ///// ---- MAPPINGS ---- /////
    ///////////////////////////////

    //--ARC-721 Standard Mappings--//

    // Mapping determining if an NFT has been previously minted.
    mapping nft_commits: field => boolean;

    // Mapping to determine a public owner of an NFT
    mapping nft_owner: field => address;

    //--Application Specific Mappings--//

    // Mapping of the NFT commits to their corresponding combo rule.
    mapping combo_rules: field => ComboRule;

    // Public mapping to determine the owner of a particular NFT.
    mapping public_owners: field => address;


    ///////////////////////////////
    ///// ----- STRUCTS ----- /////
    ///////////////////////////////


    //--ARC-721 Standard Structs--//

    // Description of a unique NFT "attribute" in string form describing the "type" of the attribute and its value.
    // "value" is a reserved keyword, so _value is used instead.
    struct attribute {
        trait_type: [field; 4],
        _value: [field; 4],
    }

    // NFT Data 
    struct data {
        metadata: [field; 4], // URI of offchain metadata JSON (124 bytes available)
        class: u16, // The class of the NFT (allows 2^16 different "classes" of NFTs to enable leveling & trading mechanics)
        earned_points: u32 // The number of points the NFT has earned (allowing for NFT "actions" to earn redeemable points)
    }

    //--Application Specific Structs--//

    struct SourceRule {
        source_class: field,
        number_required: u8,
    }

    struct ComboRule {
        source_rules: [SourceRule; 4],
        target_class: field,
    }


    ///////////////////////////////
    ///// ----- RECORDS ----- /////
    ///////////////////////////////


    //--ARC-721 Standard Records--//

    record NFT {
        owner: address,
        data: data,
        edition: scalar,
    }

    ///////////////////////////////
    ///// ---- FUNCTIONS ---- /////
    ///////////////////////////////

    //--ARC-721 Standard Functions--//

    /// NFT Functions (closures that do not generate transitions).
    inline commit_nft(
        nft_data: data,
        nft_edition: scalar
    ) -> field {
        let data_hash: field = BHP256::hash_to_field(nft_data);
        let nft_commit: field = BHP256::commit_to_field(data_hash, nft_edition);
        return nft_commit;
    }

    ///////////////////////////////
    ///// --- TRANSITIONS --- /////
    ///////////////////////////////

    async transition mint_duck(public class: field) -> (DuckNFT, Future) {
        let new_duck: DuckNFT = DuckNFT {
            owner: self.caller,
            duck_id,
        };

        // Return the new duck and a future that finalizes the mint.
        return (new_duck, finalize_mint(duck_id, self.caller));
    }

    // The finalize_mint async function will do the mapping operations:
    // - Read current owner from mapping
    // - Check if the duck is unowned
    // - Set the new owner
    async function finalize_mint(duck_id: field, new_owner: address) {
        let zero_owner: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;

        // Now we can safely use Mapping::get_or_use here.
        let current_owner: address = Mapping::get_or_use(duck_owners, duck_id, zero_owner);

        // Ensure this duck is not already owned.
        assert_eq(current_owner, zero_owner);

        // Assign the duck to the caller.
        Mapping::set(duck_owners, duck_id, new_owner);
    }
    

}
