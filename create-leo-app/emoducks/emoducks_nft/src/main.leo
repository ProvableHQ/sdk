// The 'emoducks NFT' program.
program emoducks_nft.aleo {

    ///////////////////////////////
    ///// ----- STRUCTS ----- /////
    ///////////////////////////////


    //// ----- ARC-721 Standard Structs ----- //

    // Struct representing prior approvals to transfer.
    struct Approval {
        approver: address,
        spender: address
    }

    // Description of a unique NFT "attribute" in string form describing the "type" of the attribute and its value.
    // "value" is a reserved keyword, so value is used instead.
    struct Attribute {
        trait_type: [field; 4],
        value_: [field; 4],
    }

    // NFT Specific Data.
    struct CoreData {
        metadata: [field; 4], // URI of offchain metadata JSON (124 bytes available)
        uri: [field; 4], // URI of the NFT image (124 bytes available)
        baby: field,
        // mania: field,
        // sadness: field,
    }

    // A public representation of the NFT content.
    struct NftContent {
        data: CoreData,
        edition: scalar
    }

    ///// ----- Application Specific Structs ----- //

    // The NFT data fields that can be mutated.
    struct MutatableData {
        mania: field,
        sadness: field,
        counter: u8,
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
    mapping nft_contents: field => NftContent;

    // Stores the public owners of an NFT.
    mapping nft_owners: field => address;

    
    ///// ----- Application Specific Mappings ----- /////

    // Mapping of the NFT unique ids (commits) for a Emoduck to a "mutatable_data" struct.
    mapping nft_mutatable_data: field => MutatableData;

    ///////////////////////////////
    ///// ----- RECORDS ----- /////
    ///////////////////////////////


    /////--ARC-721 Standard Records--/////

    // The standard representation of an NFT within ARC-721.
    record NFT {
        owner: address,
        data: CoreData,
        edition: scalar,
    }

    // The record that allows a private NFT transfer to be communicated to a public recipient.
    record NFTView {
        private owner: address,
        private data: CoreData,
        private edition: scalar,
        private is_view: bool
    }

    ///////////////////////////////
    ///// ---- FUNCTIONS ---- /////
    ///////////////////////////////


    /////--ARC-721 Standard Functions--/////

    // Commit the NFT data to a field element creating a unique ID for the NFT.
    inline commit_nft(
        nft_data: CoreData,
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
        private nft_data: CoreData,
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
        private nft_data: CoreData,
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
        let transfer_pub_as_signer_future: Future = finalize_transfer_pub_as_signer(
             to, nft_commit, signer,
        );
        return (
            nft_view,
            transfer_pub_as_signer_future
        );
    }
    async function finalize_transfer_pub_as_signer(
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
        
        let transfer_private_to_pub_future: Future =
            finalize_transfer_pri_to_pub(
                to, nft_commit
            );
        
        return (
            nft_view,
            transfer_private_to_pub_future
        );
    }
    // Finally, set the mapping storing the public NFT ownership.
    async function finalize_transfer_pri_to_pub(
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
        private nft_data: CoreData,
        private nft_edition: scalar,
        private to: address,
    ) -> (NFT, Future) {
        let nft_commit: field = commit_nft(nft_data, nft_edition);
        let caller: address = self.caller;
        let finalize_future: Future = finalize_transfer_pub_to_pri(
            caller, nft_commit,
        );
        let received_nft: NFT = NFT {
            owner: to,
            data: nft_data,
            edition: nft_edition,
        };
        return (received_nft, finalize_future);
    }
    async function finalize_transfer_pub_to_pri(
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
       public nft_data: CoreData,
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
        nft_data: CoreData,
        nft_edition: scalar,
    ) {
        let public_data: NftContent = NftContent {
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
        let apvl: Approval = Approval {
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
        private nft_data: CoreData,
        private nft_edition: scalar,
    ) -> Future {
        let nft_commit: field = commit_nft(nft_data, nft_edition);

        let apvl: Approval = Approval {
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

/////--Application Specific Functions--/////

    // Initialize the core data for the NFT.
    function initialize_core(random_value: field) -> CoreData {
        let hash_u32: u32 = BHP256::hash_to_u32(random_value);
        let metadata: [field; 4] = [0field, 0field, 0field, 0field];
        let uri: [field; 4] = [0field, 0field, 0field, 0field];
        let baby: field = (hash_u32 % 100u32) as field;
        return CoreData {
            metadata: metadata,
            uri: uri,
            baby: baby,
        };
    }

    // Initialize the mutatable data for the NFT.
    inline initialize_mutatable_data(random_value: field) -> MutatableData {
        let hash_u32: u32 = BHP256::hash_to_u32(random_value);
        let mania: field = (((hash_u32 as u32) >> 2u32) % 100u32) as field;
        let sadness: field = (((hash_u32 as u32) >> 4u32) % 100u32) as field;
        return MutatableData {
            mania: mania,
            sadness: sadness,
            counter: 0u8,
        };
    }

    // Mint a private Emoduck.
    async transition mint_private() -> (NFT, Future) {
        let random_value: field = BHP256::hash_to_field(self.caller);
        let nft_data: CoreData = initialize_core(random_value);
        let mutatable_data: MutatableData = initialize_mutatable_data(random_value);
        let edition_value: scalar = 1scalar;
        let commit_hash: field = commit_nft(nft_data, edition_value);
        let duck: NFT =  NFT {
            owner: self.caller,
            data: nft_data,
            edition: edition_value,
        };
    let mint_private_future: Future = finalize_mint_private(
        commit_hash, mutatable_data
    );
        return (duck, mint_private_future);
    }
    
    async function finalize_mint_private(hash: field, mutatable_data: MutatableData) { 
        // Ensure that the NFT doesn't already exist.
        assert(nft_commits.contains(hash).not());
        nft_commits.set(hash, true);

        // Set the mutatable data for the NFT.
        nft_mutatable_data.set(hash, mutatable_data);
    }

    // Mutate the mania and sadness traits of an Emoduck NFT.
    async transition mutate_emoduck(random_val: field, nft_commit: field) -> Future {
        let caller_address: address = self.caller;
        let hashed_caller: field = BHP256::hash_to_field(caller_address);
        let mutate_future: Future = finalize_mutate_data(random_val, nft_commit, hashed_caller);
        return mutate_future;
    }

    // Populate the Mutatable Data fields of the NFT with random values.
    async function finalize_mutate_data(random_val: field, nft_commit: field, hashed_caller: field) {
        // Ensure that the owner of the NFT is the caller.
        let owner: address = nft_owners.get(nft_commit);
        let hashed_owner: field = BHP256::hash_to_field(owner);
        assert_eq(hashed_owner, hashed_caller);

        // Get the NFT data from the commit
        assert(nft_contents.contains(nft_commit));
        let mutatable_data: MutatableData = nft_mutatable_data.get(nft_commit);
        // Ensure that mutate counter is less than 5. You can only mutate a duck 5 times.
        assert(mutatable_data.counter < 5u8);
        // Generate new data and update the counter.
        let hash_u32: u32 = BHP256::hash_to_u32(random_val);
        let mania_data: u32 = hash_u32 % 100u32;
        let sadness_data: u32 = (hash_u32 >> 2u32) % 100u32;
        let mutated_data: MutatableData = MutatableData {
            mania: mania_data as field,
            sadness: sadness_data as field,
            counter: mutatable_data.counter + 1u8,
        };
        // set the new data in the mapping
        nft_mutatable_data.set(nft_commit, mutated_data);
    }

    // Mint a public NFT.
    //
    // Options for minting without onchain state:
    // 1 - Have only the owner of the contract mint NFTs (allows for explicit balancing).
    // 2 - Have "verifiable external public randomness" (hard without oracle). However leads to everyone being able to predict in advance unless outside cryptosystem is relied on. Hard to reverse.
    // 3 - Have an opcode that creates a random number. Using the internal randomness of the computer is not secure.
    // 4 - Get mint_public() show what was minted then transfer_private() to the recipient. Effects, shows what was minted, the transfers it, increasing speculation.
    // 5 - This implementation sources randomness from the caller's address.
    async transition mint_public(
        public nft_edition: scalar,
        private random_value: field,
    ) -> Future {
        let nft_data: CoreData = initialize_core(random_value);
        let mutatable_data: MutatableData = initialize_mutatable_data(random_value);
        let public_nft_commit: field = commit_nft(nft_data, nft_edition);
        let mint_nft_future: Future = finalize_public_mint(
            public_nft_commit, nft_data, nft_edition, self.caller
        );
        return mint_nft_future;
    }

    async function finalize_public_mint(
        nft_commit: field,
        nft_data: CoreData,
        nft_edition: scalar,
        caller: address
    ){
        let public_data: NftContent = NftContent {
            data: nft_data,
            edition: nft_edition
        };
        // Check that the public NFT doesn't exist.
        assert(nft_contents.contains(nft_commit).not());
        // Check that an identical private NFT doesn't exist.
        assert(nft_commits.contains(nft_commit).not());
        nft_contents.set(nft_commit, public_data);
        nft_owners.set(nft_commit, caller);
    }
    
}