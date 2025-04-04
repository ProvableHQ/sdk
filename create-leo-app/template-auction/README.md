# Auction Example

## Getting Started

let DS = DomainSeparator::from("auction");
let nonce = wallet.sign( DS | auction ).challenge();
let r = nonce();
let apk = r * G;
let ack = (r * address).x = (r * vk * address).x;

let auction_blinded = auction_blinded(
    auction,
    nonce,
    apk,
    ack,
    address,
    pk,
    vk,
);