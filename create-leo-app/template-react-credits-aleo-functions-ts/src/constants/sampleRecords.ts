/**
 * Sample records for testing credits.aleo functions.
 *
 * NOTE: These records exist on testnet and are used to build transactions.
 * Since we only build (not broadcast) the transactions, they remain unspent.
 */

export const SAMPLE_RECORD_1 = `{
  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,
  microcredits: 500000u64.private,
  _nonce: 2128807984625485873765840993868794284062894954530194503954279385341936659546group.public,
  _version: 1u8.public
}`;

export const SAMPLE_RECORD_2 = `{
  owner: aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3.private,
  microcredits: 1000000u64.private,
  _nonce: 3679642728562651942188038004588605401119210243204186196628122783406618717891group.public,
  _version: 1u8.public
}`;

export const SAMPLE_RECIPIENT =
    "aleo1vskzxa2qqgnhznxsqh6tgq93c30sfkj6xqwe7sr85lgjkexjlcxs3lxhy3";

export const SAMPLE_AMOUNT = 50000;
