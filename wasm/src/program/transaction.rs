// Copyright (C) 2019-2021 Aleo Systems Inc.
// This file is part of the Aleo library.

// The Aleo library is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// The Aleo library is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with the Aleo library. If not, see <https://www.gnu.org/licenses/>.

use crate::{
    account::{Address, PrivateKey},
    record::RecordPlaintext,
};

use aleo_account::{Aleo, Process, Program, Request, Transaction};
use std::convert::TryInto;

pub struct TransactionBuilder {}

impl TransactionBuilder {
    /// Creates an execute transaction from a full proof of execution
    pub fn build_transfer_full(
        private_key: PrivateKey,
        address: Address,
        amount: u64,
        record: RecordPlaintext,
    ) -> Transaction {
        let process = Process::load().unwrap();
        let credits_program = Program::credits().unwrap();
        let mut amount_str = amount.to_string();
        amount_str.push_str("u64");
        let inputs = [record.to_string(), address.to_string(), amount_str];
        let rng = &mut rand::thread_rng();
        let authorization =
            process.authorize::<Aleo, _>(&private_key, credits_program.id(), "transfer", inputs.iter(), rng).unwrap();
        let (_, execution, _, _) = process.execute::<Aleo, _>(authorization, rng).unwrap();
        // TODO: Figure out how to get proper inclusion proofs
        Transaction::from_execution(execution, None).unwrap()
    }

    pub fn build_authorization(
        private_key: PrivateKey,
        address: Address,
        amount: u64,
        record: RecordPlaintext,
    ) -> Request {
        // Get credits function
        let program = Program::credits().unwrap();
        // Get function id
        let function = program.get_function(&"transfer".try_into().unwrap()).unwrap();
        // Retrieve the input types.
        let input_types = function.input_types();
        // Ensure the number of inputs matches the number of input types.
        if function.inputs().len() != input_types.len() {
            panic!("The number of inputs does not match the number of input types");
        }
        let mut amount_str = amount.to_string();
        amount_str.push_str("u64");
        let inputs = [record.to_string(), address.to_string(), amount_str];
        let rng = &mut rand::thread_rng();
        // Compute the request.
        Request::sign(&private_key, *program.id(), *function.name(), inputs.iter(), &input_types, rng).unwrap()
    }

    pub fn submit_transfer(transaction: Transaction) -> Result<String, String> {
        ureq::post("https://vm.aleo.org/api/testnet3/transaction/broadcast")
            .set("Content-Type", "application/json")
            .send_json(transaction)
            .map(|res| res.into_string().unwrap())
            .map_err(|res| format!("result was {res:?}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const OWNER_PLAINTEXT: &str = r"{
  owner: aleo184vuwr5u7u0ha5f5k44067dd2uaqewxx6pe5ltha5pv99wvhfqxqv339h4.private,
  gates: 1159017656332810u64.private,
  _nonce: 1635890755607797813652478911794003479783620859881520791852904112255813473142group.public
}";

    const ALEO_PRIVATE_KEY: &str = "APrivateKey1zkp3dQx4WASWYQVWKkq14v3RoQDfY2kbLssUj7iifi1VUQ6";
    const ALEO_TRANSACTION: &str = r#"{"type":"execute","id":"at1fkdpannjpr2tqckjeums6gxhkwjk2eur46yg6hkgqqkgtdkfzq9s9czu57","execution":{"transitions":[{"id":"as1ud2k87qwvl57vddljqazcddmpr4k3vw3qqqrhj48ryzj7gufg5gqdqkv74","program":"credits.aleo","function":"transfer","inputs":[{"type":"record","id":"2264174375656450495659195662773018964397321059566847995840187732941188196856field","tag":"991092175232302922303263079732348736805151842084336765987492042902283637570field"},{"type":"private","id":"2198057546971121618361183040033711913419316537402501696159606032073770645643field","value":"ciphertext1qgqw7ntlautr66pwxa0fa0wvzj829nvxm8ngn0gddjxpc5wh0rc9wp2rdm2mtjuw4ctq6v4w4ckncmwuwrr854n90wnezfuv657k2v64pckd838l"},{"type":"private","id":"5264290822427721625554133961967278830262828260175543013769727677143724652846field","value":"ciphertext1qyqrctmk7uqd85xt88xn8mv0m9s7w753faetd8ld5aypa4nsd2nm7qqm269hv"}],"outputs":[{"type":"record","id":"7480174978639101636018370278428607330460116826710058376029130251846522184433field","checksum":"1094099940300118645440547020248603258260339639354121749837310724031404087683field","value":"record1qyqsptmhhw7hecmu6v2xfkvnyer2xvkes6tg5mjp20vj8nyug96t6tcpqyqspmep2qlkwyf9xudgzwhhu3ccxy6sacamavpyqpag2smktchr8ngqqrxqglgs45xfas59ympcj33zfwnthxl0ykrdmvvk3zsmgf68kassjy5em3c"},{"type":"record","id":"8435183583098588001888188784508792568751656189687357522899507834363036701144field","checksum":"8131237156100739192138214106147546505255903239715170919345521760131036382623field","value":"record1qyqsqlzwjm8m2k8qmzu7yajj9scyk07ttqmra6t7ugy9lc0sjjvd62csqyqsqdyanlhrzgpfftatmaa7um2kx8sgrtyy6gjcmlpu7gyhq07v52ssqqa6ttddg70n9v6dlhtukzzv6psut6c0pefqxmphka0dgu8uezzs2gyzccc"}],"proof":"proof1qqqqzqqqqqqqqqqqzxrpxsuxky7afl6jz325zzn7jq24p7sgp8zvl3xe0jt0kdqa0elj86svqn9ykg7kfl5kvku898ucq5rt9jjgq42ragysu9cgy347e392h7t26wsxwkhat9592635n0r7j4z8rvn75spndhhpa4wwzle8qxyenhejctp3l9tvxm3asac77c4uwxff20wlzextztj5h6adzpurjllfhy4wgxu0z5rqa9rj9jlj3qgp96dwpsrd9rfdv5hq2p6g8hkrhw9eudx8t0pawl6kj6ke6mj07hyp9xde9ajrfn5zupa902cvuylczsf4cgrcs2t5ynszn3gae0r2juk6rlmdswc6jwxsyz3tyykm0tzgxw824d5t64zag9559y4w5f42spd4qfvqx3w7nxecnzwuwdn6nk2fvwcmfur54u827r3gpz4rk3he7a5w3wpccl72q4yde9n4x6s3zq0h3fk39fthnljm6h9p6kgdmw2uqvc6v0ev9nze8nx0ad9w3q9wmkmp635jaf90ht4g9ky76hk6dvqn0qmq85tcxv5hy5ejjteg4stnz2e02hl7jtaavna2ttzng455gqfjdhhdp347xaltfh3sf6t22ygp6yd4tyl2qzryg2tdxs3u60vy45ynlnmc2jn6ajyjwrfy3c650k4f36pagwvv2tmm6u9qhta56heqpswx2uqrzy0s95crn5auta8w3dfsxjj93mzv48vpcuuzaj9dpcksu569xnrjrx2sgq4wl38kzjugq8mvladxquwlw2hhzjpnfjkgrasjkh2yasm749jdlda709xlq84sxmfxcawxk66rpaj3n3pkzg6ul0t7t92rjputqj8f58aw6f7fuhgzfyxg0tpjjpcp5kr8rnkh2py9r9tdl7f0x6r9agjwc04wvjadec9mx2q3p9zjpl4e3psmc7fuueac3k0n3zgmvphs6ghqgq29elljzrt0ctt6pls7l2p2rj0pn4u3v36weym2v5szl765xcghr76pxsaapyukce47hxvdkg4m2e40l2zqnlug7v5v4vpas7sla28l87q46xappu6udnztvt3n0pxye8xx89uauanh7yqul5ptu8nz8mtqj0kdaxq0psxv86yg874l70ept006tn63na07jdrvevd6ycelsl94xq6csggqyqqqqqqqqqqql3mjqek006xfcl8sccd7njrw66g576nun3wy9kjy6gfmeaq3d8ll9yhajjy22psq85f0aqjdzfecqqfh52yaew3395h2s62ppxvtqmumm9hgee3hf7ktqlvfv8ly25rhzz9jr6udyeccjcgtaukvl84acv23958yh08t84fpewk732dunhd3p43qhvjwyztd3x59cp5ezctlfqqqqqgc593j","tpk":"773999564760689157005167295697716836541585901750980095224027628334324041776group","tcm":"6328614204394045680405882846927987917875073889391930776948853155823715227646field","fee":0}],"global_state_root":"ar1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgu0n07"}}"#;

    #[test]
    fn test_build_transaction() {
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY);
        let address = Address::from_private_key(&private_key);
        let amount = 100;
        let record = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        TransactionBuilder::build_transfer_full(private_key, address, amount, record);
    }

    #[test]
    fn test_submit_transaction() {
        let transaction = serde_json::from_str::<Transaction>(ALEO_TRANSACTION).unwrap();
        let response = TransactionBuilder::submit_transfer(transaction);
        println!("response: {response:#?}");
    }

    #[test]
    fn test_build_authorization() {
        let private_key = PrivateKey::from_string(ALEO_PRIVATE_KEY);
        let address = Address::from_private_key(&private_key);
        let amount = 100;
        let record = RecordPlaintext::from_string(OWNER_PLAINTEXT).unwrap();
        TransactionBuilder::build_authorization(private_key, address, amount, record);
    }
}
