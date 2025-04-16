# Auction Example

## Getting Started

### Outside the Leo Program.
let DS = DomainSeparator::from("auction");
let nonce = wallet.sign( DS | auction ).challenge();

### Inside the leo program.
let public_key = nonce * G;
let committer_key = (nonce * address).x = (r * vk * address).x;
let struct = ... // Create any given struct;
let struct_id = BHP256::commit(struct, committer_key)

let auction_blinded = auction_blinded(
    auction,
    nonce,
    apk,
    ack,
    address,
    pk,
    vk,
);