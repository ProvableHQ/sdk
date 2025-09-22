/// V1 credits.aleo record.
const CREDITS_RECORD_V1 = "{ owner: aleo12a4wll9ax6w5355jph0dr5wt2vla5sss2t4cnch0tc3vzh643v8qcfvc7a.private, microcredits: 1000000u64.private, _nonce: 3634848344765318974603121890869676775499130077229666060613233255327643175219group.public, _version: 1u8.public }";

/// Record view key for the V1 credits.aleo record.
const CREDITS_RECORD_VIEW_KEY = "5237002936265850807349726649400053591020997883662246784632368923777787639801field";

/// Sender ciphertext of the credits.aleo record.
const CREDITS_SENDER_CIPHERTEXT = "1182590395568997043375432557467567048762179115999922880321493200728848194550field";

/// Sender plaintext of the credits.aleo record.
const CREDITS_SENDER_PLAINTEXT = "aleo1j92w9mhqznj2hvufad796y8suykjppk7f6n6xmncmktfm95vggzqx4sjlh";

// Ciphertext records
const RECORD_CIPHERTEXT_STRING = "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
const RECORD_CIPHERTEXT_STRING_COPY = "record1qyqsqpe2szk2wwwq56akkwx586hkndl3r8vzdwve32lm7elvphh37rsyqyxx66trwfhkxun9v35hguerqqpqzqrtjzeu6vah9x2me2exkgege824sd8x2379scspmrmtvczs0d93qttl7y92ga0k0rsexu409hu3vlehe3yxjhmey3frh2z5pxm5cmxsv4un97q";
const RECORD_CIPHERTEXT_STRING_NOT_OWNED = "RECORD1QVQSQ5H8YT5682E73ZT7PYNJGPL29MWTSETRVS9VHCKFHJRNX9RX94CFQYXX66TRWFHKXUN9V35HGUERQQPQZQZ6KMY7S5HPKKF02L6R46QM8RQCW9X0K4RQ6GT234AMJ2UG3LMTQT5NY4UG8SXJY3U8D05K4Q3E9F54VX67ZMD3G6JYQQ7KXRWS0R0SWM6P833";
const RECORD_CIPHERTEXT_STRING_NOT_OWNED2 = "RECORD1QVQSP37HJE4CEU8EFZE8XMAHE5TDTXCZ0K534WQPKVN6C9R629X3C4Q8QYRXZMT0W4H8GGCQQGQSPVUJYCN0K7HYFHENXA40HXTFSX68092WMVJ4E3XSEXR2DY0FMCCXT0DS42W5MAASZFJV930QVQRKATQJ900AKU4K777UMH2K54ZHLUGQC2AFJD";

// Plaintext record
const RECORD_PLAINTEXT_STRING = `{
    owner: aleo1j7qxyunfldj2lp8hsvy7mw5k8zaqgjfyr72x2gh3x4ewgae8v5gscf5jh3.private,
      microcredits: 1500000000000000u64.private,
      _nonce: 3077450429259593211617823051143573281856129402760267155982965992208217472983group.public
    }`;

// View key and record view key
const VIEW_KEY_STRING = "AViewKey1ccEt8A2Ryva5rxnKcAbn7wgTaTsb79tzkKHFpeKsm9NX";
const RECORD_VIEW_KEY_STRING = "4445718830394614891114647247073357094867447866913203502139893824059966201724field";

const ENCRYPTED_RECORDS = [
  {
      "commitment": "6965909872581584914039191373421463306059339471297771776610572511362422620805field",
      "checksum": "2207226491095267609257407999738609780640985730602113917526120008525943934340field",
      "block_height": 10002012,
      "program_name": "credits.aleo",
      "function_name": "transfer_public_to_private",
      "output_index": 0,
      "owner": "ciphertext1qyqzlxhmhtgtjaee6new2hsfls2ygj68va5h009u3h5htdp59gqasqcwfsafx",
      "record_ciphertext": "record1qvqsqtu6lwadpwth88209e27p87pg3ztgankjaauhjx7jad5xs4qrkqrqyxx66trwfhkxun9v35hguerqqpqzqxkezwzg7z8lvpj4t2as605kn9ge8k9cvfls3mg0sqult798mfwqcskzfqlyn83lu3e9kexqmklf5ad9d4shvz5ntuenzrdujqpq0esqdddm55",
      "record_name": "credits",
      "record_nonce": "429364576614161221583920327616773968748250238602322587322300571348491329825group",
      "transaction_id": "at1rdlnll8kljpuy506f0tx0r0xd2fck60hw7phkmjnptke77xukg8sekd6c9    ",
      "transition_id": "au1f505f9uvu39f2mys9g0gl2qe5t3pr8tsdutzj4pd2apd5l6hzuqqv0t2n3    ",
      "transaction_index": 0,
      "transition_index": 0
  },
  {
      "commitment": "1188397772964800575271786433438577861359270789629265569589281492544120074436field",
      "checksum": "5605422683473081183936132265672104254159529769293480273428181950973232566109field",
      "block_height": 10003899,
      "program_name": "token_registry.aleo",
      "function_name": "transfer_public_to_private",
      "output_index": 0,
      "owner": "ciphertext1qyqvlfsfleandncmy35mrzr2fwt0epgmnmj34dr6nq7zlndg2v3murskqakke",
      "record_ciphertext": "record1qvqspnaxp8l8kdk0rvjxnvvgdf9edly9rw0w2x4502vrct7d4pfj80swqsrxzmt0w4h8ggcqqgqsprxt748jj4tl4lm799ys2qjnzz5s6zjrrq6r3ftpn26x4nscncqwpp6x76m9de0kjezrqqpqyq9x2mvm0uzcmt8unclhhze2aa0w2exzx6dwaqrzm879ya65gdytp55qf2ysvks4435vnzkmgwszppeh5vyud97kurp50zn95h7pakj3y8m90p6x2unwv9k97ct4w35x7unf0fshg6t0de0hyet3w45hyetyyvqqyqgqp7tq23f3nz56q6ptwrjyr3xf657pshhrmhvm8yqpuhkfjxjp85gpqct4w35x7unf0fjkghm4de6xjmprqqpqzqyp9aa48avx62cfnce36trczs0fj88ydw8cxg38pv69t983an7gqgaqvv25079m7w7gayzq25ddxadmnnxh5jttm4ra6jrn00vqn7cq7a36w4h",
      "record_name": "Token",
      "record_nonce": "7096758660619171646018003922303056044411325151108024435925109326208495060538group",
      "transaction_id": "at1khgxe7rt7tlcv6kyrytlt57rdu4t67euelyy4fzrysa5spplms8qmyzm0g    ",
      "transition_id": "au1jxjw3vxpnjl7vrs3ckhkta0yxwq87wxeh7pwcs9q4nfw3knzlgzs95m32s    ",
      "transaction_index": 0,
      "transition_index": 0
  }
]

const OWNED_RECORDS = [
  {
    block_height: 6090931,
    commitment: '3190431573263899914391947973857035974322781794111836590387626738139790056909field',
    function_name: 'place_bid',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'private_auction.aleo',
    record_ciphertext: 'record1qyqspn9v8rwmmtwfynxl7z98sr3hgevduqk7wl4ufmp8yxanp9x5lhgdqsrxy6tyv3jhyscqqgpqp2k5sw5f37f86hge97ls2avx94pvg7fnaxr7uqwfwkqaljq8jlgyg480mg8fy67fkhqe6ysjxdr47whlt09gwuwmlme57nxvz4kn5qyqy6tygvqqyqsqaljsdk8g0g7f9t4s8z2utywzg6qwpgrl57k8fzvcz5qrthzy5qrk422ak9e9pwylg9k7fh99qa05qu4qj9k5mn7hjf5586fmlrk6qpqxv9kk7atwws3sqqspqryrtmup2kn26693c4f7e79gc0yfdammkxexk84vt0z5wms8dgnq2ztfwd0hw6twdejhygcqqgqsppdjyztk35ekkzq60jx7gg498tccxc9l0ysmk6hal0yglk436ng8pq5wrq99rlhqqglf0gvv70lfavzfu6mgf4sgzmuwej2a2f4umgzssk0fhc',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  bidder: aleo1jqnajd8g6ezqjq0eefm4zeqynwx6vzed8flnkmejw0afy09dusrszzk46k.private,\n' +
      '  id: 127430097643352927347108200field.private,\n' +
      '  amount: 2u64.private,\n' +
      '  is_winner: false.private,\n' +
      '  _nonce: 2648035478322331583038604395085314793293985787056490619358776499723646871560group.public,\n' +
      '  _version: 0u8.public\n' +
      '}',
    record_name: 'Bid',
    spent: false,
    tag: '5941252181432651644402279701137165256963073258332916685063623109173576520831field',
    transaction_id: 'at1unmfl5gv6d28c9dt405kxxj8nl7ytl5eq0ue9ctpc7lpmds8qgqqqglh2z    ',
    transition_id: 'au1rc32lk3umuye2ccpqkx8gw5m2cf92a29wzyfj5r7tg9jtnd2duxq6gtuss    ',
    transaction_index: 2,
    transition_index: 0
  },
  {
    block_height: 10139458,
    commitment: '1402624598475573407524150006714553637670194594508553840106512461758960165497field',
    function_name: 'transfer_public_to_private',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'credits.aleo',
    record_ciphertext: 'record1qvqsq9pcyh8s0zlqwydq0uef42kanl88hct6c7f0y7m3gawxv8er20g2qyxx66trwfhkxun9v35hguerqqpqzqzue2ynz2mfnucdf9gft6cuqussdtge8efqwnlkqvq5nr52nhq9pmv47u20cmsk6mnsl70kxhengndepngqja8s5myu0778nncrttls576mt26',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  microcredits: 1000000u64.private,\n' +
      '  _nonce: 4974295747251926833599773262811444029929021845727007977270637854284605120473group.public,\n' +
      '  _version: 1u8.public\n' +
      '}',
    record_name: 'credits',
    spent: false,
    tag: '2965517500209150226508265073635793457193572667031485750956287906078711930968field',
    transaction_id: 'at10g988ruzr70rv0jrnx67ay0f62gzn0vsmlpgsk9seqzd4k406sys8q9xhk    ',
    transition_id: 'au1wr7q6y6fw2gyrwem2zjm8kp2lvl04eay8hqmaz6l2gd4p60ddy9s2lj2qr    ',
    transaction_index: 0,
    transition_index: 0
  },
  {
    block_height: 10140546,
    commitment: '6211743159355787867034474916630197652498323872351981366700814088987411118433field',
    function_name: 'transfer_public_to_private',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'credits.aleo',
    record_ciphertext: 'record1qvqspk7dttx96hemjmnzkf2vf7exfxt6uu04xxxhr987nycq5xx4lkc3qyxx66trwfhkxun9v35hguerqqpqzqqjw24ydxw5t5jgjhszz6dmtgwcw2r0ckgkg3kkxkh8y8cy0gump9an579cxeg5rxkawwdvh2wmesusl8tpwldpe60wkmgzdgd97pns2akmwge',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  microcredits: 2000000u64.private,\n' +
      '  _nonce: 2445210375074181986314301912374182923270809668425048232267618676093400660603group.public,\n' +
      '  _version: 1u8.public\n' +
      '}',
    record_name: 'credits',
    spent: false,
    tag: '8421937347379608036510120951995833971195343843566214313082589116311107280540field',
    transaction_id: 'at1hy45m9w56cr8f5yzqp675heh3rde9996exy9875ylzk2w2nmt5qsfudud5    ',
    transition_id: 'au1yp2x7t378w3d74kkkz9vcq7ckeg4h4amc3ltysmylz7a85yuy5pqefcjmh    ',
    transaction_index: 0,
    transition_index: 0
  }
]

const OWNED_CREDITS_RECORDS = [
  {
    block_height: 6090931,
    commitment: '3190431573263899914391947973857035974322781794111836590387626738139790056909field',
    function_name: 'place_bid',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'private_auction.aleo',
    record_ciphertext: 'record1qyqspn9v8rwmmtwfynxl7z98sr3hgevduqk7wl4ufmp8yxanp9x5lhgdqsrxy6tyv3jhyscqqgpqp2k5sw5f37f86hge97ls2avx94pvg7fnaxr7uqwfwkqaljq8jlgyg480mg8fy67fkhqe6ysjxdr47whlt09gwuwmlme57nxvz4kn5qyqy6tygvqqyqsqaljsdk8g0g7f9t4s8z2utywzg6qwpgrl57k8fzvcz5qrthzy5qrk422ak9e9pwylg9k7fh99qa05qu4qj9k5mn7hjf5586fmlrk6qpqxv9kk7atwws3sqqspqryrtmup2kn26693c4f7e79gc0yfdammkxexk84vt0z5wms8dgnq2ztfwd0hw6twdejhygcqqgqsppdjyztk35ekkzq60jx7gg498tccxc9l0ysmk6hal0yglk436ng8pq5wrq99rlhqqglf0gvv70lfavzfu6mgf4sgzmuwej2a2f4umgzssk0fhc',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  bidder: aleo1jqnajd8g6ezqjq0eefm4zeqynwx6vzed8flnkmejw0afy09dusrszzk46k.private,\n' +
      '  id: 127430097643352927347108200field.private,\n' +
      '  amount: 2u64.private,\n' +
      '  is_winner: false.private,\n' +
      '  _nonce: 2648035478322331583038604395085314793293985787056490619358776499723646871560group.public,\n' +
      '  _version: 0u8.public\n' +
      '}',
    record_name: 'Bid',
    spent: false,
    tag: '5941252181432651644402279701137165256963073258332916685063623109173576520831field',
    transaction_id: 'at1unmfl5gv6d28c9dt405kxxj8nl7ytl5eq0ue9ctpc7lpmds8qgqqqglh2z    ',
    transition_id: 'au1rc32lk3umuye2ccpqkx8gw5m2cf92a29wzyfj5r7tg9jtnd2duxq6gtuss    ',
    transaction_index: 2,
    transition_index: 0
  },
  {
    block_height: 10139458,
    commitment: '1402624598475573407524150006714553637670194594508553840106512461758960165497field',
    function_name: 'transfer_public_to_private',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'credits.aleo',
    record_ciphertext: 'record1qvqsq9pcyh8s0zlqwydq0uef42kanl88hct6c7f0y7m3gawxv8er20g2qyxx66trwfhkxun9v35hguerqqpqzqzue2ynz2mfnucdf9gft6cuqussdtge8efqwnlkqvq5nr52nhq9pmv47u20cmsk6mnsl70kxhengndepngqja8s5myu0778nncrttls576mt26',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  microcredits: 1000000u64.private,\n' +
      '  _nonce: 4974295747251926833599773262811444029929021845727007977270637854284605120473group.public,\n' +
      '  _version: 1u8.public\n' +
      '}',
    record_name: 'credits',
    spent: false,
    tag: '2965517500209150226508265073635793457193572667031485750956287906078711930968field',
    transaction_id: 'at10g988ruzr70rv0jrnx67ay0f62gzn0vsmlpgsk9seqzd4k406sys8q9xhk    ',
    transition_id: 'au1wr7q6y6fw2gyrwem2zjm8kp2lvl04eay8hqmaz6l2gd4p60ddy9s2lj2qr    ',
    transaction_index: 0,
    transition_index: 0
  },
  {
    block_height: 10140546,
    commitment: '6211743159355787867034474916630197652498323872351981366700814088987411118433field',
    function_name: 'transfer_public_to_private',
    output_index: 0,
    owner: '7447609208500997115362207913251419702258326233440670198345216549215225004914field',
    program_name: 'credits.aleo',
    record_ciphertext: 'record1qvqspk7dttx96hemjmnzkf2vf7exfxt6uu04xxxhr987nycq5xx4lkc3qyxx66trwfhkxun9v35hguerqqpqzqqjw24ydxw5t5jgjhszz6dmtgwcw2r0ckgkg3kkxkh8y8cy0gump9an579cxeg5rxkawwdvh2wmesusl8tpwldpe60wkmgzdgd97pns2akmwge',
    record_plaintext: '{\n' +
      '  owner: aleo1q8zc0asncaw9d83ft2dynyqz08fcpq3p40depmrj4wjda28rdvrsvegg45.private,\n' +
      '  microcredits: 2000000u64.private,\n' +
      '  _nonce: 2445210375074181986314301912374182923270809668425048232267618676093400660603group.public,\n' +
      '  _version: 1u8.public\n' +
      '}',
    record_name: 'credits',
    spent: false,
    tag: '8421937347379608036510120951995833971195343843566214313082589116311107280540field',
    transaction_id: 'at1hy45m9w56cr8f5yzqp675heh3rde9996exy9875ylzk2w2nmt5qsfudud5    ',
    transition_id: 'au1yp2x7t378w3d74kkkz9vcq7ckeg4h4amc3ltysmylz7a85yuy5pqefcjmh    ',
    transaction_index: 0,
    transition_index: 0
  }
]

const CHECK_SNS_RESPONSE = { '3673836024253895240205884165890003872225300531298514519146928213266356324646field': true }

const CHECK_TAGS_RESPONSE = {
  '2965517500209150226508265073635793457193572667031485750956287906078711930968field': false,
  '8421937347379608036510120951995833971195343843566214313082589116311107280540field': false,
  '5941252181432651644402279701137165256963073258332916685063623109173576520831field': false
}

export {
    CREDITS_RECORD_V1,
    CREDITS_RECORD_VIEW_KEY,
    CREDITS_SENDER_CIPHERTEXT,
    CREDITS_SENDER_PLAINTEXT,
    CHECK_SNS_RESPONSE,
    CHECK_TAGS_RESPONSE,
    ENCRYPTED_RECORDS,
    OWNED_RECORDS,
    OWNED_CREDITS_RECORDS,
    RECORD_CIPHERTEXT_STRING,
    RECORD_CIPHERTEXT_STRING_COPY,
    RECORD_CIPHERTEXT_STRING_NOT_OWNED,
    RECORD_CIPHERTEXT_STRING_NOT_OWNED2,
    RECORD_PLAINTEXT_STRING,
    RECORD_VIEW_KEY_STRING,
    VIEW_KEY_STRING,
  };