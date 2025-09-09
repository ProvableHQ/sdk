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

use crate::{array, object};

use js_sys::{Array, Object};

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

pub const HELLO_PROGRAM: &str = r#"program hello.aleo;
function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
"#;

pub const PUZZLE_SPINNER_V002: &str = r#"import puzzle_arcade_coin_v002.aleo;
import puzzle_arcade_ticket_v002.aleo;

program puzzle_spinner_v002.aleo;

struct Result:
    nonce as field;
    tickets as u64;

mapping used_nonces:
    key as field.public;
    value as boolean.public;

function spin:
    input r0 as puzzle_arcade_coin_v002.aleo/PuzzleArcadeCoin.record;
    input r1 as Result.public;
    input r2 as signature.private;
    sign.verify r2 aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l r1 into r3;
    assert.eq r3 true ;
    is.eq r1.tickets 1000000u64 into r4;
    is.eq r1.tickets 2000000u64 into r5;
    or r4 r5 into r6;
    is.eq r1.tickets 5000000u64 into r7;
    or r6 r7 into r8;
    is.eq r1.tickets 10000000u64 into r9;
    or r8 r9 into r10;
    assert.eq r10 true ;
    call puzzle_arcade_coin_v002.aleo/spend r0 1000000u64 into r11;
    call puzzle_arcade_ticket_v002.aleo/mint r0.owner r1.tickets into r12 r13;
    async spin r13 r1.nonce into r14;
    output r11 as puzzle_arcade_coin_v002.aleo/PuzzleArcadeCoin.record;
    output r12 as puzzle_arcade_ticket_v002.aleo/PuzzleArcadeTicket.record;
    output r14 as puzzle_spinner_v002.aleo/spin.future;

finalize spin:
    input r0 as puzzle_arcade_ticket_v002.aleo/mint.future;
    input r1 as field.public;
    get.or_use used_nonces[r1] false into r2;
    assert.eq r2 false ;
    set true into used_nonces[r1];
    await r0;
"#;

pub const PUZZLE_ARCADE_COIN_V002: &str = r#"program puzzle_arcade_coin_v002.aleo;

record PuzzleArcadeCoin:
    owner as address.private;
    amount as u64.private;

function mint:
    input r0 as address.public;
    input r1 as u64.public;
    assert.eq self.caller self.signer ;
    assert.eq self.caller aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l ;
    cast r0 r1 into r2 as PuzzleArcadeCoin.record;
    output r2 as PuzzleArcadeCoin.record;

function spend:
    input r0 as PuzzleArcadeCoin.record;
    input r1 as u64.public;
    gte r0.amount r1 into r2;
    assert.eq r2 true ;
    sub r0.amount r1 into r3;
    cast r0.owner r3 into r4 as PuzzleArcadeCoin.record;
    output r4 as PuzzleArcadeCoin.record;"#;

pub const PUZZLE_ARCADE_TICKET_V002: &str = r#"program puzzle_arcade_ticket_v002.aleo;

record PuzzleArcadeTicket:
    owner as address.private;
    amount as u64.private;

mapping registry:
    key as address.public;
    value as boolean.public;

function add_program_to_registry:
    input r0 as address.private;
    assert.eq self.caller self.signer ;
    assert.eq self.caller aleo196a39wq9q8ea779cmlmff0c9pj2gl4f5e8fhjpvmufe5utuq7y8snz4h2l ;
    async add_program_to_registry r0 into r1;
    output r1 as puzzle_arcade_ticket_v002.aleo/add_program_to_registry.future;

finalize add_program_to_registry:
    input r0 as address.public;
    set true into registry[r0];

function mint:
    input r0 as address.public;
    input r1 as u64.public;
    cast r0 r1 into r2 as PuzzleArcadeTicket.record;
    async mint self.caller into r3;
    output r2 as PuzzleArcadeTicket.record;
    output r3 as puzzle_arcade_ticket_v002.aleo/mint.future;

finalize mint:
    input r0 as address.public;
    get.or_use registry[r0] false into r1;
    assert.eq r1 true ;

function spend:
    input r0 as PuzzleArcadeTicket.record;
    input r1 as u64.public;
    gte r0.amount r1 into r2;
    assert.eq r2 true ;
    sub r0.amount r1 into r3;
    cast r0.owner r3 into r4 as PuzzleArcadeTicket.record;
    output r4 as PuzzleArcadeTicket.record;

function join:
    input r0 as PuzzleArcadeTicket.record;
    input r1 as PuzzleArcadeTicket.record;
    gt r0.amount 0u64 into r2;
    assert.eq r2 true ;
    gt r1.amount 0u64 into r3;
    assert.eq r3 true ;
    add r0.amount r1.amount into r4;
    cast self.signer r4 into r5 as PuzzleArcadeTicket.record;
    output r5 as PuzzleArcadeTicket.record;

function join3:
    input r0 as PuzzleArcadeTicket.record;
    input r1 as PuzzleArcadeTicket.record;
    input r2 as PuzzleArcadeTicket.record;
    gt r0.amount 0u64 into r3;
    assert.eq r3 true ;
    gt r1.amount 0u64 into r4;
    assert.eq r4 true ;
    gt r2.amount 0u64 into r5;
    assert.eq r5 true ;
    add r0.amount r1.amount into r6;
    add r6 r2.amount into r7;
    cast self.signer r7 into r8 as PuzzleArcadeTicket.record;
    output r8 as PuzzleArcadeTicket.record;

function join4:
    input r0 as PuzzleArcadeTicket.record;
    input r1 as PuzzleArcadeTicket.record;
    input r2 as PuzzleArcadeTicket.record;
    input r3 as PuzzleArcadeTicket.record;
    gt r0.amount 0u64 into r4;
    assert.eq r4 true ;
    gt r1.amount 0u64 into r5;
    assert.eq r5 true ;
    gt r2.amount 0u64 into r6;
    assert.eq r6 true ;
    gt r3.amount 0u64 into r7;
    assert.eq r7 true ;
    add r0.amount r1.amount into r8;
    add r8 r2.amount into r9;
    add r9 r3.amount into r10;
    cast self.signer r10 into r11 as PuzzleArcadeTicket.record;
    output r11 as PuzzleArcadeTicket.record;

function join5:
    input r0 as PuzzleArcadeTicket.record;
    input r1 as PuzzleArcadeTicket.record;
    input r2 as PuzzleArcadeTicket.record;
    input r3 as PuzzleArcadeTicket.record;
    input r4 as PuzzleArcadeTicket.record;
    gt r0.amount 0u64 into r5;
    assert.eq r5 true ;
    gt r1.amount 0u64 into r6;
    assert.eq r6 true ;
    gt r2.amount 0u64 into r7;
    assert.eq r7 true ;
    gt r3.amount 0u64 into r8;
    assert.eq r8 true ;
    gt r4.amount 0u64 into r9;
    assert.eq r9 true ;
    add r0.amount r1.amount into r10;
    add r10 r2.amount into r11;
    add r11 r3.amount into r12;
    add r12 r4.amount into r13;
    cast self.signer r13 into r14 as PuzzleArcadeTicket.record;
    output r14 as PuzzleArcadeTicket.record;"#;

pub const PUZZLE_SPINNER_V002_INPUT_0: &str = r#"{
  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,
  amount: 1000000u64.private,
  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public
}"#;

pub const PUZZLE_SPINNER_V002_INPUT_1: &str = "{nonce: 1170758118field, tickets: 5000000u64}";

pub const PUZZLE_SPINNER_V002_INPUT_2: &str = "sign1qkveh904rhh9q72mvg7r9p20q54w73w55m375dplgqmg4dj07cqgfu6nmyennfeyvczvdlsztndg3vstm5wrdx8gwl7ucjp8mmlwsqxyx67umlz8tz8pw8zk599sj05tsqczr4ufz06e4jl0lve0k6p3pvyztyddnpcpvq3p66k3ryatluay3cndws6fktfvnytg3hcswahqjdc7n92";

pub const PUZZLE_SPINNER_V002_PROVING_REQUEST: &str = r#"{"authorization":{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_spinner_v002.aleo","function":"spin","input_ids":[{"type":"external_record","id":"2094094279846006863789449599365264356524704258957209392883419734916308087566field"},{"type":"public","id":"5595943493906333085391638370632238393662235874383695353608521124649733340931field"},{"type":"private","id":"6742098636398522089859394195904601600130314965171698086111626341696733948612field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public,\n  _version: 0u8.public\n}","{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}","sign1qkveh904rhh9q72mvg7r9p20q54w73w55m375dplgqmg4dj07cqgfu6nmyennfeyvczvdlsztndg3vstm5wrdx8gwl7ucjp8mmlwsqxyx67umlz8tz8pw8zk599sj05tsqczr4ufz06e4jl0lve0k6p3pvyztyddnpcpvq3p66k3ryatluay3cndws6fktfvnytg3hcswahqjdc7n92"],"signature":"sign1xf53lt5wp9g88h6s65uct4ps7te4p2a3fxt9lnj4mpuflltw9yqrxn4mslff0z7rehgher4s68pmcar9ul28c97kp2qsr8ar6ftfzpqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqg287l48","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"572183841960682933577383606586553460249103306203159528948819230484782997585field","tcm":"1171065817681420457160345788668531223791133417763996992400327530900798825721field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_coin_v002.aleo","function":"spend","input_ids":[{"type":"record","commitment":"3695326969420433429322937563366478414189257375833807166677296859078066945588field","gamma":"822030278715035804872365307657119524241344315777773665392070818824848423298group","record_view_key":"1925121045312432202191309331127274276680205187304403149300554031033906128262field","serial_number":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"2041891405937960445696743302415641847824825632459410269684813295953846950757field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public,\n  _version: 0u8.public\n}","1000000u64"],"signature":"sign1yjce07tv55km8qsfcgg5f53yvx4yal4ruuf9u0eaxku6fq4wrgpg0l7hfgnvpvvalfl4qvces3k9s9nt9ugy6wwjs9mnu2exdxz3cqsmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgm4ynq3","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"4994084056607172960767483219582395385778247231446264109964208478083811415449field","tcm":"7812759430980949738683330164278254095249178692436543417615689108707612536911field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","input_ids":[{"type":"public","id":"1046274269999797229672577130372021146162188188700658720275906690284075339674field"},{"type":"public","id":"6672330946491079853759778561061110692770616941692333781924093458318671076471field"}],"inputs":["aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","5000000u64"],"signature":"sign1ycfa5yhx8magvj47z7ucdaaj6dqaglhgdwzy6930uh4qx8vum5q9wx7arq707cedudzld6mca2gzdex90utr0eezl8y4479sc02a5qqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgx56dh0","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"2873294706176964472715353629140777692023106080534816614008391405046442842512field","tcm":"6490794758489608132610463651546131626878006045467732980547897283109192374041field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"}],"transitions":[{"id":"au1234a2r7zve0049hcsm3fawmk2frt5p6zvfn4v2algsmmemjk7uxst0z669","program":"puzzle_arcade_coin_v002.aleo","function":"spend","inputs":[{"type":"record","id":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"2041891405937960445696743302415641847824825632459410269684813295953846950757field","value":"1000000u64"}],"outputs":[{"type":"record","id":"6234733124236322387889736135649408851334996209733769544324065144060617746336field","checksum":"440246515958659636861403206156566406152482039155384175770866473086825655202field","value":"record1qvqspknecyxj8he7r7d0saa8mu8h4655jt25xgvfnryxg37td4hhzlg3qyrxzmt0w4h8ggcqqgqspm7g76ludumjncxeafx7hqch36k0q5cdvrxctm0w0h05jx9q0esqty29y8hfvl5sqercpezunplc89k36fxls209lyqqmvun5h30dcgq4newd4","sender_ciphertext":"2051089804256883694774647491009107449590332829064597128043238087312538756881field"}],"tpk":"779450742859646977077288858452846617400181919260356985744863858124988996579group","tcm":"7812759430980949738683330164278254095249178692436543417615689108707612536911field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"id":"au165pk3mj0z8qmd4rjrdpymex0wg2ktjg69jlh0ddgq3r8a8xw4y9qcerjde","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","inputs":[{"type":"public","id":"1046274269999797229672577130372021146162188188700658720275906690284075339674field","value":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a"},{"type":"public","id":"6672330946491079853759778561061110692770616941692333781924093458318671076471field","value":"5000000u64"}],"outputs":[{"type":"record","id":"1130818339127085714202916297407753311196018055225024066502861268664315562572field","checksum":"6564309912145323765833525250549682602535323908901729171643580386651654016412field","value":"record1qvqsp8svu763tlxwmh9wdmdu93fs4ydgmsk62kqz7h2egshvlfjcfcc9qyrxzmt0w4h8ggcqqgqsqlradgpmpxuephuktakm3r9k6849czlyw7nw5u8zhxfuwrhx3mszxrg96enap4k0fmjyhsdqpvx6nyvc8k6t8st3pvrvd4jghh836srsv8enll","sender_ciphertext":"3633731045592752368422559477739611800333912219171005386498755402947798716823field"},{"type":"future","id":"74131887599252140728099600235197072782607427140742230946502591809048135927field","value":"{\n  program_id: puzzle_arcade_ticket_v002.aleo,\n  function_name: mint,\n  arguments: [\n    aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n  ]\n}"}],"tpk":"2840319856609594596522635087311530377650934567024220337860469891161374663385group","tcm":"6490794758489608132610463651546131626878006045467732980547897283109192374041field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"id":"au1jmm0qqwmgl06vr42ya43kcv0pjsgt7huyydtr0j9cvrsy3allqgsulx0d8","program":"puzzle_spinner_v002.aleo","function":"spin","inputs":[{"type":"external_record","id":"2094094279846006863789449599365264356524704258957209392883419734916308087566field"},{"type":"public","id":"5595943493906333085391638370632238393662235874383695353608521124649733340931field","value":"{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}"},{"type":"private","id":"6742098636398522089859394195904601600130314965171698086111626341696733948612field","value":"ciphertext1q5qqkh55w4tat8z30xdwfpzs2rtu8nayf0vtaj8fxzar9d26wce0jrfzq05mm5zl54rjfstpwy9rmdy09k5tkjzc280xzspwrdnprql8qh966uctg8hxuh9pxse6dz25u9ljxyxz6tvgzpj8s8ky3uta7f5qd0lftt5ksmexyyqtzsd04fsqgf9k8723zl4wt2spx9rjr38wrhsy3n56ej9zn88gravxdk7fape7jr7pgdam4g8vuey47ywzdtkrpc8qrsnfv0"}],"outputs":[{"type":"external_record","id":"2735321205447718152398768122882561932543144412730538395102830561769369606454field"},{"type":"external_record","id":"7369296498063689826492338091106358165388792727887425815548124115560783555312field"},{"type":"future","id":"6484631562279855668848888140360023825065176810215937222335315467885649991363field","value":"{\n  program_id: puzzle_spinner_v002.aleo,\n  function_name: spin,\n  arguments: [\n    {\n      program_id: puzzle_arcade_ticket_v002.aleo,\n      function_name: mint,\n      arguments: [\n        aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n      ]\n    },\n    1170758118field\n  ]\n}"}],"tpk":"6590493951761094593568034471222493140361737341714336847530563463808843573584group","tcm":"1171065817681420457160345788668531223791133417763996992400327530900798825721field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"}]},"fee_authorization":{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"credits.aleo","function":"fee_public","input_ids":[{"type":"public","id":"1236904445320008365690109681543399166087562464648307672887712965547911005106field"},{"type":"public","id":"7534378790668398972390701196841804750368436610916174309476130285208807336075field"},{"type":"public","id":"3839097647761853616188014373153230802709413936709969178171401168479940342742field"}],"inputs":["1000000u64","0u64","5861750103935316794608259263097700543376455430267921167932279423298832828187field"],"signature":"sign1em3pwu4xle9lcqr2qtj6fek75u5ntt8dxnmkcc80pjylc5hed5qjz488ga0fcx6quphlps95qlf839q77mhgv3dezf5dlzame5hrgqsmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgdtex07","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"842468693271079620554301388750085740873203583062890643188623955488839009625field","tcm":"2752533455412613106771920890566519746466954607696065566492577296743291985261field","scm":"3844647255947359656650853949587322431249425751036754772276995840173728179480field"}],"transitions":[{"id":"au13uuftt5a73ha0ez9hyaqc7f3efkyw0nmufvfsa35ze3cuggwegyqfmpsnc","program":"credits.aleo","function":"fee_public","inputs":[{"type":"public","id":"1236904445320008365690109681543399166087562464648307672887712965547911005106field","value":"1000000u64"},{"type":"public","id":"7534378790668398972390701196841804750368436610916174309476130285208807336075field","value":"0u64"},{"type":"public","id":"3839097647761853616188014373153230802709413936709969178171401168479940342742field","value":"5861750103935316794608259263097700543376455430267921167932279423298832828187field"}],"outputs":[{"type":"future","id":"7376837628727201465092024949171324267883508382872525506751191952280391240088field","value":"{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a,\n    1000000u64\n  ]\n}"}],"tpk":"4674317274796085762374780614101659015809429371081752559519443134812441140952group","tcm":"2752533455412613106771920890566519746466954607696065566492577296743291985261field","scm":"3844647255947359656650853949587322431249425751036754772276995840173728179480field"}]},"broadcast":false}"#;

pub const PUZZLE_SPINNER_V002_AUTHORIZATION: &str = r#"{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_spinner_v002.aleo","function":"spin","input_ids":[{"type":"external_record","id":"2094094279846006863789449599365264356524704258957209392883419734916308087566field"},{"type":"public","id":"5595943493906333085391638370632238393662235874383695353608521124649733340931field"},{"type":"private","id":"6742098636398522089859394195904601600130314965171698086111626341696733948612field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public,\n  _version: 0u8.public\n}","{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}","sign1qkveh904rhh9q72mvg7r9p20q54w73w55m375dplgqmg4dj07cqgfu6nmyennfeyvczvdlsztndg3vstm5wrdx8gwl7ucjp8mmlwsqxyx67umlz8tz8pw8zk599sj05tsqczr4ufz06e4jl0lve0k6p3pvyztyddnpcpvq3p66k3ryatluay3cndws6fktfvnytg3hcswahqjdc7n92"],"signature":"sign1xf53lt5wp9g88h6s65uct4ps7te4p2a3fxt9lnj4mpuflltw9yqrxn4mslff0z7rehgher4s68pmcar9ul28c97kp2qsr8ar6ftfzpqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqg287l48","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"572183841960682933577383606586553460249103306203159528948819230484782997585field","tcm":"1171065817681420457160345788668531223791133417763996992400327530900798825721field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_coin_v002.aleo","function":"spend","input_ids":[{"type":"record","commitment":"3695326969420433429322937563366478414189257375833807166677296859078066945588field","gamma":"822030278715035804872365307657119524241344315777773665392070818824848423298group","record_view_key":"1925121045312432202191309331127274276680205187304403149300554031033906128262field","serial_number":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"2041891405937960445696743302415641847824825632459410269684813295953846950757field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public,\n  _version: 0u8.public\n}","1000000u64"],"signature":"sign1yjce07tv55km8qsfcgg5f53yvx4yal4ruuf9u0eaxku6fq4wrgpg0l7hfgnvpvvalfl4qvces3k9s9nt9ugy6wwjs9mnu2exdxz3cqsmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgm4ynq3","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"4994084056607172960767483219582395385778247231446264109964208478083811415449field","tcm":"7812759430980949738683330164278254095249178692436543417615689108707612536911field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","input_ids":[{"type":"public","id":"1046274269999797229672577130372021146162188188700658720275906690284075339674field"},{"type":"public","id":"6672330946491079853759778561061110692770616941692333781924093458318671076471field"}],"inputs":["aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","5000000u64"],"signature":"sign1ycfa5yhx8magvj47z7ucdaaj6dqaglhgdwzy6930uh4qx8vum5q9wx7arq707cedudzld6mca2gzdex90utr0eezl8y4479sc02a5qqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgx56dh0","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"2873294706176964472715353629140777692023106080534816614008391405046442842512field","tcm":"6490794758489608132610463651546131626878006045467732980547897283109192374041field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"}],"transitions":[{"id":"au1234a2r7zve0049hcsm3fawmk2frt5p6zvfn4v2algsmmemjk7uxst0z669","program":"puzzle_arcade_coin_v002.aleo","function":"spend","inputs":[{"type":"record","id":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"2041891405937960445696743302415641847824825632459410269684813295953846950757field","value":"1000000u64"}],"outputs":[{"type":"record","id":"6234733124236322387889736135649408851334996209733769544324065144060617746336field","checksum":"440246515958659636861403206156566406152482039155384175770866473086825655202field","value":"record1qvqspknecyxj8he7r7d0saa8mu8h4655jt25xgvfnryxg37td4hhzlg3qyrxzmt0w4h8ggcqqgqspm7g76ludumjncxeafx7hqch36k0q5cdvrxctm0w0h05jx9q0esqty29y8hfvl5sqercpezunplc89k36fxls209lyqqmvun5h30dcgq4newd4","sender_ciphertext":"2051089804256883694774647491009107449590332829064597128043238087312538756881field"}],"tpk":"779450742859646977077288858452846617400181919260356985744863858124988996579group","tcm":"7812759430980949738683330164278254095249178692436543417615689108707612536911field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"id":"au165pk3mj0z8qmd4rjrdpymex0wg2ktjg69jlh0ddgq3r8a8xw4y9qcerjde","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","inputs":[{"type":"public","id":"1046274269999797229672577130372021146162188188700658720275906690284075339674field","value":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a"},{"type":"public","id":"6672330946491079853759778561061110692770616941692333781924093458318671076471field","value":"5000000u64"}],"outputs":[{"type":"record","id":"1130818339127085714202916297407753311196018055225024066502861268664315562572field","checksum":"6564309912145323765833525250549682602535323908901729171643580386651654016412field","value":"record1qvqsp8svu763tlxwmh9wdmdu93fs4ydgmsk62kqz7h2egshvlfjcfcc9qyrxzmt0w4h8ggcqqgqsqlradgpmpxuephuktakm3r9k6849czlyw7nw5u8zhxfuwrhx3mszxrg96enap4k0fmjyhsdqpvx6nyvc8k6t8st3pvrvd4jghh836srsv8enll","sender_ciphertext":"3633731045592752368422559477739611800333912219171005386498755402947798716823field"},{"type":"future","id":"74131887599252140728099600235197072782607427140742230946502591809048135927field","value":"{\n  program_id: puzzle_arcade_ticket_v002.aleo,\n  function_name: mint,\n  arguments: [\n    aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n  ]\n}"}],"tpk":"2840319856609594596522635087311530377650934567024220337860469891161374663385group","tcm":"6490794758489608132610463651546131626878006045467732980547897283109192374041field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"},{"id":"au1jmm0qqwmgl06vr42ya43kcv0pjsgt7huyydtr0j9cvrsy3allqgsulx0d8","program":"puzzle_spinner_v002.aleo","function":"spin","inputs":[{"type":"external_record","id":"2094094279846006863789449599365264356524704258957209392883419734916308087566field"},{"type":"public","id":"5595943493906333085391638370632238393662235874383695353608521124649733340931field","value":"{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}"},{"type":"private","id":"6742098636398522089859394195904601600130314965171698086111626341696733948612field","value":"ciphertext1q5qqkh55w4tat8z30xdwfpzs2rtu8nayf0vtaj8fxzar9d26wce0jrfzq05mm5zl54rjfstpwy9rmdy09k5tkjzc280xzspwrdnprql8qh966uctg8hxuh9pxse6dz25u9ljxyxz6tvgzpj8s8ky3uta7f5qd0lftt5ksmexyyqtzsd04fsqgf9k8723zl4wt2spx9rjr38wrhsy3n56ej9zn88gravxdk7fape7jr7pgdam4g8vuey47ywzdtkrpc8qrsnfv0"}],"outputs":[{"type":"external_record","id":"2735321205447718152398768122882561932543144412730538395102830561769369606454field"},{"type":"external_record","id":"7369296498063689826492338091106358165388792727887425815548124115560783555312field"},{"type":"future","id":"6484631562279855668848888140360023825065176810215937222335315467885649991363field","value":"{\n  program_id: puzzle_spinner_v002.aleo,\n  function_name: spin,\n  arguments: [\n    {\n      program_id: puzzle_arcade_ticket_v002.aleo,\n      function_name: mint,\n      arguments: [\n        aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n      ]\n    },\n    1170758118field\n  ]\n}"}],"tpk":"6590493951761094593568034471222493140361737341714336847530563463808843573584group","tcm":"1171065817681420457160345788668531223791133417763996992400327530900798825721field","scm":"626039704492388670135868348830115832773688775904731209381377014140356519273field"}]}"#;

pub fn generate_puzzle_imports() -> Object {
    object! {
        "puzzle_arcade_coin_v002.aleo" : PUZZLE_ARCADE_COIN_V002,
        "puzzle_arcade_ticket_v002.aleo" : PUZZLE_ARCADE_TICKET_V002,
    }
}

pub fn generate_puzzle_inputs() -> Array {
    array![PUZZLE_SPINNER_V002_INPUT_0, PUZZLE_SPINNER_V002_INPUT_1, PUZZLE_SPINNER_V002_INPUT_2,]
}
