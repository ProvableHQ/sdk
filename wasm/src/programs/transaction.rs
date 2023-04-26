// Copyright (C) 2019-2023 Aleo Systems Inc.
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

use crate::types::TransactionNative;

use std::str::FromStr;
use wasm_bindgen::prelude::wasm_bindgen;

/// Webassembly Representation of an Aleo transaction
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

    /// Get the transaction as a string
    #[wasm_bindgen(js_name = toString)]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Get the id of the transaction
    #[wasm_bindgen(js_name = transactionId)]
    pub fn transaction_id(&self) -> String {
        self.0.id().to_string()
    }

    /// Get the type of the transaction
    #[wasm_bindgen(js_name = transactionType)]
    pub fn transaction_type(&self) -> String {
        match &self.0 {
            TransactionNative::Deploy(..) => "deploy".to_string(),
            TransactionNative::Execute(..) => "execute".to_string(),
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
    const TRANSACTION_STRING: &str = r#"{"type":"execute","id":"at1anuvpv3a8aven96y438386ncxfucxe8p8fjpwhlg950rzx8cusyquzauxp","execution":{"transitions":[{"id":"as18hlu3way50nmumcyh7p0nfg47x48eq4yasnhcg2twmuh34egnyysx2nx2f","program":"hello.aleo","function":"main","inputs":[{"type":"public","id":"6884616682048827650471462627443042620370176627372809588982675994480411802497field","value":"5u32"},{"type":"private","id":"3038698680871135005017879629131542316446403199019779152155169714487223741800field","value":"ciphertext1qyqt5w900dpc2ww0ecxjfwrnjpu8rh7as85w30w4vrg0lztxvvr3kys07e2u8"}],"outputs":[{"type":"private","id":"8223556064190914470961963078886551688024216909939218208379401386897921565470field","value":"ciphertext1qyqdfefztlmpmg5rx9k2afrcnj6pkk57rwrydcz62reaylvjsk32xqgf3w2l3"}],"proof":"proof1qqqqzqqqqqqqqqqqlrqunaz5t5umy3gkve9d2q4rxzzvl494mtznd65vz8alh8gt6tsgwmlj46qytnq4jq8ptqkjjx9cp9traxq2l5khmdw7gzy5ewy22j4ecapxlhj2hrw9ngfs0p95lerlnpg9hc36n52ekmg0gf4ww2dgqxdwp9c89ggm9440fcsjsdxrhdtujw580uf00gs752gpmnt7l990c04lqam0ltrfx02n0ve0racqqqgp9qwu7zspf2ay94hgzm3ptx7q83fvfvm9fhat7pje349jynnrhd08eun7e8482h7dpngast4hm2ssze7xcx0cgrwj2qryf652qswdqeprwut033dcvs4nk5v53mpl5p9g0asthcuxka5kceqnfzjnsh47sz5657pqlpr5ega8gqwkjvs44cay3vzezjra0gvtdwx6lpg0wpqc3l4afvsyey3y27s5wy37r483zq9t39ftgck2yys6ev2h970ul2mhvvnh85ayeu6vxwjw3t5z05u8yc82tqze6l29h0pdpyv5wd4jtzq26ry2sd77qdewxftacmvergev45fj60n8gqgsatgz3xu883qvs7hhcutdlzy978a0vjummax7an5ql99d48ujx4ygk7pdtykm0ftpf3e7s74eyyhzavrh2vyttsuwx3jh7wt4acu9mskgr3mmwglxe53qz62ysuuzkk6nwg5w028wmda5xd03hfxqxhejduy787uezdj4s8ewxxj8xkxnzhfw2m4asumav55xqzuzactyla52sehlfycun2uyhz6hygm4uhflqmasxzwjrf5m7sj393pmy2tx2pm0hduz2cs9wa34ulqupjammfsp2frl0m2nutydsfgqpekcq4jvqe35gn4dykqkxu59t0jj5wx8ps89rmu387jayrzurc8j430tct6w566qkdx0rn24wr022nelxmqyhxup4erwg2ja2qhfqr2uh4cq32uvpfzslnp2kjp5vm63kstwzwcqhehvhj0uaug9jpn0zzpcfyj73wk2ag9qmvr0854gkwdql3gurqg9dlg3qhv92tmrja2styvx79sjkh9mn0e84gzwqcpsrkhsknx3eldqw3fugwe9s74mxhg2mf0x8mvy42kr225ud65ljylvgq4yrqas62hypflmz8q5fhdr7s9qyqqqqqqqqqqqtstnczyyd0c3wkee74nk5ezq6d6xhxs5adw7zu0j02nz5qegtlfpugma79nfgg82jawzlqtncq9sqqwjpw559ey2fmdyd0lwnxvz7zrhfzqj2gsqj0zmwvla5pyaydlmpe5h9kwgwqsle4td60pjhg6kl7ttj7acg962p5xlnpy6yjx3s95pkxnfjy6dzhw0wyucrl4uw69qtqgqqqfsjpjl","tpk":"6759303554892734046914782623359165254199522205679108734781577225217713721093group","tcm":"8213750259140810553135039912243681880014857492781254855494965302408387510222field"}],"global_state_root":"ar12sf6zs7pvgvxx0plzcwncgkl796jrksz7vk0kus8hejtmw6w6gps9cdwjy"},"fee":{"transition":{"id":"as1k9grqdjtrzk5nanmvalyrhhwjzktu5x4g2s094397dds4p7umqxsh68nsz","program":"credits.aleo","function":"fee","inputs":[{"type":"record","id":"6163319412414624803009790458872788163893468822090638805362798306910952462648field","tag":"6673377153848734488274088792827662881916822271564122150945652881930777403460field"},{"type":"public","id":"4331777323038039894530161079106289923824861001789588315765832002790768237139field","value":"2000000u64"}],"outputs":[{"type":"record","id":"3128820505453021904230972306699513671828270711167863979900388263829162228628field","checksum":"2386258887617788478370743039487747479892978974357608502410126548381672224404field","value":"record1qyqsptssm505dgsqf4agl7xt005pwgy6s6jhkhauffj6tdguc5a92usyqyxx66trwfhkxun9v35hguerqqpqzqxv3tn5vfc67jft8up0gcx4rlnd7zxfxdgrnh4758742gcyrskgzperkk43hz2ulnvj8h6kvzup4m5j2txtlksh798w7xmycc8fd5qqufcncd5"}],"proof":"proof1qqqqzqqqqqqqqqqq2h4yhysjj9uquyvqkq3jt2cujgreph6ezzdxztuhjq24grasye50pa36w47v53568c3mvuxhee0sp2dsnqhhy2xseadt20u7h6heg5egzflpa5euxug9xvjevnd9l8dkz5zxsp048qf7rdzvkgv3z5y6q9ul4td27d4hxrdkf4fp8ffj5tnm6agy52kqaq3hvztjwct59gsjlny7n9xxpad3j55czmw942hj7qgp0ql4dd07qvdv4598zg5rth88qe3vpfpnsnszvjcp7rmqz8eex2u2phgk4t0yqrdljneq8lv9623sph882ktm6myjp4fzcxcvyrqwjftpp65u3dfc0xakywxwtrw43nryh9sw598rr8lq826dpsqnh0fuqxp65rh6tf7lkppzp8wuffvdx9k48js4ffu65pssh2f6gltssg5uudw8x00hedhkluvk72mm288e3qtkmzgr7zcd9wnfkuqlkktkrk9fm08erm6vwwjx7cd4czpn0lg953gv386e3qt94jejjjwt9cpksqqt5hjzfhexf3tmrjtk3566jn7qsctfqmexxpx0jksjtph04jnlcwm8h92qfdtv2y8dhhg3kutkt9sp5mq5tpg8yfem59a8mecqpe02cfagfp922p4nxwqzja86frcpsezwucts4g69zux2gehr6r34lmlsqc74eaes9wdjhwgsngp5tk6ya26ddmg9vkmhs5v3pqtwwe3leppaqt878ecwl6hkg6nyg0mp9xsjsyd9dgvu9xvqy375sw70dwfyl3e2q20wtkkczfmfjslnppuchypqred3rnf0ntj8096n8v98yrt7yepypnw0a2zqveltp5ea7nnc6aqdfk989lgn4g4swhshydt6leqnzj3t89xknw36jad5mms600vqfvyfqhjjlvac6eklvepxez8jfkaagvgy8plqekd9dvps99jfxwsvxpwxjcwy4cnxh20ewpgqlvg970l37acv2jcnh2hwvs8jdvfdnycwp7w8d50mdh6pj0qf3r9ajrranhhzzdsmqfvj279akd5ghxssgw8q3mpjk00cav8g7z5auafuy0440tgjeukzfhgdyxeuqjmaf7rqutg2p8uqauvjd9qr8k4a8q04mapmk63tn222hjtx03appg0anvvmkcyqyqqqqqqqqqqq5ae3ykuchw8s9j72g9smzdj0aykdwmzky3k6f5l389jezfej9q3ldk9f537vljz8fadpwzsv0uvgzq2f6x6r9kczqaa493ycgqck3mhv9j7u4ed93hadz090qa9q0q5kp082jsa5v8fam4r63uplpku2njmf0nzpdcns5jnx3dc9ccukmq82ukt8r29cxgv2x58vwv96jhjl9qqqqq2ctn32","tpk":"2972942059865649609176692698866590475125487138002396325321894417117350193302group","tcm":"3686472841309626273997881482970777158269018154897390787485349777321250944935field"},"global_state_root":"ar1lpal4k6d08ucadndzleet924gtd7lr96twuy82ymn67d0ccmtugsjduzfl","inclusion":"proof1qqqqzqqqqqqqqqqqqy5tcej7hxsqn50h8yu9npf4052xdf402tvn0uu2nns9pf652wa68t4yyj5q8wxg9t92s4ff0sngq5y0rf2rkdjeucdsjhmyaek0e2hxdc72jkxu0684uzqa0xuncwsp3wyrum8ddzjac4cgm4uk4nppqrukgxnegfnex3g3a36e580ppceahdc38sy8h62gammewd57unulgq7c3ng0ypg3an8xclavv0djyqgp7rn9dw52jg45qcnxln4far37ry53vu7ehkhxrzmrmqmnzwy3k3agzlzad7w2frksdjy34t5at3kqq9ztjnjjtc64yzzc4wc23y75k2lzpy7000n78fs7a5tttceuujmh7gz95n55x7cv4jq7vrrvn9qyqzfqy2c5fqfp6yvjrwm5q72a6sm64zpr3ay2ev9k5jsqlpgumk0xg0xxlk3855x23esmyd0wqn3rrqpzt9r4z7knautewhyzmz9zxe4hpqvnld4m0atcpm8qc95c6qyjx70tlltqdmh3hp2e55h87yfdk6qwker0wsjxq5787dyv8d434ryptmfz028gj3w8xrezndgehn95m7lcxmze5cwmv3tu6mahfnr6qpypekqr6rc0w20tma9n8mkxnf4pwr6uh5k5gu9xxjch40lummjn47x9q3mpvtevhlz0pratdnm30dysp4y0t4525udhpxr90nqtls6lyz67lmlq8ane8cns46gyvusa2hr3xlkagpt9w90sgpe00c245cg3sqlltxzmyjrl25z960qkkn5ug4f9p3zvpw6sc5tchyw7q2dvhw7qgqmpghgn7tufmxt2ez26fe4adn5ln3pjgmuv7j3r4v5d2844thg8082ky69vudn2dfrmcp2sk32dc4kprrgayey6w6jw799qrv0jdcp72yd8ymqefhhjz93cknkxhhnh6huxpvdjyqce23lew2lu082z6pe6c2vvtekrnp4l4mukc0vpjnhc4chav3nzphk62w8554vx7h4zpxm4tg2wvzj6u8m5deqmxv8j9eft86cswvzrw0teec29nskwkljquujrmfc9rcezjnjcejqx59nf48wycn3ul59ja3zz09h5vszaf2qwqwuzpsqkhsxp8wkg78t58uch2ahu3qgh4zwf4373egtharzr4u8qyqqqqqqqqqqqlrtps4ny62vv54umh94rtkemzd3j53h4sjpmxcqh49jz7vzv9sv0t78z7s8s2hlnp853cu9pl2dsqqf8uutynjktz5236j8aa700an2zqvk9jc02lxdzsawcy0xkgm7lqp7j5hfx4l7gfcq5gg5k9wkwlkfqzul4j5wtwh3nyzxe6lwj4artq970argxrwrtvzkmdwtgd52zrqgqqq7vdf0e"}}"#;
    const TRANSACTION_ID: &str = "at1anuvpv3a8aven96y438386ncxfucxe8p8fjpwhlg950rzx8cusyquzauxp";

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
