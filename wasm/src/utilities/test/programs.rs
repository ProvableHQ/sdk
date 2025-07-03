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

pub const PUZZLE_SPINNER_V002_PROVING_REQUEST: &str = r#"{"authorization":{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_spinner_v002.aleo","function":"spin","input_ids":[{"type":"external_record","id":"4839825023340335323468949840326633236140012120584428570479378506848801935786field"},{"type":"public","id":"689499397535666491876882374581172372478760792108416527400914277809153071525field"},{"type":"private","id":"204887954335404089799669898777964237502995629559503801470641603941867173634field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public\n}","{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}","sign1qkveh904rhh9q72mvg7r9p20q54w73w55m375dplgqmg4dj07cqgfu6nmyennfeyvczvdlsztndg3vstm5wrdx8gwl7ucjp8mmlwsqxyx67umlz8tz8pw8zk599sj05tsqczr4ufz06e4jl0lve0k6p3pvyztyddnpcpvq3p66k3ryatluay3cndws6fktfvnytg3hcswahqjdc7n92"],"signature":"sign18v4fcfsuurf9at5wep888wc6lvtdkf5ylu87z2zkal86h78y2qqxgf6sv5ec3rkxer6u2kyt97msd642ug98vujucr3tpmn5xzrjcpqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgm3hgvz","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"7887347020496867633025198179538092686807709030559139373452016366862202216822field","tcm":"5184307406769561127784010119742928136813749122772866019497418760257529274697field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_coin_v002.aleo","function":"spend","input_ids":[{"type":"record","commitment":"3695326969420433429322937563366478414189257375833807166677296859078066945588field","gamma":"822030278715035804872365307657119524241344315777773665392070818824848423298group","serial_number":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"983968172150353554156538507358506700189864365133395189882742305839354633573field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public\n}","1000000u64"],"signature":"sign1u7c439yla0qsxx96rplu22slrxhhw259mvw2lxet32gl9ymgtgq8cv5erwq6n0fn7qejcp2x9qe0zdv4fmpjhlr68xh6l3rpxmen6qgmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgw840pe","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"2450368563964622351216358823863430421592337713178038056789275445961491508368field","tcm":"4237791659929636400183975921659337866974324622594970673695626484873137586449field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","input_ids":[{"type":"public","id":"6721166893855413738635437659301467959691201663248139329280766851898379142438field"},{"type":"public","id":"7602002703436247948217984514968521153283693474827886741404040849156560233828field"}],"inputs":["aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","5000000u64"],"signature":"sign17mqx87aw8hnxuc6dgds2rv3eynl0875a5gq9wmwetnhr6ane4qppa9u7j2am7kzpqh3lm4mwqntmn0hs6n2claajwnr8kcxzn4veuqgmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgjw7qqc","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"4256891256230456036795784643109504377201150055935596668723779434057096338667field","tcm":"1848074362648703637228218628675108244579594558612245266912763786327103104689field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"}],"transitions":[{"id":"au1um0353ev5s55j77gwjk75pk04ufp9rc374sjradcl4k57n23c5qsv346vy","program":"puzzle_arcade_coin_v002.aleo","function":"spend","inputs":[{"type":"record","id":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"983968172150353554156538507358506700189864365133395189882742305839354633573field","value":"1000000u64"}],"outputs":[{"type":"record","id":"8140704718508173171760125959206007874713592693686828558476930559214720352089field","checksum":"4639553716887452895303379761137139153169593396837899062649658402164488957377field","value":"record1qyqsqzn4x5367upuu9v4fp3ep8s24ft797dlkg6pegl89au7zd6ttvggqyrxzmt0w4h8ggcqqgqspmg8ldlpa3s8aud7u0cj4njz3ulw66x4ycpm7lgg8ey9j3d0n7q2cmyxefgq683y3n4u0freu2gkzjktcxy77njh4v5lzpjpk5udlqgsj2utra"}],"tpk":"5480120086260377296376727402444969064909192675402761120274744546121220920583group","tcm":"4237791659929636400183975921659337866974324622594970673695626484873137586449field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"id":"au1vnj9n6j769lpugmkp7mt3curhqj8kntr7repq6jgjcjprgahpqyqrr3e3q","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","inputs":[{"type":"public","id":"6721166893855413738635437659301467959691201663248139329280766851898379142438field","value":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a"},{"type":"public","id":"7602002703436247948217984514968521153283693474827886741404040849156560233828field","value":"5000000u64"}],"outputs":[{"type":"record","id":"4979319469949595363292890997153041986293009553702801793777655456467789805402field","checksum":"7890115790956187154512722603427713063647729020073112796988750179726172526453field","value":"record1qyqspuu76u05yf4770xh2pgj83akaxlfyckak5ccph5gqhs6xcsypcc2qyrxzmt0w4h8ggcqqgqsq7wg6gcnp0g7tkk8farjzhnpej5e57dxan4304jj9jy0rha7p9qtcc28u7afcdul8mg6kc74rke6cvg8ljp7han3k6rmhfsyd9957y8s5aqj9k"},{"type":"future","id":"5793590992923476860117620280703869758532910290991808252964050978242851758522field","value":"{\n  program_id: puzzle_arcade_ticket_v002.aleo,\n  function_name: mint,\n  arguments: [\n    aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n  ]\n}"}],"tpk":"796422051567585485662998739542099587363536242505659235647635340385357477866group","tcm":"1848074362648703637228218628675108244579594558612245266912763786327103104689field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"id":"au1nzpwmgak2crt0sjjcymwzyaplj5efjq8k4kxqdckcp258l8p9c9sje3r0c","program":"puzzle_spinner_v002.aleo","function":"spin","inputs":[{"type":"external_record","id":"4839825023340335323468949840326633236140012120584428570479378506848801935786field"},{"type":"public","id":"689499397535666491876882374581172372478760792108416527400914277809153071525field","value":"{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}"},{"type":"private","id":"204887954335404089799669898777964237502995629559503801470641603941867173634field","value":"ciphertext1q5qy65n3kmys4qea6t9vx5pdenw3tu99shmr5smhx078sps0e73lvrcuwvgpv3td83rxlt0zkqcglym06hsftt9phy4ey33p2h234d3zzps00s3jghpr408ekxc5euzdacgdkrsncpcvdgnpeem40h2zv23qnkfgdk2dhvcftryvrcjsgrcg8yssvakes83h2wszhex6tpcn9fqjmj5u7w9e34w7xqv0zdh7zfd0w9dmjwfqexw44aurkc6qch533cxqms5y3n"}],"outputs":[{"type":"external_record","id":"1715499118764540178827603557286876951814591166091657218019566890084943258481field"},{"type":"external_record","id":"4129206345163577055922736865432651147922262791113647460762758504171289984729field"},{"type":"future","id":"283137589857486307334174603450435032796546056344019080676251816856309117379field","value":"{\n  program_id: puzzle_spinner_v002.aleo,\n  function_name: spin,\n  arguments: [\n    {\n      program_id: puzzle_arcade_ticket_v002.aleo,\n      function_name: mint,\n      arguments: [\n        aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n      ]\n    },\n    1170758118field\n  ]\n}"}],"tpk":"6940488315082706884774989262462878652150160864207945247065776170044626481221group","tcm":"5184307406769561127784010119742928136813749122772866019497418760257529274697field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"}]},"fee_authorization":{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"credits.aleo","function":"fee_public","input_ids":[{"type":"public","id":"2865113343420420367199510435492286775902275016824230086807729121770140385376field"},{"type":"public","id":"1266932544997883667989471691002079292362268349713066033089112486190153265124field"},{"type":"public","id":"548989906891907937719368729536809810952876694522341683716574654231845791830field"}],"inputs":["1000000u64","0u64","1882362354430042662712591137299369331818676748110512305194177022256062176983field"],"signature":"sign1t6ygnr9tpq86665ckel3a93wrunnzrdwhdvmyc69rklr73y95gqftqq4cnnl6e5fft5hxjxde4xe5nm7zayrd7g60pzwpx393xcaqqsmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqggq88f0","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"7267695931077769691220371594908034686882927661941025273410389723299242944710field","tcm":"5839764720464518630990925812168080602573884748815262871437159576287223495592field","scm":"1843654942797178788449034806874874515588275383355990127459111325599333347333field"}],"transitions":[{"id":"au1dzc895t2v7cgj4wnj0nm7r8g2fg6v6j9r34w6c939e665hryqvyst0je75","program":"credits.aleo","function":"fee_public","inputs":[{"type":"public","id":"2865113343420420367199510435492286775902275016824230086807729121770140385376field","value":"1000000u64"},{"type":"public","id":"1266932544997883667989471691002079292362268349713066033089112486190153265124field","value":"0u64"},{"type":"public","id":"548989906891907937719368729536809810952876694522341683716574654231845791830field","value":"1882362354430042662712591137299369331818676748110512305194177022256062176983field"}],"outputs":[{"type":"future","id":"6264690058416123288904322642669236161298986974680793450148985298845496193869field","value":"{\n  program_id: credits.aleo,\n  function_name: fee_public,\n  arguments: [\n    aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a,\n    1000000u64\n  ]\n}"}],"tpk":"4910182040362246546623612647308228853414867830879394808683088841463499094221group","tcm":"5839764720464518630990925812168080602573884748815262871437159576287223495592field","scm":"1843654942797178788449034806874874515588275383355990127459111325599333347333field"}]},"broadcast":false}"#;

pub const PUZZLE_SPINNER_V002_AUTHORIZATION: &str = r#"{"requests":[{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_spinner_v002.aleo","function":"spin","input_ids":[{"type":"external_record","id":"4839825023340335323468949840326633236140012120584428570479378506848801935786field"},{"type":"public","id":"689499397535666491876882374581172372478760792108416527400914277809153071525field"},{"type":"private","id":"204887954335404089799669898777964237502995629559503801470641603941867173634field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public\n}","{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}","sign1qkveh904rhh9q72mvg7r9p20q54w73w55m375dplgqmg4dj07cqgfu6nmyennfeyvczvdlsztndg3vstm5wrdx8gwl7ucjp8mmlwsqxyx67umlz8tz8pw8zk599sj05tsqczr4ufz06e4jl0lve0k6p3pvyztyddnpcpvq3p66k3ryatluay3cndws6fktfvnytg3hcswahqjdc7n92"],"signature":"sign18v4fcfsuurf9at5wep888wc6lvtdkf5ylu87z2zkal86h78y2qqxgf6sv5ec3rkxer6u2kyt97msd642ug98vujucr3tpmn5xzrjcpqmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgm3hgvz","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"7887347020496867633025198179538092686807709030559139373452016366862202216822field","tcm":"5184307406769561127784010119742928136813749122772866019497418760257529274697field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_coin_v002.aleo","function":"spend","input_ids":[{"type":"record","commitment":"3695326969420433429322937563366478414189257375833807166677296859078066945588field","gamma":"822030278715035804872365307657119524241344315777773665392070818824848423298group","serial_number":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"983968172150353554156538507358506700189864365133395189882742305839354633573field"}],"inputs":["{\n  owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private,\n  amount: 1000000u64.private,\n  _nonce: 3552842606932684888288059180163265370185468417773274452409126263862773749561group.public\n}","1000000u64"],"signature":"sign1u7c439yla0qsxx96rplu22slrxhhw259mvw2lxet32gl9ymgtgq8cv5erwq6n0fn7qejcp2x9qe0zdv4fmpjhlr68xh6l3rpxmen6qgmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgw840pe","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"2450368563964622351216358823863430421592337713178038056789275445961491508368field","tcm":"4237791659929636400183975921659337866974324622594970673695626484873137586449field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"signer":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","network":"0u16","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","input_ids":[{"type":"public","id":"6721166893855413738635437659301467959691201663248139329280766851898379142438field"},{"type":"public","id":"7602002703436247948217984514968521153283693474827886741404040849156560233828field"}],"inputs":["aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a","5000000u64"],"signature":"sign17mqx87aw8hnxuc6dgds2rv3eynl0875a5gq9wmwetnhr6ane4qppa9u7j2am7kzpqh3lm4mwqntmn0hs6n2claajwnr8kcxzn4veuqgmvqrdssu9887su5jga24rxwjhf9lt5lhk7zd2uqvc6w4stclkzxgnhkd24nmz0l050ejcf8e4tjugy8hrglglean3rne7c9907usqgjw7qqc","sk_tag":"2188950535000273989556007384792744144966780534890918446938267316970960124853field","tvk":"4256891256230456036795784643109504377201150055935596668723779434057096338667field","tcm":"1848074362648703637228218628675108244579594558612245266912763786327103104689field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"}],"transitions":[{"id":"au1um0353ev5s55j77gwjk75pk04ufp9rc374sjradcl4k57n23c5qsv346vy","program":"puzzle_arcade_coin_v002.aleo","function":"spend","inputs":[{"type":"record","id":"4076970251659226920097956648171573791328895534043196534502480362996698993709field","tag":"2912214195050022078917991120929452175415564426930328303911346972205167398771field"},{"type":"public","id":"983968172150353554156538507358506700189864365133395189882742305839354633573field","value":"1000000u64"}],"outputs":[{"type":"record","id":"8140704718508173171760125959206007874713592693686828558476930559214720352089field","checksum":"4639553716887452895303379761137139153169593396837899062649658402164488957377field","value":"record1qyqsqzn4x5367upuu9v4fp3ep8s24ft797dlkg6pegl89au7zd6ttvggqyrxzmt0w4h8ggcqqgqspmg8ldlpa3s8aud7u0cj4njz3ulw66x4ycpm7lgg8ey9j3d0n7q2cmyxefgq683y3n4u0freu2gkzjktcxy77njh4v5lzpjpk5udlqgsj2utra"}],"tpk":"5480120086260377296376727402444969064909192675402761120274744546121220920583group","tcm":"4237791659929636400183975921659337866974324622594970673695626484873137586449field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"id":"au1vnj9n6j769lpugmkp7mt3curhqj8kntr7repq6jgjcjprgahpqyqrr3e3q","program":"puzzle_arcade_ticket_v002.aleo","function":"mint","inputs":[{"type":"public","id":"6721166893855413738635437659301467959691201663248139329280766851898379142438field","value":"aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a"},{"type":"public","id":"7602002703436247948217984514968521153283693474827886741404040849156560233828field","value":"5000000u64"}],"outputs":[{"type":"record","id":"4979319469949595363292890997153041986293009553702801793777655456467789805402field","checksum":"7890115790956187154512722603427713063647729020073112796988750179726172526453field","value":"record1qyqspuu76u05yf4770xh2pgj83akaxlfyckak5ccph5gqhs6xcsypcc2qyrxzmt0w4h8ggcqqgqsq7wg6gcnp0g7tkk8farjzhnpej5e57dxan4304jj9jy0rha7p9qtcc28u7afcdul8mg6kc74rke6cvg8ljp7han3k6rmhfsyd9957y8s5aqj9k"},{"type":"future","id":"5793590992923476860117620280703869758532910290991808252964050978242851758522field","value":"{\n  program_id: puzzle_arcade_ticket_v002.aleo,\n  function_name: mint,\n  arguments: [\n    aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n  ]\n}"}],"tpk":"796422051567585485662998739542099587363536242505659235647635340385357477866group","tcm":"1848074362648703637228218628675108244579594558612245266912763786327103104689field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"},{"id":"au1nzpwmgak2crt0sjjcymwzyaplj5efjq8k4kxqdckcp258l8p9c9sje3r0c","program":"puzzle_spinner_v002.aleo","function":"spin","inputs":[{"type":"external_record","id":"4839825023340335323468949840326633236140012120584428570479378506848801935786field"},{"type":"public","id":"689499397535666491876882374581172372478760792108416527400914277809153071525field","value":"{\n  nonce: 1170758118field,\n  tickets: 5000000u64\n}"},{"type":"private","id":"204887954335404089799669898777964237502995629559503801470641603941867173634field","value":"ciphertext1q5qy65n3kmys4qea6t9vx5pdenw3tu99shmr5smhx078sps0e73lvrcuwvgpv3td83rxlt0zkqcglym06hsftt9phy4ey33p2h234d3zzps00s3jghpr408ekxc5euzdacgdkrsncpcvdgnpeem40h2zv23qnkfgdk2dhvcftryvrcjsgrcg8yssvakes83h2wszhex6tpcn9fqjmj5u7w9e34w7xqv0zdh7zfd0w9dmjwfqexw44aurkc6qch533cxqms5y3n"}],"outputs":[{"type":"external_record","id":"1715499118764540178827603557286876951814591166091657218019566890084943258481field"},{"type":"external_record","id":"4129206345163577055922736865432651147922262791113647460762758504171289984729field"},{"type":"future","id":"283137589857486307334174603450435032796546056344019080676251816856309117379field","value":"{\n  program_id: puzzle_spinner_v002.aleo,\n  function_name: spin,\n  arguments: [\n    {\n      program_id: puzzle_arcade_ticket_v002.aleo,\n      function_name: mint,\n      arguments: [\n        aleo1p8wg0ps5tzqt6hqehczvngszvgrl064d8jahz3axpkeza8preurqshnmpj\n      ]\n    },\n    1170758118field\n  ]\n}"}],"tpk":"6940488315082706884774989262462878652150160864207945247065776170044626481221group","tcm":"5184307406769561127784010119742928136813749122772866019497418760257529274697field","scm":"8244571840773922571129372528423680028577577865525993709717553000243960162859field"}]}"#;

pub fn generate_puzzle_imports() -> Object {
    object! {
        "puzzle_arcade_coin_v002.aleo" : PUZZLE_ARCADE_COIN_V002,
        "puzzle_arcade_ticket_v002.aleo" : PUZZLE_ARCADE_TICKET_V002,
    }
}

pub fn generate_puzzle_inputs() -> Array {
    array![PUZZLE_SPINNER_V002_INPUT_0, PUZZLE_SPINNER_V002_INPUT_1, PUZZLE_SPINNER_V002_INPUT_2,]
}
