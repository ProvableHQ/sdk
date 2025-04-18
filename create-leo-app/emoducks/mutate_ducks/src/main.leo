// The 'mutate' program.
import emoducks_nft.aleo;

program mutate_emoducks.aleo {
    // Mutate a private emoduck
    async transition private_mutate(emoduck: emoducks_nft.aleo/NFT) -> (emoducks_nft.aleo/NFT, Data, Future) {
        
        let owner: address = emoduck.owner;
        // Mutate the emoduck's data.
        let hash_record: field = BHP256::hash_to_field(emoduck); 
        let duck_data: Data = emoducks_nft.aleo/populate_data(hash_record);

        // create a new emoduck
        let (mutated_emoduck, update_duck_future): (emoducks_nft.aleo/NFT, Future) = emoducks_nft.aleo/update_private_emoduck(emoduck, duck_data);

        // return the new duck
        return (mutated_emoduck, duck_data, finalize_private_mutate(update_duck_future));    
    }

    // Update the mapping associated with the NFT commit.
    // Why can't the async transition simply return the Future from the external call?
    async function finalize_private_mutate(mutate_future: Future) {
        // finalize the mutate
        mutate_future.await();
    }

    // Mutate a public emoduck
    async transition public_mutate(old_emoduck_commit: field, nft_commit: field) -> Future {
        // There is no record to source randomness, so currently hashing the coommit
        let random_value: field = BHP256::hash_to_field(nft_commit);
        // let duck_data: Data = emoducks_nft.aleo/populate_data(random_value);
        // create a new public emoduck
        // let new_duck_commit: field = emoducks_nft.aleo/commit_nft(duck_data, 1scalar); // hardcoded for testing
        let new_public_duck_future: Future = emoducks_nft.aleo/mint_public(
            1scalar, // hardcoded for testing
            random_value,
        );
        // Need to delete the old public emoduck
        let old_emoduck_future: Future = emoducks_nft.aleo/delete_old_public_emoduck(old_emoduck_commit);
        
        return finalize_public_mutate(new_public_duck_future, old_emoduck_future);
    }

    // Update the mappings associated with the NFT commits
    async function finalize_public_mutate( 
        public_mutate_future: Future,
        old_duck_future: Future
        ) {
        // create the new NFT
        public_mutate_future.await();
        // delete the old NFT
        old_duck_future.await();
    }   
}
