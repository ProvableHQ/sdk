// Copyright (C) 2019-2023 Aleo Systems Inc.
// This file is part of the Aleo SDK library.

// The Aleo SDK library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo SDK library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo SDK library. If not, see <https://www.gnu.org/licenses/>.

use crate::types::TransactionNative;

use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;

/// Webassembly Representation of an Aleo transaction
///
/// This object is created when generating an on-chain function deployment or execution and is the
/// object that should be submitted to the Aleo Network in order to deploy or execute a function.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Transaction(TransactionNative);

#[wasm_bindgen]
impl Transaction {
    /// Create a transaction from a string
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(transaction: &str) -> Result<Transaction, String> {
        Transaction::from_str(transaction)
    }

    /// Get the transaction as a string. If you want to submit this transaction to the Aleo Network
    /// this function will create the string that should be submitted in the `POST` data.
    #[wasm_bindgen(js_name = toString)]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the id of the transaction. This is the merkle root of the transaction's inclusion proof.
    ///
    /// This value can be used to query the status of the transaction on the Aleo Network to see
    /// if it was successful. If successful, the transaction will be included in a block and this
    /// value can be used to lookup the transaction data on-chain.
    #[wasm_bindgen(js_name = transactionId)]
    pub fn transaction_id(&self) -> String {
        self.0.id().to_string()
    }

    /// Get the type of the transaction (will return "deploy" or "execute")
    #[wasm_bindgen(js_name = transactionType)]
    pub fn transaction_type(&self) -> String {
        match &self.0 {
            TransactionNative::Deploy(..) => "deploy".to_string(),
            TransactionNative::Execute(..) => "execute".to_string(),
            TransactionNative::Fee(..) => "fee".to_string(),
        }
    }
}

impl From<Transaction> for TransactionNative {
    fn from(transaction: Transaction) -> Self {
        transaction.0
    }
}

impl From<TransactionNative> for Transaction {
    fn from(transaction: TransactionNative) -> Self {
        Self(transaction)
    }
}

impl FromStr for Transaction {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(TransactionNative::from_str(s).map_err(|e| e.to_string())?))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    const TRANSACTION_STRING: &str = "{\"type\":\"execute\",\"id\":\"at1xrxemapaf385s43ed5nwsteg8cq54e39lk2d2lw4rujvja4cwq9sg5pseq\",\"execution\":{\"transitions\":[{\"id\":\"as1t7quw0wv44zkrem48s25mdwzyjr0qn6eq6ac3neh7s9fv5ww8qzswv37gq\",\"program\":\"credits.aleo\",\"function\":\"mint\",\"inputs\":[{\"type\":\"public\",\"id\":\"4571474674041498190570175739605649554896377072704024916067816371486863204251field\",\"value\":\"aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px\"},{\"type\":\"public\",\"id\":\"8061372082825942177836550247297053850302997632012579379895213511313014824528field\",\"value\":\"1u64\"}],\"outputs\":[{\"type\":\"record\",\"id\":\"1815634065770981623360291510624106631041220031671340894298102432902040793411field\",\"checksum\":\"1015167472992783511311101598574240443268988130054487982421923374591159165351field\",\"value\":\"record1qyqsp79mapsrlhq9nagchuptc0j28de50fgynyqqx9tktvc54uquqggdqyxx66trwfhkxun9v35hguerqqpqzqzscf2u4qdzkwtf3nqflkmu3suwsssx94nm5mzvgq3lwjkp2s6pqa5upd4uv47akp03x4dekwt3j8ete9gdqm3qcl0am4dul5ysgeeq7kcnax7\"}],\"tpk\":\"7389326660456621081896114306777120980284671073551156387156944531787954948120group\",\"tcm\":\"4153485374762916289562399739094103978130001873040055685900383330717020526427field\"}],\"global_state_root\":\"ar1s2rpkf7derk239umx5wqlsz4tnqrkywdp7ls5f5rlawl06z4kggscft4pu\",\"proof\":\"proof1qqqsqqqqqqqqqqqpqqqqqqqqqqqz6uuh99ckx3rzxg7fxfjstdtdwk9ag4yq30qrse8gtkrzj949m3z66ap2vpz6sr0m8eyde5323rgpdf2q33ukew5pxt7g40v73um3r225a5n2qe99ztulm43lt49nkaqqn4ktk5lzdqfjes3etatkkgncrke2q9p3zsc07ru3tuhvpnv7frlt0qtrl2f06wkpyafl75yzdd4z0rztvy9c22gpxxmv5g52jxpfqqqupjt7a3l7nwalslfq4rqxyqcrz4qnrav3k829979czuq9cyjkztmgzc7nath3ran79edyq338m95q0mnet3jtkyr0a9utjnr5t5pgvf8s6v4mn9wjzqcufwkpmw943tgnjr2338ysyay3st2fewgl4klcpkuc42tch723sgps5kwnq8s5wt43jjj8vwyz89kjhqh4e6894n0ppjm7qds508sxcphxdv5gzfuqsz8h0lajd8lru740aqut9uyr7nlmcydqvuk0lhuyd7v5ne86qv6yvfrtq55mf2lnk4remyprkdajxqpr2en8s3jy0w9rt6kafzq625qz775gl4wt7h9zyevamjjx45c290fk6tr637vtchc5q670svg0wuq0te0dspd4ttzy7ty2njdzj74yngrqajuudvsycsj9kevpvw8fs929wwtsfvvpgqg2l6f54uj5c3cp9u0uv70yk33a0cvnn0lszc72ymqlu0y779nchphl2r90d6fhc87gtx0qgcn8epx32xel97qdasgqztsh6wecct4paz4was8fxyq8rd0jutsl9l772z9prj8s7jjjvsgyxalygw6yj5yu7qgkk7uprf7sa6ew0kl6lew796pzr2x0j2esagzljsr7usamwja0wuwcw0v028u43msyqeeulr7lkkmhhhcc7dpyxzj8y6uxcyw72dd0lr0vzkwumswjzuvtytf8823ur3zacqc2g8v7p6ld4q26nht5a22d3t23qhre3ak20vcatf8hrpcskw8fjx6kdppqsqgqqqqqqqqqqzwf2wl74jh0zs2fgp60xe0z8legf3xwdwf7ujaswf7h38q0datq0vtccxpwgazyemk3mjcg5603uwq33t9sate0kalnhsjzfrw7q4cxfhf8q6ztmrunze77jl2sv4xvtet8rweuraxp7can9r4g69kguursyqqqqqqqqqqqqf8nmctdkcss4ju4femxj93uuzdsw6vwyr3twtyuzdk86zfs40hhp4pjspq7tfwsjw3auha3xvagzq0qg2jfpmsazykcyuqslr3ga4zqa8m5hepqg9a0amm90kvj2k45zps0lp3304q929kl4pw0qtr4wggrzau056qgsa2krsmyg0r37x6fqqfe9jhhd5hxp08m4me4arlaxqqqqqf43srp\"}}";

    const TRANSACTION_ID: &str = "at1xrxemapaf385s43ed5nwsteg8cq54e39lk2d2lw4rujvja4cwq9sg5pseq";

    #[wasm_bindgen_test]
    fn test_transaction_string_constructor_and_accessor_methods() {
        let transaction = Transaction::from_string(TRANSACTION_STRING).unwrap();
        let transaction_id = transaction.transaction_id();
        let transaction_type = transaction.transaction_type();
        let recovered_string = transaction.to_string();
        assert_eq!(transaction_id, TRANSACTION_ID);
        assert_eq!(transaction_type, "execute");
        assert_eq!(recovered_string, TRANSACTION_STRING);

        // Test to and from round trip
        let transaction_native = TransactionNative::from_str(TRANSACTION_STRING).unwrap();
        let transaction_deconstruction = TransactionNative::from(transaction.clone());
        assert_eq!(transaction_native, transaction_deconstruction);
        let transaction_from_native = Transaction::from(transaction_native);
        assert_eq!(transaction, transaction_from_native);
    }
}
