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

pub use super::*;
use crate::{
    Transition,
    types::native::{ExecutionNative, IdentifierNative, ProcessNative, ProgramNative, VerifyingKeyNative},
};
use snarkvm_algorithms::snark::varuna::VarunaVersion;

use js_sys::{Array, Object, Reflect};
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};

/// Execution of an Aleo program.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Execution(ExecutionNative);

#[wasm_bindgen]
impl Execution {
    /// Returns the string representation of the execution.
    ///
    /// @returns {string} The string representation of the execution.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates an execution object from a string representation of an execution.
    ///
    /// @returns {Execution | Error} The wasm representation of an execution object.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(execution: &str) -> Result<Execution, String> {
        Ok(Self(ExecutionNative::from_str(execution).map_err(|e| e.to_string())?))
    }

    /// Returns the global state root of the execution.
    ///
    /// @returns {Execution | Error} The global state root used in the execution.
    #[wasm_bindgen(js_name = "globalStateRoot")]
    pub fn global_state_root(&self) -> String {
        self.0.global_state_root().to_string()
    }

    /// Returns the proof of the execution.
    ///
    /// @returns {string} The execution proof.
    pub fn proof(&self) -> String {
        self.0.proof().map(|proof| proof.to_string()).unwrap_or("".to_string())
    }

    /// Returns the transitions present in the execution.
    ///
    /// @returns Array<Transition> the array of transitions present in the execution.
    pub fn transitions(&self) -> Array {
        self.0.transitions().map(|transition| JsValue::from(Transition::from(transition))).collect::<Array>()
    }
}

impl From<ExecutionNative> for Execution {
    fn from(native: ExecutionNative) -> Self {
        Self(native)
    }
}

impl From<Execution> for ExecutionNative {
    fn from(execution: Execution) -> Self {
        execution.0
    }
}

impl Deref for Execution {
    type Target = ExecutionNative;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

/// Verify an execution. Executions with multiple transitions must have the program source code and
/// verifying keys of imported functions supplied from outside to correctly verify. Also, this does
/// not verify that the state root of the execution is included in the Aleo Network ledger.
///
/// @param {Execution} execution The function execution to verify
/// @param {VerifyingKey} verifying_key The verifying key for the function
/// @param {Program} program The program that the function execution belongs to
/// @param {String} function_id The name of the function that was executed
/// @param {Object} imports The imports for the program in the form of { "program_id.aleo":"source code", ... }
/// @param {Object} import_verifying_keys The verifying keys for the imports in the form of { "program_id.aleo": [["function, "verifying_key"], ...],  ...}
/// @returns {boolean} True if the execution is valid, false otherwise
#[wasm_bindgen(js_name = "verifyFunctionExecution")]
pub fn verify_function_execution(
    execution: &Execution,
    verifying_key: &VerifyingKey,
    program: &Program,
    function_id: &str,
    imports: Option<Object>,
    import_verifying_keys: Option<Object>,
) -> Result<bool, String> {
    // Get the function
    let function = IdentifierNative::from_str(function_id).map_err(|e| e.to_string())?;
    let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
    let program_native = ProgramNative::from(program);

    // First resolve the program's imports.
    ProgramManager::resolve_imports(&mut process, program, imports)?;

    // Secondly, get the verifying keys and insert them into the process object.
    if let Some(import_verifying_keys) = import_verifying_keys {
        // Go through the imports and insert the verifying keys for each function.
        for imported_program_id in program.imports().keys() {
            // Get the list of functions.
            let vk_list = Array::try_from(Reflect::get(&import_verifying_keys, &imported_program_id.to_string().into()).map_err(|_| format!("Verifying key not found for imported program {}", imported_program_id))?)
                .map_err(|_| format!("Verifying key not found for imported program {}", imported_program_id))?;
            // Get the verifying key for each function.
            for i in 0..vk_list.length() {
                let vk = Array::try_from(vk_list.get(i)).map_err(|_| format!("Verifying key and function not found for {}, for each function provide an array of the form ['function_name', 'vk']", imported_program_id))?;
                {
                    // Insert the verifying key into the temporary process.
                    let imported_function= IdentifierNative::from_str(&vk.get(0).as_string().ok_or("Function not found in imports provided")?).map_err(|e| e.to_string())?;
                    let verifying_key = VerifyingKeyNative::from_str(&vk.get(1).as_string().ok_or("Verifying key not found in imports provided")?).map_err(|e| e.to_string())?;
                    process.insert_verifying_key(imported_program_id, &imported_function, verifying_key)
                        .map_err(|e| e.to_string())?;
                }
            }
        }
    }

    // If the program is not credits.aleo, add the program and its verifying key to the process.
    if &program.id() != "credits.aleo" {
        process.add_program(&program_native).map_err(|e| e.to_string())?;
        process.insert_verifying_key(program_native.id(), &function, VerifyingKeyNative::from(verifying_key))
            .map_err(|e| e.to_string())?;
    }

    // Verify the execution.
    process.verify_execution(VarunaVersion::V2, execution).map_or(Ok(false), |_| Ok(true))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{array, object, types::native::CurrentNetwork};
    use snarkvm_console::network::Network;

    use wasm_bindgen_test::*;

    // Define an execution with imports, its imported programs, and the verifying keys for the functions called from the imported programs.
    const EXECUTION: &str = r#"{"transitions":[{"id":"au1gf03lcafgplr56d6mfkwtgustrt0h0sd4n0aeyr0ud235y2khgxqra3au9","program":"puzzle_arcade_coin_v002.aleo","function":"spend","inputs":[{"type":"record","id":"468972881160888212797460250580763399973716802791845159213598336092905269890field","tag":"7008667480200141136405996288928959860890748739112155826373118082977592774106field"},{"type":"public","id":"655209422175581803548231106018842849747922300478308053675720492648812512839field","value":"1000000u64"}],"outputs":[{"type":"record","id":"3984638493635366279923077280943336690730730952956791803965737826718470639711field","checksum":"6770359637417915754028194609953088871668401175494586195972492296185408981574field","value":"record1qyqspldp3zxx3fayekvhy90vaesjdsk5w000wn7quz4wgf4w55qacwsdqyrxzmt0w4h8ggcqqgqsqx33lkug6cv387ekjkcmqlqe85egfqtuhvrfqcxfdcz7gkvcgdqtjxvuzc539arhftkx0759ckg5xu56xkyhk4uuv970u68ntnggjurs7mvnp5"}],"tpk":"2524298112890568905716864005008442987907637861861648987186876387922032011879group","tcm":"5491821158703993269743905166459888728872021561998903993009057768032928550133field","scm":"6627807389724451874017442132583908307140424076316333932951927250234670804204field"},{"id":"au1f9gp98nlem9szk2dt7c0mds6askjwp98paxaawmfuhv6cqzsjsyqjg62p0","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","inputs":[{"type":"public","id":"2986566263446887063794362776302777429042971429894576637441965387696041855594field","value":"aleo1wkxr9y3s57qc98ezkcjh7kjmnnt3vsggufx7vkwl83yl4qjy659s04d7ay"},{"type":"public","id":"2412341177881583379123884670877471991635211909079548285940939321454945510240field","value":"1000000u64"}],"outputs":[{"type":"record","id":"6330359446182210186410509141710359781507999344591267053405718020479597145115field","checksum":"5670024843691954710033616217367364449615738940704978782434484669084362141130field","value":"record1qyqsq024txjdvz4nplvakhus4f8v8vas68jsmzgngj0c9dnf5dzd4eq3qyrxzmt0w4h8ggcqqgqsp7nn9nyu0y4t43rdeh7rljc3gx792wgrwlx5ye2d6n0eef4kvasgd3t0xc2kdphnkcdtuhtnd043kmyqlkau5wrk7f8nw5l797clxvgq8g8y84"},{"type":"future","id":"6148356551388814966873826112629900698217394490466896776404058880239631589185field","value":"{\n  program_id: puzzle_arcade_ticket_v002.aleo,\n  function_name: mint,\n  arguments: [\n    aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n  ]\n}"}],"tpk":"6763526288812388958196935362146356074712219006970933455946273863381693257127group","tcm":"7644881090796555313419965958053875240769664159974355054577386532842939827164field","scm":"6627807389724451874017442132583908307140424076316333932951927250234670804204field"},{"id":"au15zgpaxmnfe2nghk8hd5mwv6v7rau4th5dd975mluyvvkwy6m3gys4s5fv2","program":"puzzle_spinner_v002.aleo","function":"spin","inputs":[{"type":"external_record","id":"3657099856192362447562455210620424239916338314845725379627537125797271281776field"},{"type":"public","id":"1050032876721214936319508278319054788640794433724345163208508047599177096676field","value":"{\n  nonce: 2611161643field,\n  tickets: 1000000u64\n}"},{"type":"private","id":"6831043576821685063070281463096821638661843919947373910952918365839227244975field","value":"ciphertext1q5qft8r62sf3y2c8khfu8rwm0yw65adrq9udej2e6lp495m6njsgwyn4e8wdrv4ll5g7utf3vyahq7jtxm3thndusexe420qa044rp82pkssu7g64w0gd4p6lz4utgg7lq2g4c25cdt04e5z32td8y606daprpxye05thlsdd4h9vyg6flkz8lq3ueyevtz5wh5fqedwdkkaq4c2f04755wmevv3vxt9tt4ypztregljtl0l8cs95fvr70v75e7dfvpqer4shj"}],"outputs":[{"type":"external_record","id":"4844513159397649703183752080709234198621913986390546010266193801671189029875field"},{"type":"external_record","id":"2143774523485591129102020693334976925435426332171564002988460326059874830827field"},{"type":"future","id":"6470142515518902817746908081273696969033518533562106046353126320190055350885field","value":"{\n  program_id: puzzle_spinner_v002.aleo,\n  function_name: spin,\n  arguments: [\n    {\n      program_id: puzzle_arcade_ticket_v002.aleo,\n      function_name: mint,\n      arguments: [\n        aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n      ]\n    },\n    2611161643field\n  ]\n}"}],"tpk":"2283523472746106614482469242954047815218446591218967910339885350712018381267group","tcm":"439456266966011141516667763490924337820682619374557141872660673039352193293field","scm":"6627807389724451874017442132583908307140424076316333932951927250234670804204field"}],"global_state_root":"sr1cvcs6g0x7apc5kh84vz6t425n5hgkmf7ay0pnjklaj057g0jzvyqwf36wj","proof":"proof1qyzqqqqqqqqqqqqpqqqqqqqqqqqqzqqqqqqqqqqqqyqqqqqqqqqqqqgqqqqqqqqqqzufef70dkrwjn7lqp038tcsucyxfta5cct0nxua5fghcp54rqmsjuq6tm6a0xpm4xpamq35upkwuqxt6wpdr9k960rkgv2dz4ulk8h35pwzwdst2r85p99hnw5u9pacgdl82y0ky3ma38snngl07qr5gsqwshagazaasn5npagl97sqlvz0v7zcjj6av5hsvv64q53rem0a8z69ucn643ac3nk2zdnkkgkzg3vpxn49yk3780mazp847z4vh9a33y4yym7ehn2vy8tdwnag0rk4lz5n8dern09hsxr4tht0zhmgtz4gqqf4jnm7h0xdvexyp2cw504adl4zu6y9nj8fk7l3km45mwelag3k678dvgypl0j4ga8rulxt4j6rdsqjlkan42sgynp4m7tnesz7v959gn7uf4e4z2xjelzdphe9lf0gma5pq2u9zupzz5d8ny333e90hnuqynn434hxfr24ae890zuxyruav5wj2pgmahusjn8ardj5hlln73rtewgql88u0sdcysk5dnttk5tqpuj93av9zzy979alq0hc2s49tre6z8r5ryy4nn4lqkuetkg88va92l6xmngqjkxr7mh37l9a4x0xqpqrzdve6jglk94lu4zn4pplfspt957as629fwxqfhx5vp6hjnv65uw6c5tq8dg9t95c2etke9pfsqy3lkmzntr6rkevah99tsh8r6l5ze0d5skgavj2aftnj3guh54nd2dadsfn7u3v79nfeustrtjl32qlqcd00fyatm7apngxczzjrztphdwg36gazkw0huaa37pveuc7dmwucvzdk36akv85q38tjz70s4cqzsv7up7prweyen088h3xz8h3x8rpkafnmrgu2nsmtg0srdkmmjuy34yzezfqythy5rnyj9rhzuqqraz4tv8j0fjd8ue9l9rfpe8zuea8scf8c9hlndrzezhnvycd7g7x7mhjf9elnh8g3t3cxnlm654gsq9t96n4cjh8w9ygfvyu8txf0dj55g7rjmqlxsh3sq0wy5ustwp6urvefzvy5kuaxlljtcxv226usq9vs04zjd4k2jqqh4kcrms4a8xjp49du5r49p4cvdcasmwupt7g4zlxf3rrped8sda50mjs4d2q9xqvt4c3a4qnwtfhyy88l0wrctmpswgjl9htqx7hdzacwje96dejfp90glr4eycmyjdp5u947hp9xccq5ggr4kduy8qk580d6dut9landl9c2y8jkxgr06ayuh4ds7pq4h7a60juhsr5rywm6aws4nzhxt2gprkzenkkad244e9peqv6jejvq9rnlek22ejcy93nsf6adxetvmx3tnqdgrc02z55ytr9xntmhva3qq36z6ntcyg696uc78mcw564mt954c0jl78psv43t7ce7k4wpsd5ndp9d59rv4gnvewfzm30785cgqpyxd95t6657psfrn609kfma67uhfdrgvacmqgysgqg9zcvs06xw3ecddqqy9h08t30wj74340jxjqn6vjmtlse2jfj4keyw5rrn0sqkju83g0d8hwnvcggzwrwmuxjwjuszunnrekcvxd82uedehdueqqqs8wx7lme8gl36smnxdu6wns4qftc8n0n6h0j7a403c2x62e39qpscu0hx4fgempmj2zm4d0fyadfuvn7xhgjdc5tg95r2hsdqngu5rvfnphdk2alj0pysx2x7dye7h6jxjjr6qhcxjr2h2azeacjsxlrqnr4xczk50cz3wwf9r5rrhdddu4afch9amgrhaskr4lnhhcvxrnqth58kfjnj3k7wfplz9eezv4hch07ny8e5fpyxrug0d73lrhn8lcpe3f85r6mg5f358px0xguzyyhw3v7x4ax8fjc4ky63rtgvpznfu8yyfr3ungqtqrck4w5vm9lfw6y4kwntfszxkrj9fcqj5js26u0qqm0hhel24539w90qevgrxdf5vegcayadlnv7lmghk80qhjls5n8qlg92ne24e82ws06vu8ru3p6xx8m4uxgjg7lyzc4xs4g0zt30kzsvkc4cujxeq62jle2cqfpk27sdh8qwdwkqyvw3rvlvlgy20x4fggrnd33k66le5ea3ravh2fus9feshyw8jfwwm2hydl0qpgj3xmtlu9f2t0l0aew79rwt2s8cj4zfftqk7agq0fxwezu3dsq52ns765fup7pdmvspadtyqck24chjxn2utr47aqu968g7heyskxn24usyqafqc3ks8fh7wdyep94fmejvsx0f9kgsac5tj9ynn4snjscts050qz3p54g6av0hygj8gyf543stqnl8grdqvdlhyzce3qtrr9f3nyegeg9arfq05ckfvum4u4era09qqswz3mfpkylj3wrne5shnk256sd4gquzada7s5uqm2ydc0fcxxy6n548xd7s6fgm0scjdcy0l0ywacz6rxyr4uxuk4ka58wh7d0qpw6rf2rkxy7t7xfa5hkev3auzp9kzktpdvlq7hedewa7zf5h4a6k6qp0rn9y02jcyr07wzq6r83xntt50wqyxg07vr6af2xc4vs5c0fjp593j84psdv783hxurcd5ksc8tg95crjvmmkr2t37rzwmtfgquaehfm5c3n7q8we3t4fqwyn0l0hpn8ms97w23k7wgtuqln55appmmmdmf9mf5n6r3dwdt3py5ettphk9q7urucmlmwdp6pfyk030j5qx26csplly5g3xrd4scxje02mj9tsmuapauqcs8djgy8gd9dd3ysfms8ds796avewwjmmfd736k2s9g35g3sqgpksfeu0muc547tduuwfmm0xxya50782mcgenkhusyqme0hmeg8hr7zv22f9ye4mt485d8pqqxemq7v3p5zns6k9g8z786lqkn6lqx63c2dp2yst78xdvm0ar5jht8j06kuf4a6lhfqkw9r6qdyhmfjqqqy42tfxquh6y2gw5nkp69luv0mr4v4yp97d3z6yk6w0r946qxrqh9n3yeh466y9n2ll33lvejkvkvpfck5ytfqzgpvtw78tys2jmtqt0m73s5xj0qyh3zt0fk0fz4g62y38jjkw8ynu8m6qtzm98n4jhgthkqtyrka8dkhn9anrw6xlcgjp4rp3usj4hpqtw7tpg30f45slsxglslyh4muu96hpjcqxx2f5g0mh7qn3qjkmupdqjufyudcsrvxyqgt0ts9u9cw0qjh3yc3jcxl4x8hveukl4h3weqm20n4j6kjk0qspdamqwx33za0rr2dauqekwj49zg7emca64p9sjwk6m5dk7yc27wsr5lrkert5eywvw9f58m8fsrmsv7rlt2r2k6kfxq9wpl8rpfec9cxgtv825yvxv4wgapc7elwgn53uwc8gnzel3hgt07tkxzlm0waagyn6ds7230quege30gs644r84ukxh642mcz5y0su6skv9fmdkehgygrqqqqqqqqqqq98zgt0vksjkraaqzs2etfmh0rdx8luxremgqs0z00qh9attpnehxvhjy5cqsnwxrqjj62wgfn7yvpqz3uhge8hc7zttuc9akwlxq7xe3py0rh0typdtt4p4vje75u6vy8nk66r8ysllctk7ellfrer4htaqqpud0zyeerfmmqqq2hktrh4f0whyfz6p9qcq43rws8jsh8ddns2yzxnr2c9vyywdmhhgxyz3whgf99jqp20jssfjremf9hrex83w8zsyct5f0ydsmg32dm0s6yrfrlqhvpqqsfgg8y"}"#;
    const SPIN_VERIFYING_KEY: &str = "verifier1qysqqqqqqqqqqqzzesqqqqqqqqq9fnqqqqqqqqqq2w7szqqqqqqqqjqmqgqqqqqqqrqzxqgqqqqqqqqvqqqqqqqqqqqt2dtvr8ymtdl3vrxtqnglst8n2y4dw4hq593utwy6nwq8klyyaxnyrhyhjs8x7zusy83anzzaxsgqjt72tq53yqkh8v4a6fwdft3rhle46d7zdw7txye2n2zmlxdgjuzq48sa0ed6pzwma7gmvwd9nv2gzgupptxnpuguu62uwlpgs7lrz4ydc25fgpld3snp7pe8k00t7ca2c6huf8wfw2sh732kgpm4wqqgqrr2vn20vyesyrkl5udy6smm0knuzfktqsffavp8mk3flgfz05d8jf6r9j9gke8gt48nn7lwygvm6qrprqq7rgmpt68f63krye0xwd3fwj79pt9cn49wmu4xld78qfqxnt8wtnxq9wluxmyn7jqv93zkljqvr5l96c5uz6xxf7xxqngf0788wjkqx29qntkl5jn96zwcnrxx75ez753ujk6ud44ltg5xkhd2cevqaj3asqd5d780uekchldlfcz2grpsfvnfy9wv3rth262xxkugw3w3pcdha2rmktf9n97uxtjdvpngzv23f4klaakas9tphfnwj4cy9y54vty7ndt93g5vzwp7pegyvegjlln3ura35jslp9fkkugpnnchsx62qysjlugey9qp342g9s63k6hxh7cf8xenn6gld9d2ep8neynx69v3yd5723ppez0qh4ukvq5yhq02n0fqt7gnhpfrnm709gldsfrc9gpf6p3gmqvpgupxdv56vvlgwjk68x5yzw229u2m6gn8a59e0zqkgjx03r98hkddusfthpj8mvapwfxm58cn402csj0jjqz9xp52snptcmtpemp44ugnxxhl4fnrgnup7h979ghu726u2j0hsy0rmxnukxhpak03su6w3lphhnz37sl87xc05lwu7fks0z3k7n4edtpxtezgqd59vkyu9l3zr8ueusmgut0cz9d0cz4z4mmya7238yegyjnuqv7wuhasqqqqqqqqq3ma3cg";
    const SPEND_VERIFYING_KEY: &str = "verifier1qygqqqqqqqqqqqraj5qqqqqqqqqfr9gqqqqqqqqq5vtqzqqqqqqqpk3gqyqqqqqqqpdwxqqqqqqqqqqvqqqqqqqqqqqxkvyhsn4lxgveknmux6sx6x72vz89e4pmakfccprhka5hyfdjf3lhl87g754ndg9yk5mutpjc9f5qd0svjg7nmvwlhrwn9k8n8wphltna4tr3vq284lfvnxutsxwvnfs5vvdngs5wgyfv8lptaqcsze6cpj6mgha2yn94l6tf7uchsvhzej8wychzfgqjxa7pg2jf5hytkfe52zyelspw4v8zxuu8gyxhstvcqphj430e7j2d3k63hr3mvd79yamfh8svtfd75phnvevpwnm8eczkad32ydzjffm3awhneqgmlk655qw5xzmjclm48axw3cm872uacfnz7dzad5sy3c85x828dudl8jljw32h85th2hq9hf6gvq24jnw8ygqg778x837ws4lxma5nu7k374vx9gswldaccrjxj7403sra8yns8cr3jj8fg49qmzck7thqzf6g0yqpn62hqqw5c48rdc39gupk2mu5dpljuxx4h8gnrymc468up48zwf4qv8trn2kxfnlvkn949k6j3kdczutluvqdr6qs3yc8yt2hty4rfxkvwtazjvck2gp6d4kkslr4sk6g30325st6upkx0dw3f54w9g7pspy5aw8ar8qf4neyk8p2z4r7p9zswsr2gn5xualuvxkqq438tyx6rfwcdvwye6xw7fumf7lg0cx2zq95vkrt06hj2tyw7kswlcqnsjk9mn2f64n6pd5xj9d3zq5ktaesmajysv8znp2p7vqm35spm90er5qnmupulwrdf02davqnfnhlpkn3d2lgrhzcuqwmfza2zznrct9zfxqrp9nhzm6yf2axrcdaxczzeuyq4yvavzmuyt49pzx4t653f676qngkw4yc6qfgykym8luprh8zczptwh6z3j24mprqx50rcynr49rczdzwzu80h2a35d8tnmghpa5n9t2c6t2kaetgdk6yue7rvayetm8camyqqqqqqqqqqatv6mn";
    const MINT_VERIFYING_KEY: &str = "verifier1qygqqqqqqqqqqqpgtgqqqqqqqqqzjksqqqqqqqqq4xmsqqqqqqqqqgknqqqqqqqqqpkgsqqqqqqqqqqvqqqqqqqqqqqpcgg25l40ndttqs5lv9s0a2guxc325jwh9ty3uvsymt3n0l80qye5eun67j64xl2tpa527gwfsduqng2shl7v4yflg4ggw38hnevja6klqyxf7rcxsm2hjlgddtkh6873cuhf2yqhn2hd98w3cmafduyqq57uqqjntmva5tk6w2cpjttyqsmxuy4tfj89v3jvjf9sxlyzjfupmf50est52jrh4anll8yangncs92vsscxhcuzy57qvuxdvh5mzt45ycyyfuh5dyfnrrd6kqv00aahxkhjdem7klh7kq9cx4xwvjqruqgdmnw9004n6qcxcmvna9fcaqzg2lujxf2cwecc28qheax7p0q993w5gpqa55qyf2qdvxdhuw0t3zqfgaapuc67lqpa5yw05lu9ylzfxhckkcy29cr7ps65nrcqralrvxh67g8m7rdudtf04rlyjxe2z0vqvrtqfyk5s0qtr0le9hdn430ep3uuc00ejuztqadfyf4hpklzdac8nrnkg5j04wwh3xq98z3a95dqrgmsdvkekpas97qg5ypqgzms4umeq7mwvydhr7fue5uv7zd5vtvwu2f036r88h77ta566nu4nfjnqxv25uf4qc7lpgsfm2hhc4mrddvsk38yf5dg5ahm7xft0j3wnt94k0y8txdgclu48ggfwenvxw4lwqy0df50pdy2kx96xl35hewqm33krxwhpa2kzkpy0xetk5tjscrwtpyjxkkjrex7qfpvtj8zx6nn8uqh9vhn3pxxcta7s04whvh8j4vx22krer0qv02gmeyv8q83muwn4lhmjwygrnk5k0fqlmj8u8r8tcyqxdwl52yc7ewqtpq38zkxfcvdpeksjnqpthun2hwmyuuk25vg4af96lyyl9ytlk8sac9cxhdnpefcrz637k6kazgryvnjd7tgslszuwg9vkchtv4tc3ylwyer0gd069y7q3usqqqqqqqqqkqr8dw";
    const PROGRAM: &str = "import puzzle_arcade_coin_v002.aleo;\nimport puzzle_arcade_ticket_v002.aleo;\n\nprogram puzzle_spinner_v002.aleo;\n\nstruct Result:\n    nonce as field;\n    tickets as u64;\n\nmapping used_nonces:\n    key as field.public;\n    value as boolean.public;\n\nfunction spin:\n    input r0 as puzzle_arcade_coin_v002.aleo/PuzzleArcadeCoin.record;\n    input r1 as Result.public;\n    input r2 as signature.private;\n    sign.verify r2 aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l r1 into r3;\n    assert.eq r3 true ;\n    is.eq r1.tickets 1000000u64 into r4;\n    is.eq r1.tickets 2000000u64 into r5;\n    or r4 r5 into r6;\n    is.eq r1.tickets 5000000u64 into r7;\n    or r6 r7 into r8;\n    is.eq r1.tickets 10000000u64 into r9;\n    or r8 r9 into r10;\n    assert.eq r10 true ;\n    call puzzle_arcade_coin_v002.aleo/spend r0 1000000u64 into r11;\n    call puzzle_arcade_ticket_v002.aleo/mint r0.owner r1.tickets into r12 r13;\n    async spin r13 r1.nonce into r14;\n    output r11 as puzzle_arcade_coin_v002.aleo/PuzzleArcadeCoin.record;\n    output r12 as puzzle_arcade_ticket_v002.aleo/PuzzleArcadeTicket.record;\n    output r14 as puzzle_spinner_v002.aleo/spin.future;\n\nfinalize spin:\n    input r0 as puzzle_arcade_ticket_v002.aleo/mint.future;\n    input r1 as field.public;\n    get.or_use used_nonces[r1] false into r2;\n    assert.eq r2 false ;\n    set true into used_nonces[r1];\n    await r0;\n";
    const IMPORT_1: &str = "program puzzle_arcade_coin_v002.aleo;\n\nrecord PuzzleArcadeCoin:\n    owner as address.private;\n    amount as u64.private;\n\nfunction mint:\n    input r0 as address.public;\n    input r1 as u64.public;\n    assert.eq self.caller self.signer ;\n    assert.eq self.caller aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l ;\n    cast r0 r1 into r2 as PuzzleArcadeCoin.record;\n    output r2 as PuzzleArcadeCoin.record;\n\nfunction spend:\n    input r0 as PuzzleArcadeCoin.record;\n    input r1 as u64.public;\n    gte r0.amount r1 into r2;\n    assert.eq r2 true ;\n    sub r0.amount r1 into r3;\n    cast r0.owner r3 into r4 as PuzzleArcadeCoin.record;\n    output r4 as PuzzleArcadeCoin.record;\n";
    const IMPORT_2: &str = "program puzzle_arcade_ticket_v002.aleo;\n\nrecord PuzzleArcadeTicket:\n    owner as address.private;\n    amount as u64.private;\n\nmapping registry:\n    key as address.public;\n    value as boolean.public;\n\nfunction add_program_to_registry:\n    input r0 as address.private;\n    assert.eq self.caller self.signer ;\n    assert.eq self.caller aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l ;\n    async add_program_to_registry r0 into r1;\n    output r1 as puzzle_arcade_ticket_v002.aleo/add_program_to_registry.future;\n\nfinalize add_program_to_registry:\n    input r0 as address.public;\n    set true into registry[r0];\n\nfunction mint:\n    input r0 as address.public;\n    input r1 as u64.public;\n    cast r0 r1 into r2 as PuzzleArcadeTicket.record;\n    async mint self.caller into r3;\n    output r2 as PuzzleArcadeTicket.record;\n    output r3 as puzzle_arcade_ticket_v002.aleo/mint.future;\n\nfinalize mint:\n    input r0 as address.public;\n    get.or_use registry[r0] false into r1;\n    assert.eq r1 true ;\n\nfunction spend:\n    input r0 as PuzzleArcadeTicket.record;\n    input r1 as u64.public;\n    gte r0.amount r1 into r2;\n    assert.eq r2 true ;\n    sub r0.amount r1 into r3;\n    cast r0.owner r3 into r4 as PuzzleArcadeTicket.record;\n    output r4 as PuzzleArcadeTicket.record;\n\nfunction join:\n    input r0 as PuzzleArcadeTicket.record;\n    input r1 as PuzzleArcadeTicket.record;\n    gt r0.amount 0u64 into r2;\n    assert.eq r2 true ;\n    gt r1.amount 0u64 into r3;\n    assert.eq r3 true ;\n    add r0.amount r1.amount into r4;\n    cast self.signer r4 into r5 as PuzzleArcadeTicket.record;\n    output r5 as PuzzleArcadeTicket.record;\n\nfunction join3:\n    input r0 as PuzzleArcadeTicket.record;\n    input r1 as PuzzleArcadeTicket.record;\n    input r2 as PuzzleArcadeTicket.record;\n    gt r0.amount 0u64 into r3;\n    assert.eq r3 true ;\n    gt r1.amount 0u64 into r4;\n    assert.eq r4 true ;\n    gt r2.amount 0u64 into r5;\n    assert.eq r5 true ;\n    add r0.amount r1.amount into r6;\n    add r6 r2.amount into r7;\n    cast self.signer r7 into r8 as PuzzleArcadeTicket.record;\n    output r8 as PuzzleArcadeTicket.record;\n\nfunction join4:\n    input r0 as PuzzleArcadeTicket.record;\n    input r1 as PuzzleArcadeTicket.record;\n    input r2 as PuzzleArcadeTicket.record;\n    input r3 as PuzzleArcadeTicket.record;\n    gt r0.amount 0u64 into r4;\n    assert.eq r4 true ;\n    gt r1.amount 0u64 into r5;\n    assert.eq r5 true ;\n    gt r2.amount 0u64 into r6;\n    assert.eq r6 true ;\n    gt r3.amount 0u64 into r7;\n    assert.eq r7 true ;\n    add r0.amount r1.amount into r8;\n    add r8 r2.amount into r9;\n    add r9 r3.amount into r10;\n    cast self.signer r10 into r11 as PuzzleArcadeTicket.record;\n    output r11 as PuzzleArcadeTicket.record;\n\nfunction join5:\n    input r0 as PuzzleArcadeTicket.record;\n    input r1 as PuzzleArcadeTicket.record;\n    input r2 as PuzzleArcadeTicket.record;\n    input r3 as PuzzleArcadeTicket.record;\n    input r4 as PuzzleArcadeTicket.record;\n    gt r0.amount 0u64 into r5;\n    assert.eq r5 true ;\n    gt r1.amount 0u64 into r6;\n    assert.eq r6 true ;\n    gt r2.amount 0u64 into r7;\n    assert.eq r7 true ;\n    gt r3.amount 0u64 into r8;\n    assert.eq r8 true ;\n    gt r4.amount 0u64 into r9;\n    assert.eq r9 true ;\n    add r0.amount r1.amount into r10;\n    add r10 r2.amount into r11;\n    add r11 r3.amount into r12;\n    add r12 r4.amount into r13;\n    cast self.signer r13 into r14 as PuzzleArcadeTicket.record;\n    output r14 as PuzzleArcadeTicket.record;\n";

    #[wasm_bindgen_test]
    async fn test_execution_verification() {
        // Only run the test if the current network is the mainnet since executions are exclusive to each network.
        if CurrentNetwork::ID == 0 {
            // Define the program, verifying key, and execution from the main function.
            let program = Program::from_string(PROGRAM).unwrap();
            let verifying_key = VerifyingKey::from_string(SPIN_VERIFYING_KEY).unwrap();
            let execution = Execution::from_string(EXECUTION).unwrap();

            // Define the function imports.
            let imports = object! {
                "puzzle_arcade_coin_v002.aleo": IMPORT_1,
                "puzzle_arcade_ticket_v002.aleo": IMPORT_2,
            };

            // Define the verifying key imports.
            let import_vks = object! {
                "puzzle_arcade_coin_v002.aleo": array![array!["spend", SPEND_VERIFYING_KEY]],
                "puzzle_arcade_ticket_v002.aleo": array![array!["mint", MINT_VERIFYING_KEY]],
            };

            // Verify the function execution.
            assert!(
                verify_function_execution(
                    &execution,
                    &verifying_key,
                    &program,
                    "spin",
                    Some(imports),
                    Some(import_vks),
                )
                    .unwrap()
            );
        }
    }
}
