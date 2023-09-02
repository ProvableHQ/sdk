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

pub use super::*;
use std::{ops::Deref, str::FromStr};
use wasm_bindgen::prelude::wasm_bindgen;

use crate::types::{CurrentNetwork, ExecutionNative, IdentifierNative, ProcessNative, ProgramID, VerifyingKeyNative};

/// A program that can be executed on the Aleo blockchain.
#[wasm_bindgen]
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Execution(ExecutionNative);

#[wasm_bindgen]
impl Execution {
    /// Returns the string representation of the execution.
    #[wasm_bindgen(js_name = "toString")]
    #[allow(clippy::inherent_to_string)]
    pub fn to_string(&self) -> String {
        self.0.to_string()
    }

    /// Creates an execution object from a string representation of an execution.
    #[wasm_bindgen(js_name = "fromString")]
    pub fn from_string(execution: &str) -> Result<Execution, String> {
        Ok(Self(ExecutionNative::from_str(execution).map_err(|e| e.to_string())?))
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

/// Verify an execution with a single function and a single transition. Executions with multiple
/// transitions or functions will fail to verify. Also, this does not verify that the state root of
/// the execution is included in the Aleo Network ledger.
///
/// @param {Execution} execution The function execution to verify
/// @param {VerifyingKey} verifying_key The verifying key for the function
/// @param {Program} program The program that the function execution belongs to
/// @param {String} function_id The name of the function that was executed
/// @returns {boolean} True if the execution is valid, false otherwise
#[wasm_bindgen(js_name = "verifyFunctionExecution")]
pub fn verify_function_execution(
    execution: &Execution,
    verifying_key: &VerifyingKey,
    program: &Program,
    function_id: String,
) -> Result<bool, String> {
    let function = IdentifierNative::from_str(&function_id).map_err(|e| e.to_string())?;
    let program_id = ProgramID::<CurrentNetwork>::from_str(&program.id()).unwrap();
    let mut process = ProcessNative::load_web().map_err(|e| e.to_string())?;
    process.add_program(program).map_err(|e| e.to_string())?;
    process
        .insert_verifying_key(&program_id, &function, VerifyingKeyNative::from(verifying_key))
        .map_err(|e| e.to_string())?;
    process.verify_execution(execution).map_or(Ok(false), |_| Ok(true))
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    const EXECUTION: &str = r#"{"transitions":[{"id":"as1ft30ggjsmlcq8k2g0jrwpwqttzrppmsflxpahdy4j4sgw4qyjy9q8rl6g9","program":"hello.aleo","function":"hello","inputs":[{"type":"public","id":"8283321375782684809364826500642509555548612084422268052670922008177111745683field","value":"5u32"},{"type":"private","id":"5368761932371535746650746013387057027989854662434909484917682198278381300816field","value":"ciphertext1qyqpmtcduc8srqgrfkrnnly0uwp0d80zp7wlpz84ffad6gap2dqmupczpep2w"}],"outputs":[{"type":"private","id":"3693756292136946047435650150313989632920577493212047963103971996127625717831field","value":"ciphertext1qyq8279hhrglev2rdyph7q99zmk7mvr3zah7yzdwqyhkhxrg8ly6vrqut3key"}],"tpk":"3797902453576577290599111559391674628434683675500311957418919163500389690495group","tcm":"5332148962138650513930613853849801427262922921011368206485254279725063791390field"}],"global_state_root":"ar1smlrxp33w4w738jw357r8c6sjcncyngpl86429ldswd4yh9recysl3eqzw","proof":"proof1qqqsqqqqqqqqqqqpqqqqqqqqqqqz9snrqvytdx0mj8aqc0twcs3fvewzdquejx5xretgzadqs5yyee9d6unwzmzpq5hc322pwfutdxgqmukumt9q6937r6hxqrtdzhjqca43rv4u73d6use45fwyu0ggef06dr30kv4xx0sfr6gy9dfzcynsp6qyp42syzhv5rr6v8ygufq4aaamyw7yp8pkngnnl2pjkd60wg328h34qwh4nz3uesmsya4hwhplsyquve0wdy5752wevkwkva6xydxgdet9ymr84as43hywjac2dl99dwx00efcz82p5vd8qqs6gljtvjgp87w8gv9je20nh0aaz3hwk905lcfluredycwzuw0sgd6tz5pr78uam2l5n4mht4gr0wt3kcdr8gjqrs8nhged6y6nrfrzc73frr38wcp6r0vw30wsje36yzqzd6kxcmyh4kzz67rchrtxlkush8tzxgnes8urunmggsdmm979z7twuxdnjqvtpqukzmtrp7stuk2sx2v2kw82eqxjusrugyq329qjzc76nrryaqzkhvzlcxc5uul36wha8ar4clyurqytnl36cvtssyknnv7p4vdtyuyhqtr0madef6zms6cr4krjeuqxwr2akfgl2sm2mnf802qdtsena5vl6x0r5cz2fq0j8pxt4w7hvfu5la2t9vcsr7n36ym8hnzrdfvqfk3n6w25e09tcln666vslq2tala44n3hkcu4nyrmg3sf0h8w7c09275q6mka9e5k5uqjrypzle9gp93dntqwxseavpdsnq4ds6jq7fu2xwvgndyp807z2s632cswkzggjqdv2gnk85c8hkf9nx34ewygeessf4l4fekqddw0n7qxaw0kd5ptt4nfsgq43s5cjn5pjk2748tfs3f8pnyc6q7dymjenx78puxmsz4ptc0dgr7ld060pd9z6cg8xpepk49t9ryjr29qylnhpty6cfefqv9lv33qh3zjcc8mq9v82van7dryj2wlrta49jkp599hmcwma6lpzqgqqqqqqqqqqrwaspy63clz0qfvamv9y8p7ss95ac8hx2c33hyu6r2dugkvf92q267sw726nrwk5hv5m2mkk596x4xaajf8nxzl58pf4uyp2ackhfgwc2gdlvws9ffahd5txux8uw5x6h4qglg8n7atscyl38q0r08u6cpqyqqqqqqqqqqqfj7hke8qaxyxh9yhnjl7f4nffdluuwyzuf422zv934r2at3hdy8mshzc36uesx6cvak9lay0cp0cqqg582y8hhnz97l3wcazncfd03f50cc06wwfzvpcv39vnd8vkw8mpd749jxcsspc2wkkzjs4hvgzvt5hz4c0znjr66nwqhlvvyfuysmeam4hc43quf7t4dqqzwfc07uj8qgqqqhedyvj"}"#;
    const VERIFYING_KEY: &str = "verifier1qqyqqqqqqqqqqqqpg5qqqqqqqqqqz3gqqqqqqqqqz29qqqqqqqqqq6k5qqqqqqqqqr34uqqqqqqqqqqvqqqqqqqqqqqqargtfu2ekfe6nm2nluxr7hsntw8d8pw8py4kksakmvmftekqalm0ft87zvp700l0xrwzhepgxjsqu59y2mh745q6ktvnw4ux297tkt7ulutje6x2sas2m68sv4uv8fveznpansnu2mn2ju0wzsj265acqvdgs3h3f4dzvvwey2h0llg7m2kdf0ep56d4qa35w58rqtw5dk404k0v4pxugpepcdz8tf4yn83asr506de2s8gwsfj5xvfcdm9w5cz0fydp6eta7tkt9dzy6vwy0dqda9gkh292fn68255wgfmzctkqeqgw7nk9neykf95mfnjfet5afsjdw6jujkc46zf24sayq7rkt8x6mmy9n384z25fy28xtrqd8ysqs6qrvjyce70am48hs796xn8wvsvases4skqnk9zsg4720e5sv5960d7579wzu9mkfpjar5s4nlwpw4uqqzlx4693ptsakwax2q6npajjxudzpc6ckqtyl0tkdyxa50s6deqncw3mmepgvu4rj4uzd6mku7asqt9rjkzc8vjwe5cxxsvgclm6ervsejgp8l7kl9tljd4n24kqt37g2uelzxl59vr0l5p6p4dfjnnesztj77v44g2putadwk293a887lqlxjyfy277p6c6rc2kvy39nz9rcau9vze56zdj25gpgzkxcgcl7qxm0xruxfg76p068l3j22rydy68tf4u66cddvetulmedvu55yxdsyc7a9ujdyufyru3g7cha0n425q7j0zkkej7z267zll09yewundcyj4h8rt7qj7rmlj637eyh2r6d7fxwj65nsn0yxvmfqwnl6jdvy5py4xegnqpyyk5ufe07fwlz8sk5fduencwmt2dtvk7y0ttpt0ndyjswg6h6n4p5yq7vf9ksjewyfqqrtyxk4k639mppcnxjjy7y95ze95npk0qu06c6jddu78nvrfkexhcd9x5rc";
    const PROGRAM: &str = "program hello.aleo;

function hello:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
";

    #[wasm_bindgen_test]
    fn test_execution_verification() {
        let execution = Execution::from_string(EXECUTION).unwrap();
        let verifying_key = VerifyingKey::from_string(VERIFYING_KEY).unwrap();
        let program = Program::from_string(PROGRAM).unwrap();
        assert!(verify_function_execution(&execution, &verifying_key, &program, "hello".to_string()).unwrap());
    }
}
