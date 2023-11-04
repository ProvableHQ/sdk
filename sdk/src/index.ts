const KEY_STORE = "https://testnet3.parameters.aleo.org/";

const CREDITS_PROGRAM_KEYS = {
    bond_public: {
        prover: KEY_STORE + "bond_public.prover.ff75d2e",
        verifier: "bond_public.verifier.d3cfe73",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqzl9uqqqqqqqqq9stcqqqqqqqqqxa4sqqqqqqqqqyuwqqqqqqqqqpdyqqqqqqqqqqqvqqqqqqqqqqqx9lfqwmck43wt597p8xn68dh8l9setmmtk0ev35tgzkzm3j0j4tgu2s9kdu5w9m7g4dkglj28wayp2njn9qkuygpmcf9j7qc32aafepe5d9tdqyrq9ju2e8mlhkq8tucdh30rxysfl9h7d9jusmjhjcwgpuh0hhlspvtuv98n453apnqceupv2tc26wwx9mjl7m8j0urgax42xzrc9sltd62pfjgnw7vxh36vqxzajv5tyer6hpld0fr75jah48gaqpnexurtrag0azpcpep4lyxeyt4jytug2u7urfrp8rjh5wlkqqz7htzt8fdnthyngd5eqqfc6q0d6zw8lwlyr3hgqkjmkshmw5trm2tqg7euqav6r2vssqm9ut7ecjqq2fqs3k8mjp769qv5r2q52hcre66ymggtva7ty32lqpnrgrhgsc78g7qc00y5z6m626umkhqmz8sp0s4jz6qrvc6s47sycncq6ryltq2tmfxkz22e0g79cy4dzcnu5rwjkl4x3f27gavm7gug50tqnkwqrrjd430j9n8rrg78lpqfye8drxcnd2lxdry9nza8vfg4v3jmnmcdw55pu4kahfrawe4guvaqx26hqxhesqzxe343fjyz7vajn6prhg0jwzjtjh75v5wtp3h2knnvtshzae2uxel720fxg0vyfvnncsnxdqrqjc8aw8avq9kucsvauju4d0ke989s7v55ha0nh3dvdd9rct56pvg87txnhre3qvwmw6acf6t4x5q2al4gwwpqjhsezx6zmth0qeene0v3prwuh8a56r7qafhnyd98f8lx7xv4v48q7q7fd2373ag4fz5pmslx7v5hmpreqrdyj5h6we0kd24wk80f8sq44exsed3egstrn409cwzs9ph8563nh7vy6pcjnqxqrkzqvsa860spwjjf78hyful7zk2l3e9s4u4l0hqdyt547qxz3xamy5gkmd",
    },
    claim_unbond_public: {
        prover: KEY_STORE + "claim_unbond_public.prover.4c492b0",
        verifier: "claim_unbond_public.verifier.3793e4c",
        verifyingKey:
            "verifier1qygqqqqqqqqqqq8lycqqqqqqqqq02fsqqqqqqqqq849sqqqqqqqqpe26qqqqqqqqqzfnwqqqqqqqqqqvqqqqqqqqqqqgyhv4exh3e2g4f3ek5hymm8ah5h5hdp8v0j52dsksskad9wsryetk3qcr5um8t4nnpnqvhlsk5vcpea7w8uca2pum92jh2has0ag2gq24up0qr7p5z34jzrmtjx2583vkffyywmnatjs5t05x4yyc534cpsutfr4jaxqc9dlmxfw7a5tl4nl9q9qvweaver0q04pfl65w5wuyaadlzjhkkrrjaskg86tmkqy8s8vug7dyjnpe55y5ju8eag63p49ufdyguxdw2fwt46nwer74m3xmv9z6jhgslfwjre4fwctkppytsqrwmlf5szn9ckj2r86sa7azq0ly9atfjeee3f2f3n8s3rkrzezpqmcrt5lv3xlmymgspyj2vn7ytgqj97aula7tuxfrcsk787shhdjyxdvepspp7f4jaxuunzeuw58kdwupfdn8wj89grv5pk5qmxap9xgqxwwf08k98xnkdrp3n4jme0ur5604xp2q9fxlc0aw47vwfcurtsp9nv0rajv4lmune4mx8h39jvkcpv4fnngk3me5d6vds4m5xe6vuqlz55gnzue7fyyt0vzuwsg8f2ztepupry8g32ee48gmj2lldg96qp5xxcjxetgrq8muj4n7w3kv56spy3zhw8xr7ngd4u6l20pk4yvlsamu3y7nr4na246qqnjszlz6jq0922q8dsefkf7cpz8tc0fv4t2uk6y7r8wy5vtmah2y80al3vmc3kma70p4utwf40mc7x33y66zsgq94e09r5mmj5us835tz95w5r8eqz335lz8rac72d4jzxg0c40nmskvl236nz9dysg6uxp80yugx7cqckstk9f79ha0s6k8nftlmqds3za97648k2usw7xnyf9echpy3lsdsaatleyt5w5z2qgqyrxlaxsgq3tytq4qhjrlfz2dz7kuy7dyr0u4q5p78ux8ylh8tcsau46jevm944a798",
    },
    fee_private: {
        prover: KEY_STORE + "fee_private.prover.43fab98",
        verifier: "fee_private.verifier.f3dfefc",
        verifyingKey:
            "verifier1qygqqqqqqqqqqq8rjvqqqqqqqqq00ycqqqqqqqqqusvszqqqqqqqpnf6qyqqqqqqqqcd6qqqqqqqqqqvqqqqqqqqqqq0plfjy36deglp5xr0lk3rccawpqgztrnjusxnlkc8hz6879me8ty8y7rxzc3qqafadrmvz0v2aluqjwezzwkmj3q9vmr0xgk3arehjhppu7scsw6h4nj08z7fswhyq739ypuh67ff0f0sg8787aq4w80gqrn8e5kduw8h002rkjrw907zqxawqu7qmumx5zayg7k55rdzn05eg5sl8swr7fveuhud3gmf9xjsqzd9x9az5ls4s8cwjgc5lmvkhphy67q0g7qwzee7hyavg335j25mllnywrtjcwfejt55qxag7wvggqtmtc3al0gy6q83hql4wagk37e200592az7n525s80c4xwr92jr8dt40t3fyjxzszrc9umk95psswq82kkg25sh25s3mw5z3xt9qy2ftm8ec4a8l8rwfuxfujjrxxnhmrqs4wsunec3ukd4mur4fkj8enqqqv9n37e5fyag7e33rxsyp63u5rfs8hn26slsmdaqzvp2flcz506r0hqncdtt07nhulltlh5wyq4gpxsln5td2v0treu7t8wanhq6yv8hswxla7cf3w8nv4p233gz0ry9n7sj2uduredwtykw2ec3fs8fqrjkz8agg2xj8t9wden6spzdfcl7jlw4rgzv4hjqvh4cw40yhh8udv5g6vd0jhhfmqevezq0zs4x2q2m7u0hq9mkvulj950t9a5tcm6suycdlaky8t568jevkn3tf9uu5laevjumvahk4cxjxam85kq0l5qrycnmdzgvm7hr8cvl8a7qzcmjkwh48krtxtduhcfn7hvt752slm0nvth0yf35jugxg7ah2kw5emcq4mk962eypxyvwahf4k5ql8376l5za4zvv2p7jzgkjjs4lc60nv3czmdmmc0qn5mwnlnaxmwazs3qzfea0z0sn3nflp8v2lwlczljxre975fnvw3vfyrrjze4wuxtkjg7j37fph",
    },
    fee_public: {
        prover: KEY_STORE + "fee_public.prover.634f153",
        verifier: "fee_public.verifier.09eeb4f",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqrcxyqqqqqqqqq8yvgqqqqqqqqqndesqqqqqqqqpg56qqqqqqqqqqhyyqqqqqqqqqqvqqqqqqqqqqq9a3p0z8q2qzsgq6lsd3zeh3tvezv0d2wg9tykutk9s7dat8uyamgxv54vv5le5slhta92cs08905qy0mgfdx0r7hzc7ec4qn8wmkx2cvtrwggad5h898kkp20eheukemkhj6g37flhpmxq9hpk9q2kfcsr58ufzupqpgfthzxsrn0554ttqckrgfwjfnvpfqhy4evahxkzahkf85pqt0es3j5jc2kzpkcu4ausrm4k53evjtuy3tzc3jgwl7y5t79j0ddhprs6ls9x0qpvqggvkffjg0psvjrmf2rsw5xrdnmqxlx5qru82dsavaka5kfsvxgyrzdf4tzceghyeqpk55308pkc0sg63sgwt8fywksccjdkkrqkh00kgraeuq97zsydp9z6pagtqmaply94dacmk7qkgg5jt36exjxcjdckjgswc5agg9xd4lqmpxxmtur7d7ecvvpg5rg4mzlf65hlpeynczqwdgrdekx7m3n4ljumgezxyzq7h9wmnrqfawayl5gns8gv2jaucwc9qmcq7pj6kvddw8dgpdf0rh66a6erzj9fmupu8ulc2x64092k5sfdm6rlaktdv8fscn8wlct0p9xahl2qqnxsw3tfzms5xplll4xamrlhtjm2xfsqmx62er2lmmzn6wk8788hcpg7uetlrufwlvmapeh00h9aqql6ggsknvwt45wjmfkky7z5ukly3dpjqvqt3yl839d8flcx6kpf5vqvdm57kqdwjazcmfn4ae87yqg08dlw805prfrfjvlyff3kq09z2yxc0pcaqalj7r4e6lygruk2ezpkfjlslyjtek6rtgvfwavqa5pmp6jgmr8xzu5dk0lcmfgm0plw8jkwt60pz2scpuh78k7f4dlfp7grjpn3xtdphhsn0k8rpfwqq3qr6huef2asc990ragxknla7kdl76xr2g2vl8pnql3f58wgcptked7rgeah8",
    },
    inclusion: {
        prover: KEY_STORE + "inclusion.prover.cd85cc5",
        verifier: "inclusion.verifier.e6f3add",
        verifyingKey:
            "verifier1qyyqqqqqqqqqqqzq7qqsqqqqqqq0huqpqqqqqqqqjvksgqqqqqqqqnypqgqqqqqqqzk8sqcqqqqqqqqvqqqqqqqqqqqxsh33gk03qelqrvy0g5m2km5vfhs6flwsutadvdl3nd82a3xqunx8pgaccs2yh654tpnanywulgvpvfxuma59ufttju8mvnpmuhg720p6fawv4ynhe75vfhn3te00saqpd5kpgxw59gf4r3ng3z0hr49gpwlwgkac7zlqk7cne5xh33m96qep9xeu2nf68dye57yqrnqgtaa2vk3ldcpurjn3s4pavzde8cehsrqn57qm2ewew3t4g6css5qzgfywdkkrx0rmz5u68cxvrwaksjd4s2exerl3u7cae58tc383yzd5tqxk66xqldl3ch8ymq73jhufwfcp4r8vcynmjenzt355a3qnejfndw7v5sn9a63wrd86rczgrp8wsuqsth7346q3qgaddsj6ln92233jjvke2krn809qvt8ev940hfclr5etza54055m8upn5jhg224v27cqamjy5lv3qm5nyc9asy0tqz0xsgmkuyp75t2qgv3h9s4av3u5tpmf8qkf7k7gp8rjlf67uncphscspvlmku59mgn4cqlxqqz3qdsyycs2my3emuyj9vnzt0464rfgnnmxwnw4kkqe50f764fjauj73kqcsxzn5mecv507xnetxvhfkt79r6hfvf6nzl735xtfp4r7uxlns3dazwj9mgl4fayzv0nqprh80ydqtq9tl6ffcmav2mlsky8tdrunewu3z8a2qg5wfhxz4j0xsqzfsr50ts63g0wysvnkt4rd6equa0r6fsqhrsjft0qy4jnstawrmnj28llqfgemj868y6aaw5rjftgp5vezg7r2c4q5zeupt4gghwand0jeyv5qfnxtnzh7wflxh7tdd0q6zh2fy635xhmllux8hk946t3kzenmc0355mz309gfachp2verz2qaepxsrj63nr54uga9eh2xcgp85v90dellhsvyx73m2w2qyed52svs62ysg7e3ag",
    },
    join: {
        prover: KEY_STORE + "join.prover.1a76fe8",
        verifier: "join.verifier.4f1701b",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqz2cvqqqqqqqqqx0scqqqqqqqqqc42qzqqqqqqqpvmfqyqqqqqqqquzwqgqqqqqqqqvqqqqqqqqqqqpz6knqjfm77py0mpx68rmc6yavzrjpn3vdn5rmhum6u47fxt3j7auv5mk8epjx0hsa7nfm4llzwqqj84x9cnerm5gach0nzfy0jsvfrylvld5ffe8g63nhw5qng68rs6yrlzrc5229ezc8j4n4y0f2hrqqmdphh3mpglur7evq52n6mx9nls064fpn8wr3vqz75vextjhjmpvcrgs8har5txjnh9tj8lmlusns8nklkw8dh8nc8sv0llh4cgw95l3m7mwugu5nfrrlmyccnmrues4wl0hdfwsq8wvn60y2hl036g3aqzh5cn6n2366fy4hawjn22mj86w2w7twq80pdrea6svl7uq5zyh9nz4qgd72tql95n2xx0zh3wcjyqca5wzv4276exszaunpjduuvjmture49av40ve03akc9qw709wuf9a8hhpwlwwz8acf2z5ngk2d95qzfqhkmllqx4lnupyevkn8zthgu54x55t4cqm7uvmmnu3vtvkmsr4tldemm26shwk8ux27v6lmxkqppuesjj5d3m7x5rsg7yn8cg6hkat6fy8u8zj3n0z26ehqvmq8x2fadtw5jt6pxxfp3cm40ak7x9yqym5qrwjzpr7xwr4t6pjn5ca9g02hnuyvxd9jqpv70a7w05mqatnyzhnfl462xmsehgcwczjkrzz2qxk3wa0elrnvnh9qlz3cc2g8xyag9yrds0jepsvskl55zqtntp6qvkj9nkmlercd95j8g9xdgxv0sq0y6gq32ng5r9zcs4wt3vryhldxtr9epyz5vnnx4mf2lhv4r56mftaugjemxezpjcv9enr259tf7qq66a7ngsc3y0a5jlm8jg2rnd9c38ny2m5egl7ssx62zcscztkmjqpkvta2za4ym5jkatgzd2zspfcrc7gesjxjgcvhsua3jpyzpdan6mestyqsx5eatkmzv9zmpwkur3c34sjzc",
    },
    split: {
        prover: KEY_STORE + "split.prover.e6d12b9",
        verifier: "split.verifier.2f9733d",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqpehuqqqqqqqqq930cqqqqqqqqq295qzqqqqqqqqyyyqyqqqqqqqzjjvqgqqqqqqqqvqqqqqqqqqqqyjhdhawnd33kv88ehql385slkd7lyr46jnf7yathmnxnr7at2j6u4nfkkvryujwt8rvhdfpuw94qq8e7sp33sjtyz53q89k85ttcg2cvadvuadeuq5xn4hgkmvm3qj93er0t2pjpd2p4kd3zy2gqmqd5qpfzdk973253ufzafqwd9879c7wpdv500a4xhetxkareamyl2qqzdd5hxl94vnmrkluzx0te32rkusqs20xswldqdgekfh6p25yxjhls20k59lsfn9az8jak9lr6r745ujsq0jq9fvugqyqchuca8xq6stq0svvu7e4xguc84t3s72erg4ve2z3nsr3jqv6jtala9j3xf5msksupprwwxkwwl58pv2hmr4g5h4xqym3nj6ax7ujx70np7egc4nw0w3j02m34eq00gssjq0pf9xfltxtef29crye3sul45kkawnrl6uzvquszlgltwtgx2xjlehgh0xpdm68dyjev9qxsleetpc33mns5jakrmqqryk8qgmnc56dzgcwm99eccq6c93576s946jztmuvgp8522y00jpck54wlcg3me44sk8usehsnjgm85zmypjsf7nlp06na927dtqp7u45jnd3em0n9h0wgtgvwh7lyhq4guwdfxws8mswwzfr5fjdtv0smjeq3r58v03amrhgr2ex4h7q8wapp8h5ug8vh0fxkt6yp3l2mas3l0jmmpedy9vx4lnxmjwn8t4wxyrdnnr54jxmp0wyu3sf6wwkqa6r2g2u9qu5km92fjnckme07mrxghuxh9ktpj9cvaf08sccdtdwjsnkyt9qu2x5ft27tkrskudrqpyr63x640xlk9wqpmy3edx58wxwzesmx22v62y6lshjv3wur83jlmwm74qqpd34ewmrk7eg0jfp7cretx5jwfv5c904v9qazfyluh5fpdczgx9fluayuukfwnqjq8tdwx3shuy5",
    },
    transfer_private: {
        prover: KEY_STORE + "transfer_private.prover.2b487c0",
        verifier: "transfer_private.verifier.3a3cbba",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqqvccqqqqqqqqqz43sqqqqqqqqq7jqqzqqqqqqqpj4vqyqqqqqqqq0zuqgqqqqqqqqvqqqqqqqqqqqyvnz4pl9kjr0ks3dtkz67gw8tyqzs3sxskt8xg6keqrrqk9nj3e39kg65lzz5sd5tug2ecrpmfg5peseqmv709nry8up96qwsuvpp8684njpe4qunfhf7ywc0a7lck9rdlfcred8krn60lgztx4wlrlmspnnkwe9gmqk07tt5lj3wxcpucpshz7ec6w5mqvspprmu88lr9tr9e7a9fqdye0jdajq46pt35hdjsruamruf6v73fu68hv5fcsndmfq3c65yjrmljfg3343vj8cca2js2gumrks9eepm3d7g02jw0se9eqpaj86kpscxu4vuvw7jedgt2c0l4fk5zqwdu3vfhrazjwedl5d0n9w75ky0924qjjzg3c04dw7p8uqxqnuph6d3d935zqavxtte336jmnpk0hkjn80cejqfljl7w6jtnl3tedhtdk4cx207c7lud9xagzcp760x47h3hrw68syru4rnr3zgy99wcpnglpjvndzrjpc3z8c53xyqx0jh8cnt6gn92fgqu8a5huespxgnckqgttq8aa7xngxt9f5lpq2zgakfhtfvhlcy66k3depln3x67ck2m9t0fvnetjygj6h2er2fqqwcf2ghjp5fvq4e68635ql0lv5uv4c82575dcv87a0y8745g6gvjenh49zppsekc82dect9ggp3aqxqnc73dmd38pe4x7v9wwv6namfe7337tczyfz47dyxxzy8fslktv47yn8r87n0nap5qlc9gzgd2yq8m6zj0ulzgaqls2dq2atkfzxu5rjguvcjxnmn7hr8uxgxuzrwtmcftz4emn24vpq5pcwxf29a7w5p80e7f2tv7ags5k0pj9fghaklzm5xrakpsk3gv4xzvzqj6u2denjw60q777r5889xqrvchhtac4xspue4mncvgerscq4dslzkt4mg4zuv6t6gahcvnm2p6r02ns62xsdexs8jxt",
    },
    transfer_private_to_public: {
        prover: KEY_STORE + "transfer_private_to_public.prover.1ff64cb",
        verifier: "transfer_private_to_public.verifier.d5b60de",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqrwjvqqqqqqqqqgpycqqqqqqqqquvvqzqqqqqqqqceuqyqqqqqqqqyd6qqqqqqqqqqvqqqqqqqqqqqr8z97pzqh2lxcc4tasdu784svuk6lv62sj78flptnzqks3hyu42ymryngdzr2mw6j4nxm4cmx8tgqnfzdkccekds6nhs4c7t2hf84d38jkuufdrf43ls4zm9htqarx9mv3gswcxp74kelgy36yhpsrfkgzdr8vy8580sulvaw36pxjjv0j543rml679z305kt2ju3wzarmsukzkfp56qnc0pjuptzajkes95uspd0uz3fd9fu5vmxwfwq9cj5qh0yjq398h729yygdm0fzkrl9g6faevalks3yc7xl3le38k77t3exqqnn82yyjpunpn763s8hkaguvn67jehqcvt8tvhql8skpesm9tm2hgeryk934h8c8cdcgynjq5cj2qer7kkjc2rrmg5j6agac0ya88up0sl2skxsvkw0rgxlgxjtjqc4g8c3xssq2sk6e2dufvc480rj8vqcrhtqsjqdkzq3nanlvngrjxchnzwfywwjphj5jeza2lyynrk5awz8v6jtwgxu2fs6uqrykz5lz6qpt2dfs670clhjpagxny40nmgeqtf9w8hu4v7yjpgwpv89v05u2ahdryu4538augkjhdx3hvfahwuszd8zyqmcxhrcq039hcrkd5qgadhj257vvrf27dwu64kl0j237efzvt5d360umxw3xk6tej5cxv9zqxqzc7ryqndhttaw5act9kwt8kvxtdjnzy99q8gzmg2429f94h6csrqejzc4n40xjcsdwn98hdekyqzytrh35w6t3r5d86kqt897kv5mldx9w06h4rldk734hvn096gt7e4smleja7canyfpv798cksshgq7hkyt6elvzp3rpj9nd84ykt9lzgjsswn4y8934ay3575u3sx7mkeuca0zsere2q0jmlsl6w6v2qcq424uhnmqn9q5vw22jgy94pry2junps40ug867d79h2zvd0n02nmlz05hd",
    },
    transfer_public: {
        prover: KEY_STORE + "transfer_public.prover.a74565e",
        verifier: "transfer_public.verifier.a4c2906",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqq79uqqqqqqqqqp2tcqqqqqqqqqwd4qqqqqqqqqp5ydqqqqqqqqqqvyqqqqqqqqqqqvqqqqqqqqqqqre7drur40rst43dq9at346py7hkmrhexarf59f2tjt4stlsdj5uwrgnrkjjej7jf3djk2w4njtxcq0mezac793craujm8mr7wutcqtu2aday5g03wl0cu2572fsrtpyjhdyqlh0447z7dshlkhksjsusgp4ezrvc0n64fwetfmml3kvfg7n03w2e602sl7et4cpw98hgpzxwzrmzu8r3x77v49njysy2lp55xsqh6t5qjvhyl5a7nzy3e73y7dzvvs9p450u0s8g84prqnrk6jeah89c6882uzqdvxgzcedfmsc43uq99n3ycrjh70ys8n02pyvdvzmu7z608desdd5yw9dc8v3ddrdddmrzz2pupe09yn9esy25cfzmd0wqcgjdxm4dvlt2t6k66lw8e9ccj49qj2ahpht62kh7p56xpvpekenq2arng2t55mwxe59mqpkp6a0yqlwt7tdf98rt3kqlr9tdtq6hua3wrka0mqzhva4nhucxn9u4w92mly69jy2c7cqm5ftnk3m0qxy9spaxwfz0xkqd947yvf2zh8h4y59fltxdpeu4utpv9zw0cr7ad9d462qxyc2f05lezw6dwhcmep942qqv38lp3x9efestt5pk8rplvmrk0zz9zel48l8h9ldfzyd8zyr7knze92cdyanez6k7q5fu6tnw9wqrywjnhevaujz20xn0h3n47g85zs6ejfh7z8jt9qjesqgmdymvcxlceudkdsl49t5r69c4mg7hfwyq88z7zn0efda8fdjmhz8aaq24q34g2ekdzr5w9em3cev2ktxtmupqwltu0nh3fjzm04cy3cgnqlnqq0chzq4rs2dmfjwryxrxxgjtdcsnn9fpwykkxwfuervtznu3lmvhhpdflgwgm0xklu6c0xsxt9dfcp29w2nz6zkjetz7cqremg68eqxq86rn082czp50ldw9qkq6w3p9xxg4hrg",
    },
    transfer_public_to_private: {
        prover: KEY_STORE + "transfer_public_to_private.prover.1bcddf9",
        verifier: "transfer_public_to_private.verifier.b094554",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqrhvqqqqqqqqqq8kcqqqqqqqqqqu0xsqqqqqqqqqw0kqqqqqqqqqreg7qqqqqqqqqqvqqqqqqqqqqqta360tn6dhv5z559ejfahwq88lxtd498py5p3vw5u3rwtfvdzpxq7fuqdahsrennq80g8yc6wqjyq8ahdv3jzry0mxceed0jr2cd0wye3e7782pg3phsu8h7hcapfgdghcgg2ykfc2682xefhsp3plqnqp692097k4ja82ecc2descl4d6csug04cz2j9a5pk3djx6xde2ghgq7uqvuhsg47ksueeetvc7mh2qpvqjmph9eekp5waqunkeea9vkvzyl8culmn5t7l9ke3r7uz8v5r8njjdkug6va9vy6axx9aq2kxaqdd9ll2m3j7qg7eyq3k2pnhq7gx2kv8vm3yf5pyqtywt2hvur5uv45y5st53qh970dktd3k709d9sqwv0d6qaksxjcp2cxu282hcewhy66vfs5kp35e6k4shdmjzmglyqqcsnupv8xwdr3596qypzshnuuq8rpm8pyjwtws63wsazqt8tlqhkkxucf0zjc384wvv2jemdnjwd6hn9745h8qc4kqp0rzs9wkx0hcp22xzuyyk7gpsc9ahw7pdenpje3etp37lfrcuntehl8wm2eudrh0j04szjzrv0n3r2gv04mgau5ysqtdcddq44xtt6t6f08c9zuhqukk8zy75jru0exufnh74u97d4xwe005ug7ywmcnyz8u6nvdav2xxqqzpg0luhghl8xu7g0cjgxse0lnqqedc7cc47nc048h2t44gedjq7f49ghajc9gwclp962v4q2855qvgdtkmr29cpwwq8vghlcjv0g6k0a0xa8yrmmnd5l7umnuqcd4x9rcejc3mkjgpw8y6mue2n5tx9cpahnw37yey5k38j98dnr9jss00420jvk7nh59hul7ef69n8ktcltl8f0t93rya5y8d2cspyjp6c7crvg2d4m37z78dualsqr9u7vtge07psdtl4l9785fxl3wgf9u277puvgvuq",
    },
    unbond_public: {
        prover: KEY_STORE + "unbond_public.prover.78b2191",
        verifier: "unbond_public.verifier.96c3590",
        verifyingKey:
            "verifier1qygqqqqqqqqqqqp89yqqqqqqqqqp62gqqqqqqqqq892qqqqqqqqqqym2qqqqqqqqqparjqqqqqqqqqqvqqqqqqqqqqqp9uker5608hsejeh46lk307z2ewatecukttkp7elhurugmwqay3ypevdjjt6ly68e9eyt2cnx7dcqrrf24kwmmy5ptlpyy72r5ul2lynras4lluy7ke6spzjx97m2qvjy3jhsdk8tpkwj3vqf37hcncjcqm5mrvp4v8txatw8hhtrklu0pjgx9p39jvvjxsqghf8rxm8edyacw3h8g7mqz8u8acay65tskf42qz5sqfvpfvg9ycnw3mp7jqnv80dnmev9k788aycnx9ufa09qfzjnxwnr6503ckc8465welwq7vxqlqyuezzshvq3gfpvdnqgrsda7kv88sq7nqpttlyqczrmsf6xln80ejcwshagevykxjc09numhdc4r7qlme5zlrjru7lyexcxq75qvtpqhkkz0zmfmm9paddlrk88xcctmhdun6rt0rzkdxx0fdgughvxlmyq32ct8s0k0qlf3rwlggvhvsw4ekl683ls9la7lcga87ereutr34fke6qzdkxz94rqzrl2msyhax9grx2t5jtkfenxsudq6mfjv0uhtxycalyk2k6c4hwdq5z33x4kcgns2tsx5hstvv6pp9phv0cedf4ysqgavdjlnx2g4tvw9wmmz7ghmm03jkutq568pxx7ahp7kjfe9ta2eas7qkj2r4ue0pwa5ft9k88r5qw32mymhz4p3cpg5g5v0z6kkukh9zxjzsdqnvglsdtj64u4dtu2epnnuckz3fgqw4mrn54nvvwv8zquwsz9jqp4zrux2xghqk6fh4y29vm3aq4v6kh4zmnwhuf0y249grf8u7xc6cu3rrz5ugpnzvawpyypmfnl58xgm0gq8m8zsn7uw436hhjwewyhwkva6trxdfxfr7rpn2qdu2yp2ulu7ezpr0meet8ht3zsqjyezyylcgrjttgphl0t2ckte6jwm6la7mlhz7ya8rancl44m9dpy798f9",
    }
};

const PRIVATE_TRANSFER_TYPES = new Set([
    "transfer_private",
    "private",
    "transferPrivate",
    "transfer_private_to_public",
    "privateToPublic",
    "transferPrivateToPublic",
]);
const VALID_TRANSFER_TYPES = new Set([
    "transfer_private",
    "private",
    "transferPrivate",
    "transfer_private_to_public",
    "privateToPublic",
    "transferPrivateToPublic",
    "transfer_public",
    "public",
    "transferPublic",
    "transfer_public_to_private",
    "publicToPrivate",
    "transferPublicToPrivate",
]);
const PRIVATE_TRANSFER = new Set([
    "private",
    "transfer_private",
    "transferPrivate",
]);
const PRIVATE_TO_PUBLIC_TRANSFER = new Set([
    "private_to_public",
    "privateToPublic",
    "transfer_private_to_public",
    "transferPrivateToPublic",
]);
const PUBLIC_TRANSFER = new Set([
    "public",
    "transfer_public",
    "transferPublic",
]);
const PUBLIC_TO_PRIVATE_TRANSFER = new Set([
    "public_to_private",
    "publicToPrivate",
    "transfer_public_to_private",
    "transferPublicToPrivate",
]);

function logAndThrow(message: string): Error {
    console.error(message);
    throw message;
}

import { Account } from "./account";
import { AleoNetworkClient, ProgramImports } from "./network-client";
import { Block } from "./models/block";
import { Execution } from "./models/execution";
import { Input } from "./models/input";
import { Output } from "./models/output";
import { Transaction } from "./models/transaction";
import { Transition } from "./models/transition";
import {
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    CachedKeyPair,
    FunctionKeyPair,
    FunctionKeyProvider,
    KeySearchParams,
} from "./function-key-provider";
import {
    BlockHeightSearch,
    NetworkRecordProvider,
    RecordProvider,
    RecordSearchParams,
} from "./record-provider";

// @TODO: This function is no longer needed, remove it.
async function initializeWasm() {
    console.warn("initializeWasm is deprecated, you no longer need to use it");
}

export { createAleoWorker } from "./managed-worker";

export { ProgramManager } from "./program-manager";

export {
    Address,
    Execution as FunctionExecution,
    ExecutionResponse,
    Field,
    OfflineQuery,
    PrivateKey,
    PrivateKeyCiphertext,
    Program,
    ProgramManager as ProgramManagerBase,
    ProvingKey,
    RecordCiphertext,
    RecordPlaintext,
    Signature,
    Transaction as WasmTransaction,
    VerifyingKey,
    ViewKey,
    initThreadPool,
    verifyFunctionExecution,
} from "@aleohq/wasm";

export { initializeWasm };

export {
    Account,
    AleoKeyProvider,
    AleoKeyProviderParams,
    AleoKeyProviderInitParams,
    AleoNetworkClient,
    Block,
    BlockHeightSearch,
    CachedKeyPair,
    Execution,
    FunctionKeyPair,
    FunctionKeyProvider,
    Input,
    KeySearchParams,
    NetworkRecordProvider,
    ProgramImports,
    Output,
    RecordProvider,
    RecordSearchParams,
    Transaction,
    Transition,
    CREDITS_PROGRAM_KEYS,
    KEY_STORE,
    PRIVATE_TRANSFER,
    PRIVATE_TO_PUBLIC_TRANSFER,
    PRIVATE_TRANSFER_TYPES,
    PUBLIC_TRANSFER,
    PUBLIC_TO_PRIVATE_TRANSFER,
    VALID_TRANSFER_TYPES,
    logAndThrow,
};
