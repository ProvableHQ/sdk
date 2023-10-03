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
    ///
    /// @param {string} transaction String representation of a transaction
    /// @returns {Transaction | Error}
    #[wasm_bindgen(js_name = fromString)]
    pub fn from_string(transaction: &str) -> Result<Transaction, String> {
        Transaction::from_str(transaction)
    }

    /// Get the transaction as a string. If you want to submit this transaction to the Aleo Network
    /// this function will create the string that should be submitted in the `POST` data.
    ///
    /// @returns {string} String representation of the transaction
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
    ///
    /// @returns {string} Transaction id
    #[wasm_bindgen(js_name = transactionId)]
    pub fn transaction_id(&self) -> String {
        self.0.id().to_string()
    }

    /// Get the type of the transaction (will return "deploy" or "execute")
    ///
    /// @returns {string} Transaction type
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
    const TRANSACTION_STRING: &str = "{\"type\":\"execute\",\"id\":\"at1nxeg7yttrgn2usx9kvprf4m6l90hf46xeaydtzcd9g75nus89spshz3nq3\",\"execution\":{\"transitions\":[{\"id\":\"as1elwd3rrs6usm29au4m7930dw34qc9fgpcft2cttpr22v0wqtcugq3w9ju2\",\"program\":\"credits.aleo\",\"function\":\"transfer_public\",\"inputs\":[{\"type\":\"public\",\"id\":\"5907511150006977506230980075690536919685375158466705529320990737854928887990field\",\"value\":\"aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8\"},{\"type\":\"public\",\"id\":\"7982283145747718203249182128016464244397256863721538973871034171457064208262field\",\"value\":\"1u64\"}],\"outputs\":[{\"type\":\"future\",\"id\":\"4008617251745541310278402942725515740438336136760958012618696224551610246151field\",\"value\":\"{\\n  program_id: credits.aleo,\\n  function_name: transfer_public,\\n  arguments: [\\n    aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8,\\n    aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8,\\n    1u64\\n  ]\\n}\"}],\"tpk\":\"426663056102511765227671053009534797451999908535901481531983199661563048450group\",\"tcm\":\"1534997465320715735425891873359081363532823476989438880960500286633204303186field\"}],\"global_state_root\":\"ar1sdke9pp2kymvegysll924rkwq2sdp7u3v0dny8rvn0zyqupgmczs8t5x5g\",\"proof\":\"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqqrsqlml9y8ntderna5vml8cm8zg0gd3xt557tg96qfkscekp5q38wr69qj46r5c287aqhcpkczf8qpq8kdxuec8lvv4yvdm4k4kgkzmr6mntmj58y799htwlf5avw88keq8fayp788ydtfmnje97w7rl8r6qd50yh8klpyhj7ywpe647rxhdrpy2qfvhxezkg05rzmx9t7j3zl6rgmd4hd4q38nwq25e3qp0nezgqq2g9tdkw2rp04vkt46gkp9x8ye3ecuxc9j0zqyw2egp8p7ztavrpflqlnze8tnyty95s5lq3fsmsqu5qy3masdcgtj95enct9wphfxk5ghqxdxzwz33txfpchx7uffyagxn6chlwhryc26ay3pegsjkxsrxmg84ugcacz20u9pjyrxrxrgjl44mqcshpug9dpkfvfq09s79eu9ufqf72w38zskq6e6l2ymvums8j333cugwse7kt8c75qduf0xjkt6zkgxhkpkf5kvncxr8dfxh3yuw3wv0kqggdzpah3rqmnqd7fqqdgejndua4e6mfk22hdj6fkmg005e2pchgjev3zpdu072r28gh9vvj6xkd36yf8a0nzxgrmt29zgwqtvknatj0zqls23yppgh0nt93p7zk69w66dhcu2khpzh5t8vwq6zgus3mhyjqytmqn2dj5caz7vrgp9krg7kdmrhran88w57x93l3y20xkxpdk64mpy7may527xuq6surcp6tva0e3eze7gx06t2gpd3e675srqq2rad0ycdj05l08rfgacpr3jcjw5layydprd9rc09xnrq58qtwssyry8nf7zwglewhycp30qxtm2mdd3087c7ncfkyg48qp53s9f2eghlfhcenfv9lwx0nvaw3qggmurtcd5gvx5qs6hpp8qphmrddjnmqvrgx86k4fajnj25y7gagvl09hvrmlec0gq4d3plc7qupgr62wsrl767vqtcgdz9eulgw4xsgn5xen9xpss7k57m63hcynmxz9m339thtd8t7v7d4p4la6l8sg2z6mgjgkayc4kmr5mww503xztklyc53vettl58040pm44mrxfgx8pz0kqx4zyqnsyjq4vyz4htlpe5fxqjcxyzq98d8u5dfary8q7j3sn2gw9g6rhpeh2jgmengr7a2qfmpfeszsy4z8r0r4u2xfnmx2hmq0qvqqqqqqqqqqq94jt9tgluuakrl50al544e27fd3h2am03dzknp358ctpkyq5xe4zzecjujs6l5eggjvr4f3p6h3qqqwsuc6vgxxdwze52ejnvprvxte69ejl3egtg49z3hs0k3350y0m3xnyxyelzdv4y9xdrvl8rr2qzvpqx5af4pdjgw7mkg0w4pph6l9708emuw2999wdav5jl9dql5x6wtqryl0a34w3ya2h88p0rnmzwdz3qz50dflxwxvh5nwpeac4xlwz9taup49gl4ly87cmju3vuvkkue6qqqqwmc8ml\"},\"fee\":{\"transition\":{\"id\":\"as1l6uhn2qtvu53ker3mc5htl8zez0kzlr8p56wrds2kj2pnhgsyvys0yl06h\",\"program\":\"credits.aleo\",\"function\":\"fee_public\",\"inputs\":[{\"type\":\"public\",\"id\":\"2996685536981548557454514078993156178337218831466422725062883491278181936893field\",\"value\":\"3023388u64\"},{\"type\":\"public\",\"id\":\"5905563935613274059571167025428691034361018068179412971300387031818027999760field\",\"value\":\"4378343675180703452881652483301549197321065542531755166623110530046157373401field\"}],\"outputs\":[{\"type\":\"future\",\"id\":\"2432320784444893954958591507626737090900611232878405555838091152358395595911field\",\"value\":\"{\\n  program_id: credits.aleo,\\n  function_name: fee_public,\\n  arguments: [\\n    aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8,\\n    3023388u64\\n  ]\\n}\"}],\"tpk\":\"7056720889980672352920575743315541922748301367116937819254368455578705794867group\",\"tcm\":\"1714869696957207071175089592056335794264687593708571261524376592074954518596field\"},\"global_state_root\":\"ar1sdke9pp2kymvegysll924rkwq2sdp7u3v0dny8rvn0zyqupgmczs8t5x5g\",\"proof\":\"proof1qyqsqqqqqqqqqqqpqqqqqqqqqqq8a7fc3jujtcjjeuuyc3z2gy5vle4f2h2zuys067arlpfpu9jxd8ag0rfs9hzjdny4mxqdrugx0pgpqxunzeu5sjmt643wtqjv7xq5j0jnma7qva6535x0faq9nl2t72cry74jx9vjmnxg27uxa5c6rjafgqgllxguqhvaxd3en3vwg5xmrdukrgrj4kfm6smc9nzrj3d5j3gfnvn4au0929fsa7sxnxr43klhgxq9j028mt9xncd2re4um2c5lzsgt95vkr8gw2xlg0k6utvqf8k0cn6znur0smw9zhzcelhrnpf43rqqn96x0g2nhpw5k5un2ugy4j85kwkccg0qvfn0wlwwgw0hu8m9n2qvxrt5alsh32lrhrd8uyp7yenczse8arlj7579lu24ru9u5fd9f46rvd5h8wwrs5ye03pwcfesc2nmfpl5m2hytqhztajznm0gamw9sz2yc9mqt44sp23tkzz7lhwns23wcra736vehapel3nxcu0jn2tfze5x40flnlqqcca3atxkpfr66q0dy5df23s866d4t3a4wh4hf4zmq68jzfa7v9u7g2gaa9vdslqmcl3h5va3lw5htskn7lrzf2nlqqq2p02fhjjrwlssv583qzjzuj4yyfpt2n2kvq4vqjmlx2ss9mz2vwmkf8kjsyc3wvpay5xa2ar9y6cpjekusmcveue56m2xd5pfqrqc7n03yds8lxk86d9vqrj52njehgpmr79pumzkegxv5cnqgdhl8l7s8scg5fm7396dnmnrue5j7rxyuz89uzlxgqh2p33jqnep205vkhah7nt9rt5rjqf4xjnfs2f9xe0gz967hydmky7vga84k34zec4uwvvjfxa4a0l7vg5uprlx9yje7wpqs60ttksl8sx3duakdhha7kajh9p4ps5pad6mmcua2y0j75c6jxs2jmzek2htm4e2ym7h8rq7eukpvvpw9f9yt70tazyzfxu3nmw2lcr9fj26lj4n6uaesa87ss0vdutpkkxnnnq8krk3v32kdmtqptdlxpcm8nzcmy7j08za6c93emdec3kvnchr2ntyj7fmdpazen9s4zcazqd8zp5k7xkrkqkkew9zqlf29fajj57lhhthcqhhv3f0dgvpcq5q0cu6xfxj8hpq7f3p2m3lcv7kf99pcy9w3nj0tttnwwkkcn0cw0ssqvqqqqqqqqqqqmv3vn28xnfyewqa6vzsdvuhg9fdy7lsrl79fvg0tp2z72n93hrpc22retjd9r5s3xz2wyevvqkzqqqpu2rktjv5jq97lmpu624e6ewlwe3j9dgz3pa20y49zxm5zx08mlsp7365398jxrjfc59zhmat5xcqq9y78vt8n4nvendus5aly2afpx96gctxac47j0zge206xvurag7se0x5z7c6yc98sgr6tprp249nz6pfv579zjqdhk0z4fcyxnct4r428h0j6nxzvyl4hyx87a8ud94dqqqqfs8ws3\"}}";

    const TRANSACTION_ID: &str = "at1nxeg7yttrgn2usx9kvprf4m6l90hf46xeaydtzcd9g75nus89spshz3nq3";

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
