program emo_ducks.aleo {


    ///////////////////////////////
    ///// ----- STRUCTS ----- /////
    ///////////////////////////////


    //// ----- ARC-721 Standard Structs ----- //

    // Struct representing prior approvals to transfer.
    struct approval {
        approver: address,
        spender: address
    }

    // Description of a unique NFT "attribute" in string form describing the "type" of the attribute and its value.
    // "value" is a reserved keyword, so _value is used instead.
    struct attribute {
        trait_type: [field; 4],
        _value: [field; 4],
    }

    // NFT Specific Data.
    struct data {
        metadata: [field; 4], // URI of offchain metadata JSON (124 bytes available)
        uri: [field; 4], // URI of the NFT image (124 bytes available)
        baby: field,
        mania: field,
        sadness: field,
    }

    // A public representation of the NFT content.
    struct nft_content {
        data: data,
        edition: scalar
    }

    ///// ----- Application Specific Structs ----- //

    // A rule specifying how many of a specific class of an NFT are required to make a new NFT.
    struct source_rule {
        source_class: u16, // The source class of the NFT to be traded or burned.
        number_required: u8, // The number of NFTs of the class that need to be traded or burned.
    }

    // A series of combinations of multiple classes that need to be traded or burned.
    struct combo_rule {
        source_rules: [source_rule; 4],
        target_class: u16,
    }

    ///////////////////////////////
    ///// ---- MAPPINGS ---- /////
    ///////////////////////////////


    ///// -----ARC-721 Standard Mappings ----- /////

    // Approval hash => Is approved
    mapping for_all_approvals: field => bool; 

    // Store general settings for the NFT (https://github.com/ProvableHQ/ARCs/tree/master/arc-0721#settings)
    mapping general_settings: u8 => field;

    // NFT commit => Approval hash
    mapping nft_approvals: field => field;

    // Stores a commitment to NFT data that determines whether or not an NFT has been minted.
    mapping nft_commits: field => bool;

    // Stores public NFT content.
    mapping nft_contents: field => nft_content;

    // Stores the public owners of an NFT.
    mapping nft_owners: field => address;

    ///// ----- Application Specific Mappings ----- /////

    // -- Administrative Mappings -- //
    // These mappings can only be set by the owner of the NFT collection.

    // Mapping of the NFT unique ids (commits) to a "combo_rule". 
    mapping combo_rules: field => combo_rule;

    // Maximum number of mints allowed for a specific class of NFT.
    mapping max_mints: field => u64;

    // The number of mints for a specific class of NFT.
    mapping num_mints: field => u64;

    ///////////////////////////////
    ///// ----- RECORDS ----- /////
    ///////////////////////////////


    /////--ARC-721 Standard Records--/////

    // The standard representation of an NFT within ARC-721.
    record NFT {
        owner: address,
        data: data,
        edition: scalar,
    }

    // The record that allows a private NFT transfer to be communicated to a public recipient.
    record NFTView {
        private owner: address,
        private data: data,
        private edition: scalar,
        private is_view: bool
    }


    ///////////////////////////////
    ///// ---- FUNCTIONS ---- /////
    ///////////////////////////////


    /////--ARC-721 Standard Functions--/////

    // Commit the NFT data to a field element creating a unique ID for the NFT.
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


    /////--ARC-721 Standard Transitions--/////

    //--Transfer Functions--//

    // Transfer an NFT privately.
    transition transfer_private(
        private nft: NFT,
        private to: address,
    ) -> NFT {
        return NFT {
            owner: to,
            data: nft.data,
            edition: nft.edition,
        };
    }

    // Transfer an NFT publicly, this can be called by a foreign function.
    async transition transfer_public(
        private nft_data: data,
        private nft_edition: scalar,
        public to: address,
    ) -> (NFTView, Future) {
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let caller: address = self.caller;
        let nft_view: NFTView = NFTView {
            owner: to,
            data: nft_data,
            edition: nft_edition,
            is_view: true
        };
        let transfer_public_future: Future = finalize_transfer_public(
             to, nft_commit, caller,
        );
        return (
            nft_view,
            transfer_public_future
        );
    }
    async function finalize_transfer_public(
        to: address,
        nft_commit: field,
        caller: address,
    ) {
        let owner: address = nft_owners.get(nft_commit);
        assert_eq(caller, owner);
        nft_approvals.remove(nft_commit);
        nft_owners.set(nft_commit, to);
    }

    // Transfer an NFT publicly and ensure the caller is the signer.
    async transition transfer_public_as_signer(
        private nft_data: data,
        private nft_edition: scalar,
        public to: address,
    ) -> (NFTView, Future) {
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let signer: address = self.signer;
        let nft_view: NFTView = NFTView {
            owner: to,
            data: nft_data,
            edition: nft_edition,
            is_view: true
        };
        let transfer_public_as_signer_future: Future = finalize_transfer_public_as_signer(
             to, nft_commit, signer,
        );
        return (
            nft_view,
            transfer_public_as_signer_future
        );
    }
    async function finalize_transfer_public_as_signer(
        to: address,
        nft_commit: field,
        signer: address,
    ) {
        let owner: address = nft_owners.get(nft_commit);
        assert_eq(signer, owner);
        nft_approvals.remove(nft_commit);
        nft_owners.set(nft_commit, to);
    }
    
    // Transfer a private NFT to a public address.
    async transition transfer_private_to_public(
        private nft: NFT,
        public to: address,
    ) -> (NFTView, Future) {
        let nft_commit: field = commit_nft(nft.data, nft.edition);
        
        let nft_view: NFTView = NFTView {
            owner: to,
            data: nft.data,
            edition: nft.edition,
            is_view: true
        };
        
        let transfer_private_to_public_future: Future =
            finalize_transfer_private_to_public(
                to, nft_commit
            );
        
        return (
            nft_view,
            transfer_private_to_public_future
        );
    }
    // Finally, set the mapping storing the public NFT ownership.
    async function finalize_transfer_private_to_public(
        to: address,
        nft_commit: field,
    ){
        nft_owners.set(
            nft_commit,
            to
        );
    }

    // Transfer a public NFT to a private NFT.
    async transition transfer_public_to_private(
        private nft_data: data,
        private nft_edition: scalar,
        private to: address,
    ) -> (NFT, Future) {
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let caller: address = self.caller;
        let finalize_future: Future = finalize_transfer_public_to_private(
            caller, nft_commit,
        );
        let received_nft: NFT = NFT {
            owner: to,
            data: nft_data,
            edition: nft_edition,
        };
        return (received_nft, finalize_future);
    }
    async function finalize_transfer_public_to_private(
        caller: address,
        nft_commit: field,
    ){
        let owner: address = nft_owners.get(nft_commit);
        assert_eq(caller, owner);
        nft_approvals.remove(nft_commit);
        nft_owners.remove(nft_commit);
    }

    //--Arc-721 Utility Functions--//

    // Publish NFT content publicly.
    async transition publish_nft_content(
       public nft_data: data,
        public nft_edition: scalar,
    ) -> Future {
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let publish_nft_content_future: Future = finalize_publish_nft_content(
            nft_commit,
            nft_data,
            nft_edition,
        );
        return publish_nft_content_future;
    }
    // Set the contents on chain.
    async function finalize_publish_nft_content(
        nft_commit: field,
        nft_data: data,
        nft_edition: scalar,
    ) {
        let public_data: nft_content = nft_content {
            data: nft_data,
            edition: nft_edition
        };
        nft_contents.set(nft_commit, public_data);
    }

    // Update the edition of a private NFT.
    async transition update_edition_private(
        private nft: NFT,
        private new_edition: scalar,
    ) -> (NFT, Future) {
        let out_nft: NFT = NFT {
            owner: nft.owner,
            data: nft.data,
            edition: new_edition,
        };
        let nft_commit: field = commit_nft(nft.data, new_edition);

        let update_edition_private_future: Future = finalize_update_edition_private(
            nft_commit
        );
        return (out_nft, update_edition_private_future);
    }
    // Update the NFT commits on chain.
    async function finalize_update_edition_private(
        nft_commit: field,
    ) {
        assert(nft_commits.contains(nft_commit).not());
        nft_commits.set(nft_commit, true);
    }

    // Ensure all members of a group of NFTs are approved for transfer.
    async transition set_for_all_approval(
        private spender: address,
        public new_value: bool,
    ) -> Future {
        let apvl: approval = approval {
            approver: self.caller,
            spender: spender,
        };
        let apvl_hash: field = BHP256::hash_to_field(apvl);
        return finalize_set_for_all_approval(
            apvl_hash, new_value
        );
    }
    async function finalize_set_for_all_approval(
        apvl_hash: field,
        new_value: bool,
    ){
        for_all_approvals.set(apvl_hash, new_value);
    }

    // Approve transfer of a specific NFT.
    async transition approve_public(
        private spender: address,
        private nft_data: data,
        private nft_edition: scalar,
    ) -> Future {
        let nft_commit: field = commit_nft(nft_data, nft_edition);

        let apvl: approval = approval {
            approver: self.caller,
            spender: spender,
        };
        let apvl_hash: field = BHP256::hash_to_field(apvl);
        return finalize_approve_public(
            self.caller, apvl_hash, nft_commit,
        );
    }
    async function finalize_approve_public(
        caller: address,
        apvl_hash: field,
        nft_commit: field,
    ){
        let owner: address = nft_owners.get(nft_commit);
        assert_eq(owner, caller);
        nft_approvals.set(nft_commit, apvl_hash);
    }

    /////--Application Specific Transitions--/////

    // Mint a public NFT.
    //
    // Options for minting without onchain state:
    // 1 - Have only the owner of the contract mint NFTs (allows for explicit balancing).
    // 2 - Have "verifiable external public randomness" (hard without oracle). However leads to everyone being able to predict in advance unless outside cryptosystem is relied on. Hard to reverse.
    // 3 - Have an opcode that creates a random number. Using the internal randomness of the computer is not secure.
    // 4 - Get mint_public() show what was minted then transfer_private() to the recipient. Effects, shows what was minted, the transfers it, increasing speculation.
    async transition mint_public() -> Future {
        // We want randomness
        let nft_data: data = data {
            metadata: [0; 4],
            class: 0,
            earned_points: 0
        };
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let mint_nft_future: Future = finalize_mint_nft(
            nft_commit, nft_data, nft_edition
        );
        return mint_nft_future;
    }
    async function finalize_mint_nft(
        nft_commit: field,
        nft_data: data,
        nft_edition: scalar,
    ){
        let public_data: nft_content = nft_content {
            data: nft_data,
            edition: nft_edition
        };
        nft_contents.set(nft_commit, public_data);
        nft_owners.set(nft_commit, self.caller);
    }

    // Set max mints for a specific class of NFT.
    async transition set_max_mints(
        public class: field,
        public max_mint: u64,
    ) -> Future {
        // Ensure the caller is the owner of the contract.
        return finalize_set_max_mints(
            class, max_mint
        );
    }
    async function finalize_set_max_mints(
        class: field,
        max_mint: u64,
    ){
        max_mints.set(class, max_mint);
    }

    // Set combo rule for a specific NFT class.
    async transition set_combo_rule(
        public class: field,
        public combo_rule: combo_rule,
    ) -> Future {
        // Ensure the caller is the owner of the contract.
        return finalize_set_combo_rule(
            nft_commit, combo_rule
        );
    }
    async function finalize_set_combo_rule(
        nft_commit: field,
        combo_rule: combo_rule,
    ){
        combo_rules.set(nft_commit, combo_rule);
    }
}
