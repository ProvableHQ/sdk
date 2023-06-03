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
    const TRANSACTION_STRING: &str = "{\"type\":\"execute\",\"id\":\"at1pkw4ms8yuw29k8lfqdqkcdaffd6hngnzkw3j8f8j0aht0egkz5fq4h652c\",\"execution\":{\"transitions\":[{\"id\":\"as1w46uteuwlm85yp85af0xsd52pt4qa04m2nm20ux6zh78u5d4ecys6v85ch\",\"program\":\"credits.aleo\",\"function\":\"mint\",\"inputs\":[{\"type\":\"public\",\"id\":\"5040908569006131213612149758844338587983081600819749361338731441075240131558field\",\"value\":\"aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8\"},{\"type\":\"public\",\"id\":\"1276789444601847309812664117152425665973038141628909950908919191663021093021field\",\"value\":\"1u64\"}],\"outputs\":[{\"type\":\"record\",\"id\":\"95928634596052979246019218801908083236653595200887025551448057926055637040field\",\"checksum\":\"7583379478720147365928563614237196759288927925463919661327931764780242134350field\",\"value\":\"record1qyqsqw5vumkswscee2ht4yju9el5g02uwv7204sx8nf96ln4mjugmasyqyxx66trwfhkxun9v35hguerqqpqzqpken3n6ghr0mm509pn7sgersrrnxfvcp5zsctd9cr03ay2yncap2khg34cktpumr8mnv7sqa4zjxu9ww78u69nfqxh9mwxxqvv6ssqsepzx3u\"}],\"proof\":\"proof1qqqsqqqqqqqqqqqpqqqqqqqqqqqdxthfnfwmf8htv998y84helwczfhr525qx6fe4d3xfhz9tnz5htjpspzk9l38u4uyxge2hfteva5qc50ht0dklnvqvmukzjvc0q47a3y79e0zaz8mmtl3kzq5rtpeegny8cduhd8v02hg7tfranq7cl7cqlzeth8eak93d2p63nmt5datq6n6v6nv0uxxl0nj9r6lydef228xm34getesxvxchxtt9kj3c4vzqyqcqrnlmzf8mphcwns8wt9js8n67tvrnx8x9dnq66tjl46j2paj75pe0yh057hf9fw9989zacc5y0qq64ekr4cpkyl0jxx6l0l64nt8lgtltlwvfzmad55vh8lz5xsmhhau530n8ttw4h9de7uju2s9wqscrfp8tgfpn5sfyx5k27ue2t5dumfe0w63uq9tf2gjh9j2uegxfn3aqn42j3esmervqa57zms9055lqp09nyv3v7exa3hkqsy9vvu37tve6wrv9xwxf3euk6yf4kecdvf3v6llvjg9ehgtv6a8xqek0vzn7qz6n5sshwnhxn4mel85nqnlz5rp3e0p0tfj0k2cvr4ssw62qgyynr52ckykw84g2an72f6ark9vfzqama0jgalrtrufhet48lew523386xv87p9k57vnvwturq4qclk3yfy8nsfveghjnhuy9znvmu78h5qrzyzhlsnz5fgatex2nqgu8vyvtvrzghxc7dzwspsux93jsn2y64uhecf45r2myk7d7c4cfcfjcmgpp8gp2482ljfhtv3lrjkqhdlu73x7pzzft70xslqk2mypg7ufns2yckh8353ss7frsq4h7etrhdswyytjn0t5gp6m9pzwt4qenznp5p3pq8lhuaj42yhhllzp8huvstmxlcrmjyn09s6vts782rqnu8j6qzpy4p59ujnh9ykunxcyrtm7422jkmus9r7p4ck0fm64fm9ry0rppvhs6p5rh6s05kmpsnrjdx3p8rpqgk8l4m4nhjsxjwr6l7c4mrsxqgqqqqqqqqqqzkfxa64vdye8v2zsjxm8ny3ytmnzd63jpnzdrqys66d3nlay75q30mjd3p7ua2y8fv4rg8xrurzexgh0jptxxt5dxza36qdxxrafys0zx2ckw7662xygr4gynaj2yzzesjlzvs8aw6yr5hn04vdl7ey5q9qyqqqqqqqqqqqqn4ekpaxek52nzpaptxky4cuar5exs9w8spskwn4xu87203y2s8k3l2h0w80zj4m3m39akgytmxcqqtytm0a68pmtwxy8c0rfl09z3mfgxvnprqwmwtq7aa0wmpvg0j0zgc9f35uczk7z2pf54xn2kwp23mrwd6fc4x3cl3lw5khhcl36z0rwsqve9v86newep09epdq7pe8eqqqqq035d6j\",\"tpk\":\"6632149043115422828236144456828746891849538829103670866843594215187740194210group\",\"tcm\":\"4818412099071103605161859576211275541485358629762154526095011715785635126388field\"}],\"global_state_root\":\"ar1jexd2yp8k5lal4rn7khtf0ejgzqcq7rada0chywes7q3hvmcxqgq0u4930\"}}";
    const TRANSACTION_ID: &str = "at1pkw4ms8yuw29k8lfqdqkcdaffd6hngnzkw3j8f8j0aht0egkz5fq4h652c";

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
