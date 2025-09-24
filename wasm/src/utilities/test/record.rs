// Copyright (C) 2019-2025 Provable Inc.
// This file is part of the Provable SDK library.

// The Provable SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Provable SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Provable SDK library. If not, see <https://www.gnu.org/licenses/>.

/// V1 credits.aleo record.
pub const CREDITS_RECORD_V1: &str = "{ owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";
/// Record view key for the V1 credits.aleo record.
pub const CREDITS_RECORD_VIEW_KEY: &str =
    "5237002936265850807349726649400053591020997883662246784632368923777787639801field";
/// Sender ciphertext of the credits.aleo record.
pub const CREDITS_SENDER_CIPHERTEXT: &str =
    "1182590395568997043375432557467567048762179115999922880321493200728848194550field";
/// Sender plaintext of the credits.aleo record.
pub const CREDITS_SENDER_PLAINTEXT: &str = "aleo1j92w9mhqznj2hvufad796y8suykjppk7f6n6xmncmktfm95vggzqx4sjlh";

/// Token registry record view_key.
pub const TOKEN_REGISTRY_RECORD_OWNER_VIEW_KEY: &str = "AViewKey1pTzjTxeAYuDpACpz2k72xQoVXvfY4bJHrjeAQp6Ywe5g";

/// Token registry test vector.
pub const TOKEN_REGISTRY_RECORD_V1: &str = r#"{
      owner: aleo1s3ws5tra87fjycnjrwsjcrnw2qxr8jfqqdugnf0xzqqw29q9m5pqem2u4t.private,
      amount: 1000u128.private,
      token_id: 1751493913335802797273486270793650302076377624243810059080883537084141842600field.private,
      external_authorization_required: false.private,
      authorized_until: 0u32.private,
      _nonce: 353510505137682717871934563523691055502582931368477380633253282125012046603group.public,
      _version: 1u8.public
    }"#;

/// Valid credits.aleo record for testing.
pub const CREDITS_RECORD: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1500000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public,
  _version: 0u8.public
}";

/// Invalid credits.aleo record for testing.
pub const INVALID_CREDITS_RECORD: &str = r"{
  owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
  microcredits: 1400000000000000u64.private,
  _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public,
  _version: 0u8.public
}";
