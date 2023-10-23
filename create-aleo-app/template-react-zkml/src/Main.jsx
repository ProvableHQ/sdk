import React, { useEffect, useRef, useState } from "react";
import {
    NumberOutlined,
    SlidersOutlined,
    TagsOutlined,
} from "@ant-design/icons";
import {
    Layout,
    Menu,
    Card,
    Row,
    Col,
    Slider,
    Button,
    Progress,
    Space,
    Typography,
    Input,
} from "antd";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Column } from "@ant-design/charts";
import aleoLogo from "./assets/aleo.svg";
import {Account, initThreadPool, PrivateKey, ProgramManager,} from "@aleohq/sdk";
import { AleoWorker } from "./workers/AleoWorker.js";

const { Text, Title, Paragraph } = Typography;
const { Header, Content, Footer, Sider } = Layout;


const aleoWorker = AleoWorker();
//import helloworld_program from "../helloworld/build/main.aleo?raw";


const Main = () => {
    const [account, setAccount] = useState(null);

    const generateAccount = async () => {
        const key = await aleoWorker.getPrivateKey();
        setAccount(await key.to_string());
      };
    
      async function execute(features) {

        // helpful tool: https://codepen.io/jsnelders/pen/qBByqQy

        //const helloworld_program = "program helloworld.aleo;\nfunction main:\ninput r0 as u32.public;\ninput r1 as u32.private;\nadd r0 r1 into r2;\noutput r2 as u32.private;\n";
        //const helloworld_program = "program helloworld.aleo; {struct Struct0 {x0: i64,x1: i64}transition main (struct0_0: Struct0) -> (i64) {let output : i64 = relu(struct0_0.x0 + struct0_0.x1);return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";
        //const helloworld_program = "program helloworld.aleo; {\nstruct Struct0 {\nx0: i64,\nx1: i64\n}\ntransition main (struct0_0: Struct0) -> (i64) {\nlet output : i64 = relu(struct0_0.x0 + struct0_0.x1);\nreturn (output);\n}function relu(x: i64) -> i64 {\nif x < 0i64 {return 0i64;} else {return x;\n}\n}\n}";
        //const helloworld_program = "program helloworld.aleo; {transition main (x0: i64, x1:i64) -> (i64) {let output : i64 = x0 + x1;return (output);}function relu(x: i64) -> i64 {if x < 0i64 {return 0i64;} else {return x;}}}";

        const helloworld_program = "program sklearn_mlp_mnist_1.aleo;\n\nstruct Struct0:\n    x0 as i64;\n    x1 as i64;\n\n\nclosure relu:\n    input r0 as i64;\n    lt r0 0i64 into r1;\n    ternary r1 0i64 r0 into r2;\n    output r2 as i64;\n\n\nfunction main:\n    input r0 as Struct0.private;\n    add r0.x0 r0.x1 into r1;\n    call relu r1 into r2;\n    output r2 as i64.private;\n";
        const int_type = "i64";

        console.log("features in execute: ", features)

        const fixed_point_scaling_factor = 16;
        const fixed_point_features = features.map((feature) => Math.round(feature * fixed_point_scaling_factor));

        console.log("fixed_point_features: ", fixed_point_features)

        //const mlp_progarm = "program sklearn_mlp_mnist_1.aleo;\n\nstruct Struct0:\n    x0 as i64;\n    x1 as i64;\n\nstruct Struct1:\n    x0 as i64;\n\n\nclosure relu:\n    input r0 as i64;\n    lt r0 0i64 into r1;\n    ternary r1 0i64 r0 into r2;\n    output r2 as i64;\n\n\nfunction main:\n    input r0 as Struct0.private;\n    input r1 as Struct0.private;\n    input r2 as Struct0.private;\n    input r3 as Struct0.private;\n    input r4 as Struct1.private;\n    input r5 as Struct1.private;\n    input r6 as Struct1.private;\n    input r7 as Struct1.private;\n    input r8 as Struct1.private;\n    input r9 as Struct1.private;\n    input r10 as Struct1.private;\n    input r11 as Struct1.private;\n    input r12 as Struct1.private;\n    input r13 as Struct1.private;\n    input r14 as Struct1.private;\n    input r15 as Struct1.private;\n    mul -3i64 r0.x0 into r16;\n    mul 2i64 r0.x1 into r17;\n    add r16 r17 into r18;\n    mul -20i64 r1.x0 into r19;\n    add r18 r19 into r20;\n    mul -13i64 r1.x1 into r21;\n    add r20 r21 into r22;\n    mul -6i64 r2.x0 into r23;\n    add r22 r23 into r24;\n    mul -2i64 r3.x0 into r25;\n    add r24 r25 into r26;\n    mul -15i64 r3.x1 into r27;\n    add r26 r27 into r28;\n    mul -9i64 r6.x0 into r29;\n    add r28 r29 into r30;\n    mul -3i64 r7.x0 into r31;\n    add r30 r31 into r32;\n    mul 10i64 r8.x0 into r33;\n    add r32 r33 into r34;\n    mul -5i64 r11.x0 into r35;\n    add r34 r35 into r36;\n    mul 11i64 r12.x0 into r37;\n    add r36 r37 into r38;\n    mul 3i64 r15.x0 into r39;\n    add r38 r39 into r40;\n    add r40 38i64 into r41;\n    call relu r41 into r42;\n    mul 2i64 r1.x1 into r43;\n    mul 6i64 r2.x0 into r44;\n    add r43 r44 into r45;\n    mul 9i64 r2.x1 into r46;\n    add r45 r46 into r47;\n    mul 4i64 r3.x0 into r48;\n    add r47 r48 into r49;\n    mul -6i64 r3.x1 into r50;\n    add r49 r50 into r51;\n    mul 4i64 r4.x0 into r52;\n    add r51 r52 into r53;\n    mul 12i64 r6.x0 into r54;\n    add r53 r54 into r55;\n    mul 20i64 r7.x0 into r56;\n    add r55 r56 into r57;\n    mul -3i64 r8.x0 into r58;\n    add r57 r58 into r59;\n    mul 12i64 r10.x0 into r60;\n    add r59 r60 into r61;\n    mul 4i64 r11.x0 into r62;\n    add r61 r62 into r63;\n    mul -15i64 r12.x0 into r64;\n    add r63 r64 into r65;\n    mul -3i64 r13.x0 into r66;\n    add r65 r66 into r67;\n    mul -16i64 r14.x0 into r68;\n    add r67 r68 into r69;\n    add r69 129i64 into r70;\n    call relu r70 into r71;\n    mul 7i64 r0.x0 into r72;\n    mul 2i64 r1.x0 into r73;\n    add r72 r73 into r74;\n    mul 3i64 r1.x1 into r75;\n    add r74 r75 into r76;\n    mul 5i64 r2.x1 into r77;\n    add r76 r77 into r78;\n    mul 2i64 r3.x0 into r79;\n    add r78 r79 into r80;\n    mul 4i64 r5.x0 into r81;\n    add r80 r81 into r82;\n    mul -2i64 r6.x0 into r83;\n    add r82 r83 into r84;\n    mul -8i64 r8.x0 into r85;\n    add r84 r85 into r86;\n    mul 4i64 r9.x0 into r87;\n    add r86 r87 into r88;\n    mul -5i64 r12.x0 into r89;\n    add r88 r89 into r90;\n    mul -2i64 r13.x0 into r91;\n    add r90 r91 into r92;\n    mul -5i64 r14.x0 into r93;\n    add r92 r93 into r94;\n    mul -22i64 r15.x0 into r95;\n    add r94 r95 into r96;\n    add r96 373i64 into r97;\n    call relu r97 into r98;\n    mul 4i64 r0.x1 into r99;\n    mul -3i64 r1.x0 into r100;\n    add r99 r100 into r101;\n    mul -2i64 r1.x1 into r102;\n    add r101 r102 into r103;\n    mul 3i64 r2.x0 into r104;\n    add r103 r104 into r105;\n    mul 9i64 r4.x0 into r106;\n    add r105 r106 into r107;\n    mul 3i64 r6.x0 into r108;\n    add r107 r108 into r109;\n    mul 5i64 r7.x0 into r110;\n    add r109 r110 into r111;\n    mul 18i64 r8.x0 into r112;\n    add r111 r112 into r113;\n    mul 4i64 r9.x0 into r114;\n    add r113 r114 into r115;\n    mul 20i64 r10.x0 into r116;\n    add r115 r116 into r117;\n    mul -4i64 r11.x0 into r118;\n    add r117 r118 into r119;\n    mul 20i64 r12.x0 into r120;\n    add r119 r120 into r121;\n    mul -6i64 r13.x0 into r122;\n    add r121 r122 into r123;\n    mul -2i64 r14.x0 into r124;\n    add r123 r124 into r125;\n    add r125 113i64 into r126;\n    call relu r126 into r127;\n    mul -4i64 r0.x0 into r128;\n    mul -4i64 r0.x1 into r129;\n    add r128 r129 into r130;\n    mul 3i64 r1.x0 into r131;\n    add r130 r131 into r132;\n    mul 6i64 r1.x1 into r133;\n    add r132 r133 into r134;\n    mul -5i64 r2.x0 into r135;\n    add r134 r135 into r136;\n    mul 3i64 r2.x1 into r137;\n    add r136 r137 into r138;\n    mul -11i64 r3.x0 into r139;\n    add r138 r139 into r140;\n    mul 12i64 r3.x1 into r141;\n    add r140 r141 into r142;\n    mul 11i64 r5.x0 into r143;\n    add r142 r143 into r144;\n    mul 2i64 r6.x0 into r145;\n    add r144 r145 into r146;\n    mul -2i64 r8.x0 into r147;\n    add r146 r147 into r148;\n    mul 22i64 r9.x0 into r149;\n    add r148 r149 into r150;\n    mul -11i64 r10.x0 into r151;\n    add r150 r151 into r152;\n    mul 17i64 r11.x0 into r153;\n    add r152 r153 into r154;\n    mul 5i64 r12.x0 into r155;\n    add r154 r155 into r156;\n    mul 9i64 r13.x0 into r157;\n    add r156 r157 into r158;\n    mul -7i64 r14.x0 into r159;\n    add r158 r159 into r160;\n    add r160 54i64 into r161;\n    call relu r161 into r162;\n    mul -4i64 r0.x0 into r163;\n    mul -5i64 r0.x1 into r164;\n    add r163 r164 into r165;\n    mul -4i64 r1.x0 into r166;\n    add r165 r166 into r167;\n    mul 3i64 r2.x1 into r168;\n    add r167 r168 into r169;\n    mul -23i64 r3.x0 into r170;\n    add r169 r170 into r171;\n    mul 4i64 r3.x1 into r172;\n    add r171 r172 into r173;\n    mul -9i64 r4.x0 into r174;\n    add r173 r174 into r175;\n    mul -16i64 r6.x0 into r176;\n    add r175 r176 into r177;\n    mul -19i64 r8.x0 into r178;\n    add r177 r178 into r179;\n    mul 3i64 r9.x0 into r180;\n    add r179 r180 into r181;\n    mul -19i64 r10.x0 into r182;\n    add r181 r182 into r183;\n    mul -12i64 r12.x0 into r184;\n    add r183 r184 into r185;\n    mul -3i64 r13.x0 into r186;\n    add r185 r186 into r187;\n    mul 10i64 r14.x0 into r188;\n    add r187 r188 into r189;\n    add r189 322i64 into r190;\n    call relu r190 into r191;\n    mul 9i64 r0.x0 into r192;\n    mul -17i64 r1.x0 into r193;\n    add r192 r193 into r194;\n    mul 15i64 r2.x0 into r195;\n    add r194 r195 into r196;\n    mul 7i64 r2.x1 into r197;\n    add r196 r197 into r198;\n    mul 15i64 r4.x0 into r199;\n    add r198 r199 into r200;\n    mul -5i64 r5.x0 into r201;\n    add r200 r201 into r202;\n    mul -13i64 r6.x0 into r203;\n    add r202 r203 into r204;\n    mul 5i64 r8.x0 into r205;\n    add r204 r205 into r206;\n    mul -2i64 r9.x0 into r207;\n    add r206 r207 into r208;\n    mul -5i64 r10.x0 into r209;\n    add r208 r209 into r210;\n    mul -2i64 r11.x0 into r211;\n    add r210 r211 into r212;\n    mul 4i64 r12.x0 into r213;\n    add r212 r213 into r214;\n    mul -10i64 r13.x0 into r215;\n    add r214 r215 into r216;\n    mul -5i64 r14.x0 into r217;\n    add r216 r217 into r218;\n    add r218 101i64 into r219;\n    call relu r219 into r220;\n    mul 25i64 r0.x0 into r221;\n    mul 5i64 r0.x1 into r222;\n    add r221 r222 into r223;\n    mul 9i64 r1.x0 into r224;\n    add r223 r224 into r225;\n    mul 2i64 r1.x1 into r226;\n    add r225 r226 into r227;\n    mul 11i64 r2.x1 into r228;\n    add r227 r228 into r229;\n    mul -14i64 r3.x1 into r230;\n    add r229 r230 into r231;\n    mul 4i64 r4.x0 into r232;\n    add r231 r232 into r233;\n    mul 7i64 r6.x0 into r234;\n    add r233 r234 into r235;\n    mul 3i64 r7.x0 into r236;\n    add r235 r236 into r237;\n    mul -2i64 r8.x0 into r238;\n    add r237 r238 into r239;\n    mul 7i64 r9.x0 into r240;\n    add r239 r240 into r241;\n    mul 3i64 r13.x0 into r242;\n    add r241 r242 into r243;\n    mul 10i64 r14.x0 into r244;\n    add r243 r244 into r245;\n    add r245 485i64 into r246;\n    call relu r246 into r247;\n    mul 12i64 r0.x0 into r248;\n    mul 22i64 r0.x1 into r249;\n    add r248 r249 into r250;\n    mul 10i64 r1.x0 into r251;\n    add r250 r251 into r252;\n    mul 9i64 r1.x1 into r253;\n    add r252 r253 into r254;\n    mul 3i64 r2.x1 into r255;\n    add r254 r255 into r256;\n    mul 8i64 r3.x0 into r257;\n    add r256 r257 into r258;\n    mul 8i64 r3.x1 into r259;\n    add r258 r259 into r260;\n    mul 8i64 r6.x0 into r261;\n    add r260 r261 into r262;\n    mul 2i64 r7.x0 into r263;\n    add r262 r263 into r264;\n    mul 6i64 r8.x0 into r265;\n    add r264 r265 into r266;\n    mul 6i64 r12.x0 into r267;\n    add r266 r267 into r268;\n    mul -3i64 r15.x0 into r269;\n    add r268 r269 into r270;\n    add r270 150i64 into r271;\n    call relu r271 into r272;\n    mul -8i64 r0.x0 into r273;\n    mul -10i64 r0.x1 into r274;\n    add r273 r274 into r275;\n    mul 13i64 r1.x0 into r276;\n    add r275 r276 into r277;\n    mul -18i64 r1.x1 into r278;\n    add r277 r278 into r279;\n    mul 9i64 r2.x0 into r280;\n    add r279 r280 into r281;\n    mul -30i64 r2.x1 into r282;\n    add r281 r282 into r283;\n    mul 7i64 r3.x0 into r284;\n    add r283 r284 into r285;\n    mul -13i64 r5.x0 into r286;\n    add r285 r286 into r287;\n    mul 14i64 r6.x0 into r288;\n    add r287 r288 into r289;\n    mul -11i64 r7.x0 into r290;\n    add r289 r290 into r291;\n    mul -5i64 r9.x0 into r292;\n    add r291 r292 into r293;\n    mul 9i64 r10.x0 into r294;\n    add r293 r294 into r295;\n    mul -4i64 r11.x0 into r296;\n    add r295 r296 into r297;\n    mul -5i64 r14.x0 into r298;\n    add r297 r298 into r299;\n    add r299 299i64 into r300;\n    call relu r300 into r301;\n    mul 9i64 r0.x0 into r302;\n    mul -6i64 r0.x1 into r303;\n    add r302 r303 into r304;\n    mul -3i64 r1.x0 into r305;\n    add r304 r305 into r306;\n    mul -16i64 r1.x1 into r307;\n    add r306 r307 into r308;\n    mul -9i64 r2.x1 into r309;\n    add r308 r309 into r310;\n    mul -2i64 r3.x0 into r311;\n    add r310 r311 into r312;\n    mul -9i64 r3.x1 into r313;\n    add r312 r313 into r314;\n    mul 13i64 r4.x0 into r315;\n    add r314 r315 into r316;\n    mul -12i64 r5.x0 into r317;\n    add r316 r317 into r318;\n    mul 11i64 r6.x0 into r319;\n    add r318 r319 into r320;\n    mul -10i64 r7.x0 into r321;\n    add r320 r321 into r322;\n    mul -3i64 r9.x0 into r323;\n    add r322 r323 into r324;\n    mul -11i64 r11.x0 into r325;\n    add r324 r325 into r326;\n    mul 7i64 r12.x0 into r327;\n    add r326 r327 into r328;\n    mul 2i64 r14.x0 into r329;\n    add r328 r329 into r330;\n    add r330 86i64 into r331;\n    call relu r331 into r332;\n    mul -5i64 r0.x1 into r333;\n    mul 8i64 r1.x0 into r334;\n    add r333 r334 into r335;\n    mul 8i64 r2.x0 into r336;\n    add r335 r336 into r337;\n    mul -9i64 r2.x1 into r338;\n    add r337 r338 into r339;\n    mul 11i64 r3.x0 into r340;\n    add r339 r340 into r341;\n    mul 9i64 r4.x0 into r342;\n    add r341 r342 into r343;\n    mul 20i64 r6.x0 into r344;\n    add r343 r344 into r345;\n    mul 4i64 r8.x0 into r346;\n    add r345 r346 into r347;\n    mul 7i64 r12.x0 into r348;\n    add r347 r348 into r349;\n    mul 3i64 r15.x0 into r350;\n    add r349 r350 into r351;\n    add r351 551i64 into r352;\n    call relu r352 into r353;\n    mul -10i64 r0.x0 into r354;\n    mul -4i64 r1.x0 into r355;\n    add r354 r355 into r356;\n    mul 3i64 r1.x1 into r357;\n    add r356 r357 into r358;\n    mul -5i64 r2.x0 into r359;\n    add r358 r359 into r360;\n    mul -22i64 r4.x0 into r361;\n    add r360 r361 into r362;\n    mul -3i64 r6.x0 into r363;\n    add r362 r363 into r364;\n    mul 4i64 r7.x0 into r365;\n    add r364 r365 into r366;\n    mul -2i64 r8.x0 into r367;\n    add r366 r367 into r368;\n    mul 2i64 r9.x0 into r369;\n    add r368 r369 into r370;\n    mul 12i64 r10.x0 into r371;\n    add r370 r371 into r372;\n    mul -11i64 r12.x0 into r373;\n    add r372 r373 into r374;\n    mul -3i64 r13.x0 into r375;\n    add r374 r375 into r376;\n    mul -4i64 r14.x0 into r377;\n    add r376 r377 into r378;\n    mul 7i64 r15.x0 into r379;\n    add r378 r379 into r380;\n    add r380 414i64 into r381;\n    call relu r381 into r382;\n    mul -8i64 r0.x1 into r383;\n    mul 3i64 r1.x0 into r384;\n    add r383 r384 into r385;\n    mul -6i64 r1.x1 into r386;\n    add r385 r386 into r387;\n    mul 26i64 r2.x0 into r388;\n    add r387 r388 into r389;\n    mul -8i64 r2.x1 into r390;\n    add r389 r390 into r391;\n    mul -5i64 r5.x0 into r392;\n    add r391 r392 into r393;\n    mul 5i64 r6.x0 into r394;\n    add r393 r394 into r395;\n    mul 5i64 r7.x0 into r396;\n    add r395 r396 into r397;\n    mul -3i64 r8.x0 into r398;\n    add r397 r398 into r399;\n    mul 2i64 r10.x0 into r400;\n    add r399 r400 into r401;\n    mul 4i64 r11.x0 into r402;\n    add r401 r402 into r403;\n    mul -3i64 r12.x0 into r404;\n    add r403 r404 into r405;\n    mul 2i64 r14.x0 into r406;\n    add r405 r406 into r407;\n    mul -3i64 r15.x0 into r408;\n    add r407 r408 into r409;\n    add r409 369i64 into r410;\n    call relu r410 into r411;\n    mul -4i64 r0.x0 into r412;\n    mul 6i64 r0.x1 into r413;\n    add r412 r413 into r414;\n    mul -6i64 r1.x0 into r415;\n    add r414 r415 into r416;\n    mul 3i64 r1.x1 into r417;\n    add r416 r417 into r418;\n    mul 6i64 r2.x0 into r419;\n    add r418 r419 into r420;\n    mul -22i64 r2.x1 into r421;\n    add r420 r421 into r422;\n    mul 9i64 r3.x0 into r423;\n    add r422 r423 into r424;\n    mul 10i64 r3.x1 into r425;\n    add r424 r425 into r426;\n    mul 3i64 r4.x0 into r427;\n    add r426 r427 into r428;\n    mul 5i64 r6.x0 into r429;\n    add r428 r429 into r430;\n    mul 10i64 r7.x0 into r431;\n    add r430 r431 into r432;\n    mul 7i64 r8.x0 into r433;\n    add r432 r433 into r434;\n    mul 3i64 r9.x0 into r435;\n    add r434 r435 into r436;\n    mul 4i64 r10.x0 into r437;\n    add r436 r437 into r438;\n    mul 4i64 r11.x0 into r439;\n    add r438 r439 into r440;\n    mul -4i64 r14.x0 into r441;\n    add r440 r441 into r442;\n    mul -16i64 r15.x0 into r443;\n    add r442 r443 into r444;\n    add r444 51i64 into r445;\n    call relu r445 into r446;\n    mul 22i64 r42 into r447;\n    mul -11i64 r71 into r448;\n    add r447 r448 into r449;\n    mul -10i64 r98 into r450;\n    add r449 r450 into r451;\n    mul -8i64 r127 into r452;\n    add r451 r452 into r453;\n    mul 14i64 r162 into r454;\n    add r453 r454 into r455;\n    mul 15i64 r191 into r456;\n    add r455 r456 into r457;\n    mul -11i64 r220 into r458;\n    add r457 r458 into r459;\n    mul -10i64 r247 into r460;\n    add r459 r460 into r461;\n    mul 13i64 r272 into r462;\n    add r461 r462 into r463;\n    mul 2i64 r301 into r464;\n    add r463 r464 into r465;\n    mul -20i64 r332 into r466;\n    add r465 r466 into r467;\n    mul 15i64 r353 into r468;\n    add r467 r468 into r469;\n    mul -20i64 r382 into r470;\n    add r469 r470 into r471;\n    mul -16i64 r446 into r472;\n    add r471 r472 into r473;\n    add r473 -576i64 into r474;\n    mul 6i64 r42 into r475;\n    mul 22i64 r71 into r476;\n    add r475 r476 into r477;\n    mul 24i64 r98 into r478;\n    add r477 r478 into r479;\n    mul -2i64 r127 into r480;\n    add r479 r480 into r481;\n    mul 7i64 r162 into r482;\n    add r481 r482 into r483;\n    mul -9i64 r191 into r484;\n    add r483 r484 into r485;\n    mul -11i64 r220 into r486;\n    add r485 r486 into r487;\n    mul -7i64 r247 into r488;\n    add r487 r488 into r489;\n    mul -17i64 r272 into r490;\n    add r489 r490 into r491;\n    mul 4i64 r301 into r492;\n    add r491 r492 into r493;\n    mul 16i64 r332 into r494;\n    add r493 r494 into r495;\n    mul -29i64 r353 into r496;\n    add r495 r496 into r497;\n    mul -8i64 r382 into r498;\n    add r497 r498 into r499;\n    mul 14i64 r446 into r500;\n    add r499 r500 into r501;\n    add r501 -1969i64 into r502;\n    mul 5i64 r71 into r503;\n    mul 15i64 r191 into r504;\n    add r503 r504 into r505;\n    mul -10i64 r220 into r506;\n    add r505 r506 into r507;\n    mul 21i64 r247 into r508;\n    add r507 r508 into r509;\n    mul -9i64 r272 into r510;\n    add r509 r510 into r511;\n    mul 15i64 r301 into r512;\n    add r511 r512 into r513;\n    mul -19i64 r332 into r514;\n    add r513 r514 into r515;\n    mul -11i64 r353 into r516;\n    add r515 r516 into r517;\n    mul 7i64 r382 into r518;\n    add r517 r518 into r519;\n    mul -7i64 r411 into r520;\n    add r519 r520 into r521;\n    mul -5i64 r446 into r522;\n    add r521 r522 into r523;\n    add r523 -8450i64 into r524;\n    mul -13i64 r42 into r525;\n    mul -6i64 r71 into r526;\n    add r525 r526 into r527;\n    mul 6i64 r98 into r528;\n    add r527 r528 into r529;\n    mul -6i64 r127 into r530;\n    add r529 r530 into r531;\n    mul -17i64 r162 into r532;\n    add r531 r532 into r533;\n    mul 18i64 r220 into r534;\n    add r533 r534 into r535;\n    mul 12i64 r247 into r536;\n    add r535 r536 into r537;\n    mul -21i64 r272 into r538;\n    add r537 r538 into r539;\n    mul 3i64 r301 into r540;\n    add r539 r540 into r541;\n    mul 11i64 r332 into r542;\n    add r541 r542 into r543;\n    mul -2i64 r353 into r544;\n    add r543 r544 into r545;\n    mul 2i64 r382 into r546;\n    add r545 r546 into r547;\n    mul -4i64 r411 into r548;\n    add r547 r548 into r549;\n    mul -5i64 r446 into r550;\n    add r549 r550 into r551;\n    add r551 5534i64 into r552;\n    mul 6i64 r71 into r553;\n    mul -8i64 r98 into r554;\n    add r553 r554 into r555;\n    mul 11i64 r127 into r556;\n    add r555 r556 into r557;\n    mul -14i64 r162 into r558;\n    add r557 r558 into r559;\n    mul 15i64 r191 into r560;\n    add r559 r560 into r561;\n    mul -10i64 r247 into r562;\n    add r561 r562 into r563;\n    mul -2i64 r272 into r564;\n    add r563 r564 into r565;\n    mul -12i64 r301 into r566;\n    add r565 r566 into r567;\n    mul 10i64 r353 into r568;\n    add r567 r568 into r569;\n    mul -30i64 r411 into r570;\n    add r569 r570 into r571;\n    mul 18i64 r446 into r572;\n    add r571 r572 into r573;\n    add r573 1486i64 into r574;\n    mul -3i64 r42 into r575;\n    mul -25i64 r71 into r576;\n    add r575 r576 into r577;\n    mul 14i64 r98 into r578;\n    add r577 r578 into r579;\n    mul -10i64 r127 into r580;\n    add r579 r580 into r581;\n    mul -16i64 r162 into r582;\n    add r581 r582 into r583;\n    mul 4i64 r191 into r584;\n    add r583 r584 into r585;\n    mul 7i64 r220 into r586;\n    add r585 r586 into r587;\n    mul -9i64 r247 into r588;\n    add r587 r588 into r589;\n    mul 9i64 r272 into r590;\n    add r589 r590 into r591;\n    mul -38i64 r301 into r592;\n    add r591 r592 into r593;\n    mul 21i64 r353 into r594;\n    add r593 r594 into r595;\n    mul 8i64 r382 into r596;\n    add r595 r596 into r597;\n    mul 21i64 r411 into r598;\n    add r597 r598 into r599;\n    mul -8i64 r446 into r600;\n    add r599 r600 into r601;\n    mul 11i64 r42 into r602;\n    mul -2i64 r71 into r603;\n    add r602 r603 into r604;\n    mul -11i64 r98 into r605;\n    add r604 r605 into r606;\n    mul -12i64 r127 into r607;\n    add r606 r607 into r608;\n    mul 15i64 r162 into r609;\n    add r608 r609 into r610;\n    mul 19i64 r191 into r611;\n    add r610 r611 into r612;\n    mul 5i64 r220 into r613;\n    add r612 r613 into r614;\n    mul -28i64 r247 into r615;\n    add r614 r615 into r616;\n    mul 8i64 r272 into r617;\n    add r616 r617 into r618;\n    mul -29i64 r301 into r619;\n    add r618 r619 into r620;\n    mul -6i64 r332 into r621;\n    add r620 r621 into r622;\n    mul -13i64 r353 into r623;\n    add r622 r623 into r624;\n    mul 11i64 r382 into r625;\n    add r624 r625 into r626;\n    mul 13i64 r411 into r627;\n    add r626 r627 into r628;\n    mul -13i64 r446 into r629;\n    add r628 r629 into r630;\n    add r630 -1053i64 into r631;\n    mul 3i64 r71 into r632;\n    mul 4i64 r98 into r633;\n    add r632 r633 into r634;\n    mul 6i64 r127 into r635;\n    add r634 r635 into r636;\n    mul -11i64 r162 into r637;\n    add r636 r637 into r638;\n    mul -29i64 r191 into r639;\n    add r638 r639 into r640;\n    mul -16i64 r220 into r641;\n    add r640 r641 into r642;\n    mul 16i64 r247 into r643;\n    add r642 r643 into r644;\n    mul 8i64 r272 into r645;\n    add r644 r645 into r646;\n    mul 11i64 r301 into r647;\n    add r646 r647 into r648;\n    mul -3i64 r332 into r649;\n    add r648 r649 into r650;\n    mul -28i64 r382 into r651;\n    add r650 r651 into r652;\n    mul 2i64 r411 into r653;\n    add r652 r653 into r654;\n    mul 2i64 r446 into r655;\n    add r654 r655 into r656;\n    mul -24i64 r98 into r657;\n    mul -26i64 r127 into r658;\n    add r657 r658 into r659;\n    mul 9i64 r162 into r660;\n    add r659 r660 into r661;\n    mul -18i64 r191 into r662;\n    add r661 r662 into r663;\n    mul 16i64 r220 into r664;\n    add r663 r664 into r665;\n    mul 15i64 r247 into r666;\n    add r665 r666 into r667;\n    mul -6i64 r301 into r668;\n    add r667 r668 into r669;\n    mul 5i64 r353 into r670;\n    add r669 r670 into r671;\n    mul 21i64 r382 into r672;\n    add r671 r672 into r673;\n    mul -4i64 r446 into r674;\n    add r673 r674 into r675;\n    add r675 6494i64 into r676;\n    mul -26i64 r42 into r677;\n    mul 11i64 r71 into r678;\n    add r677 r678 into r679;\n    mul -8i64 r98 into r680;\n    add r679 r680 into r681;\n    mul 16i64 r127 into r682;\n    add r681 r682 into r683;\n    mul -27i64 r162 into r684;\n    add r683 r684 into r685;\n    mul -4i64 r191 into r686;\n    add r685 r686 into r687;\n    mul -7i64 r247 into r688;\n    add r687 r688 into r689;\n    mul 11i64 r272 into r690;\n    add r689 r690 into r691;\n    mul 2i64 r301 into r692;\n    add r691 r692 into r693;\n    mul 9i64 r332 into r694;\n    add r693 r694 into r695;\n    mul 18i64 r353 into r696;\n    add r695 r696 into r697;\n    mul -3i64 r382 into r698;\n    add r697 r698 into r699;\n    mul -12i64 r411 into r700;\n    add r699 r700 into r701;\n    mul -13i64 r446 into r702;\n    add r701 r702 into r703;\n    output r474 as i64.private;\n    output r502 as i64.private;\n    output r524 as i64.private;\n    output r552 as i64.private;\n    output r574 as i64.private;\n    output r601 as i64.private;\n    output r631 as i64.private;\n    output r656 as i64.private;\n    output r676 as i64.private;\n    output r703 as i64.private;\n"
        const mlp_progarm = "program sklearn_mlp_mnist_1.aleo;\n\nstruct Struct0:\n    x0 as i64;\n    x1 as i64;\n\nstruct Struct1:\n    x0 as i64;\n\n\nclosure relu:\n    input r0 as i64;\n    lt r0 0i64 into r1;\n    ternary r1 0i64 r0 into r2;\n    output r2 as i64;\n\n\nfunction main:\n    input r0 as Struct0.private;\n    input r1 as Struct0.private;\n    input r2 as Struct0.private;\n    input r3 as Struct0.private;\n    input r4 as Struct1.private;\n    input r5 as Struct1.private;\n    input r6 as Struct1.private;\n    input r7 as Struct1.private;\n    input r8 as Struct1.private;\n    input r9 as Struct1.private;\n    input r10 as Struct1.private;\n    input r11 as Struct1.private;\n    input r12 as Struct1.private;\n    input r13 as Struct1.private;\n    input r14 as Struct1.private;\n    input r15 as Struct1.private;\n    mul -3i64 r0.x1 into r16;\n    mul -9i64 r1.x0 into r17;\n    add r16 r17 into r18;\n    mul 11i64 r1.x1 into r19;\n    add r18 r19 into r20;\n    mul -36i64 r2.x1 into r21;\n    add r20 r21 into r22;\n    mul 5i64 r3.x1 into r23;\n    add r22 r23 into r24;\n    mul -14i64 r5.x0 into r25;\n    add r24 r25 into r26;\n    mul 5i64 r8.x0 into r27;\n    add r26 r27 into r28;\n    mul -6i64 r9.x0 into r29;\n    add r28 r29 into r30;\n    mul -10i64 r14.x0 into r31;\n    add r30 r31 into r32;\n    mul -5i64 r15.x0 into r33;\n    add r32 r33 into r34;\n    add r34 -26i64 into r35;\n    call relu r35 into r36;\n    mul -6i64 r0.x1 into r37;\n    mul 9i64 r2.x0 into r38;\n    add r37 r38 into r39;\n    mul 4i64 r3.x0 into r40;\n    add r39 r40 into r41;\n    mul -5i64 r5.x0 into r42;\n    add r41 r42 into r43;\n    mul 7i64 r6.x0 into r44;\n    add r43 r44 into r45;\n    mul 21i64 r7.x0 into r46;\n    add r45 r46 into r47;\n    mul -2i64 r9.x0 into r48;\n    add r47 r48 into r49;\n    mul 5i64 r10.x0 into r50;\n    add r49 r50 into r51;\n    mul 9i64 r11.x0 into r52;\n    add r51 r52 into r53;\n    mul -11i64 r12.x0 into r54;\n    add r53 r54 into r55;\n    mul -5i64 r13.x0 into r56;\n    add r55 r56 into r57;\n    mul -18i64 r14.x0 into r58;\n    add r57 r58 into r59;\n    call relu r59 into r60;\n    mul 14i64 r0.x0 into r61;\n    mul 5i64 r2.x0 into r62;\n    add r61 r62 into r63;\n    mul 3i64 r9.x0 into r64;\n    add r63 r64 into r65;\n    mul -5i64 r13.x0 into r66;\n    add r65 r66 into r67;\n    mul -6i64 r14.x0 into r68;\n    add r67 r68 into r69;\n    mul -23i64 r15.x0 into r70;\n    add r69 r70 into r71;\n    add r71 419i64 into r72;\n    call relu r72 into r73;\n    mul 5i64 r0.x1 into r74;\n    mul 5i64 r2.x0 into r75;\n    add r74 r75 into r76;\n    mul 6i64 r3.x0 into r77;\n    add r76 r77 into r78;\n    mul 7i64 r4.x0 into r79;\n    add r78 r79 into r80;\n    mul 11i64 r6.x0 into r81;\n    add r80 r81 into r82;\n    mul 13i64 r8.x0 into r83;\n    add r82 r83 into r84;\n    mul 5i64 r9.x0 into r85;\n    add r84 r85 into r86;\n    mul 19i64 r10.x0 into r87;\n    add r86 r87 into r88;\n    mul 23i64 r12.x0 into r89;\n    add r88 r89 into r90;\n    mul -3i64 r14.x0 into r91;\n    add r90 r91 into r92;\n    add r92 103i64 into r93;\n    call relu r93 into r94;\n    mul -6i64 r0.x0 into r95;\n    mul 2i64 r1.x0 into r96;\n    add r95 r96 into r97;\n    mul -7i64 r2.x0 into r98;\n    add r97 r98 into r99;\n    mul 4i64 r2.x1 into r100;\n    add r99 r100 into r101;\n    mul -16i64 r3.x0 into r102;\n    add r101 r102 into r103;\n    mul 2i64 r3.x1 into r104;\n    add r103 r104 into r105;\n    mul -3i64 r4.x0 into r106;\n    add r105 r106 into r107;\n    mul 10i64 r5.x0 into r108;\n    add r107 r108 into r109;\n    mul -7i64 r8.x0 into r110;\n    add r109 r110 into r111;\n    mul 18i64 r9.x0 into r112;\n    add r111 r112 into r113;\n    mul -11i64 r10.x0 into r114;\n    add r113 r114 into r115;\n    mul 9i64 r11.x0 into r116;\n    add r115 r116 into r117;\n    mul 9i64 r12.x0 into r118;\n    add r117 r118 into r119;\n    mul 3i64 r13.x0 into r120;\n    add r119 r120 into r121;\n    mul -10i64 r14.x0 into r122;\n    add r121 r122 into r123;\n    mul 4i64 r15.x0 into r124;\n    add r123 r124 into r125;\n    add r125 165i64 into r126;\n    call relu r126 into r127;\n    mul -4i64 r0.x0 into r128;\n    mul 4i64 r0.x1 into r129;\n    add r128 r129 into r130;\n    mul 6i64 r1.x1 into r131;\n    add r130 r131 into r132;\n    mul -6i64 r2.x0 into r133;\n    add r132 r133 into r134;\n    mul -9i64 r3.x0 into r135;\n    add r134 r135 into r136;\n    mul -16i64 r4.x0 into r137;\n    add r136 r137 into r138;\n    mul 5i64 r5.x0 into r139;\n    add r138 r139 into r140;\n    mul 7i64 r7.x0 into r141;\n    add r140 r141 into r142;\n    mul -14i64 r8.x0 into r143;\n    add r142 r143 into r144;\n    mul 4i64 r9.x0 into r145;\n    add r144 r145 into r146;\n    mul 5i64 r10.x0 into r147;\n    add r146 r147 into r148;\n    mul 10i64 r11.x0 into r149;\n    add r148 r149 into r150;\n    mul -20i64 r12.x0 into r151;\n    add r150 r151 into r152;\n    mul 16i64 r13.x0 into r153;\n    add r152 r153 into r154;\n    mul 5i64 r14.x0 into r155;\n    add r154 r155 into r156;\n    mul -5i64 r15.x0 into r157;\n    add r156 r157 into r158;\n    add r158 149i64 into r159;\n    call relu r159 into r160;\n    mul -7i64 r0.x0 into r161;\n    mul -6i64 r0.x1 into r162;\n    add r161 r162 into r163;\n    mul -4i64 r2.x0 into r164;\n    add r163 r164 into r165;\n    mul -26i64 r3.x0 into r166;\n    add r165 r166 into r167;\n    mul 4i64 r3.x1 into r168;\n    add r167 r168 into r169;\n    mul -5i64 r4.x0 into r170;\n    add r169 r170 into r171;\n    mul -17i64 r6.x0 into r172;\n    add r171 r172 into r173;\n    mul -2i64 r7.x0 into r174;\n    add r173 r174 into r175;\n    mul -9i64 r8.x0 into r176;\n    add r175 r176 into r177;\n    mul -17i64 r10.x0 into r178;\n    add r177 r178 into r179;\n    mul -13i64 r12.x0 into r180;\n    add r179 r180 into r181;\n    mul -2i64 r13.x0 into r182;\n    add r181 r182 into r183;\n    mul 7i64 r14.x0 into r184;\n    add r183 r184 into r185;\n    add r185 265i64 into r186;\n    call relu r186 into r187;\n    mul 26i64 r0.x0 into r188;\n    mul 13i64 r1.x0 into r189;\n    add r188 r189 into r190;\n    mul 6i64 r2.x1 into r191;\n    add r190 r191 into r192;\n    mul -11i64 r3.x1 into r193;\n    add r192 r193 into r194;\n    mul 6i64 r4.x0 into r195;\n    add r194 r195 into r196;\n    mul 6i64 r6.x0 into r197;\n    add r196 r197 into r198;\n    mul 3i64 r9.x0 into r199;\n    add r198 r199 into r200;\n    mul 3i64 r12.x0 into r201;\n    add r200 r201 into r202;\n    mul 8i64 r14.x0 into r203;\n    add r202 r203 into r204;\n    add r204 373i64 into r205;\n    call relu r205 into r206;\n    mul 15i64 r0.x0 into r207;\n    mul 7i64 r0.x1 into r208;\n    add r207 r208 into r209;\n    mul 20i64 r1.x0 into r210;\n    add r209 r210 into r211;\n    mul 7i64 r1.x1 into r212;\n    add r211 r212 into r213;\n    mul 12i64 r3.x0 into r214;\n    add r213 r214 into r215;\n    mul 7i64 r3.x1 into r216;\n    add r215 r216 into r217;\n    mul 2i64 r4.x0 into r218;\n    add r217 r218 into r219;\n    mul 18i64 r6.x0 into r220;\n    add r219 r220 into r221;\n    mul 8i64 r8.x0 into r222;\n    add r221 r222 into r223;\n    mul 4i64 r10.x0 into r224;\n    add r223 r224 into r225;\n    mul 4i64 r11.x0 into r226;\n    add r225 r226 into r227;\n    mul 7i64 r12.x0 into r228;\n    add r227 r228 into r229;\n    mul -3i64 r15.x0 into r230;\n    add r229 r230 into r231;\n    add r231 215i64 into r232;\n    call relu r232 into r233;\n    mul -11i64 r0.x0 into r234;\n    mul -12i64 r0.x1 into r235;\n    add r234 r235 into r236;\n    mul 17i64 r1.x0 into r237;\n    add r236 r237 into r238;\n    mul -16i64 r1.x1 into r239;\n    add r238 r239 into r240;\n    mul 6i64 r2.x0 into r241;\n    add r240 r241 into r242;\n    mul -39i64 r2.x1 into r243;\n    add r242 r243 into r244;\n    mul -8i64 r5.x0 into r245;\n    add r244 r245 into r246;\n    mul 18i64 r6.x0 into r247;\n    add r246 r247 into r248;\n    mul -8i64 r7.x0 into r249;\n    add r248 r249 into r250;\n    mul -5i64 r9.x0 into r251;\n    add r250 r251 into r252;\n    mul 2i64 r10.x0 into r253;\n    add r252 r253 into r254;\n    mul -8i64 r11.x0 into r255;\n    add r254 r255 into r256;\n    mul 9i64 r12.x0 into r257;\n    add r256 r257 into r258;\n    mul 4i64 r13.x0 into r259;\n    add r258 r259 into r260;\n    mul -5i64 r14.x0 into r261;\n    add r260 r261 into r262;\n    add r262 387i64 into r263;\n    call relu r263 into r264;\n    mul 8i64 r0.x0 into r265;\n    mul -4i64 r1.x1 into r266;\n    add r265 r266 into r267;\n    mul 2i64 r2.x0 into r268;\n    add r267 r268 into r269;\n    mul 3i64 r2.x1 into r270;\n    add r269 r270 into r271;\n    mul -8i64 r3.x1 into r272;\n    add r271 r272 into r273;\n    mul 20i64 r4.x0 into r274;\n    add r273 r274 into r275;\n    mul -3i64 r7.x0 into r276;\n    add r275 r276 into r277;\n    mul -24i64 r8.x0 into r278;\n    add r277 r278 into r279;\n    mul 8i64 r9.x0 into r280;\n    add r279 r280 into r281;\n    mul -10i64 r10.x0 into r282;\n    add r281 r282 into r283;\n    mul 7i64 r12.x0 into r284;\n    add r283 r284 into r285;\n    mul 2i64 r15.x0 into r286;\n    add r285 r286 into r287;\n    add r287 -91i64 into r288;\n    call relu r288 into r289;\n    mul 9i64 r1.x0 into r290;\n    mul 5i64 r1.x1 into r291;\n    add r290 r291 into r292;\n    mul 5i64 r2.x0 into r293;\n    add r292 r293 into r294;\n    mul 2i64 r2.x1 into r295;\n    add r294 r295 into r296;\n    mul 12i64 r3.x0 into r297;\n    add r296 r297 into r298;\n    mul 7i64 r6.x0 into r299;\n    add r298 r299 into r300;\n    mul 13i64 r8.x0 into r301;\n    add r300 r301 into r302;\n    mul -2i64 r9.x0 into r303;\n    add r302 r303 into r304;\n    mul 11i64 r10.x0 into r305;\n    add r304 r305 into r306;\n    mul -9i64 r13.x0 into r307;\n    add r306 r307 into r308;\n    mul -9i64 r14.x0 into r309;\n    add r308 r309 into r310;\n    mul 3i64 r15.x0 into r311;\n    add r310 r311 into r312;\n    add r312 514i64 into r313;\n    call relu r313 into r314;\n    mul -4i64 r0.x0 into r315;\n    mul 18i64 r2.x0 into r316;\n    add r315 r316 into r317;\n    mul -6i64 r2.x1 into r318;\n    add r317 r318 into r319;\n    mul 2i64 r3.x0 into r320;\n    add r319 r320 into r321;\n    mul -2i64 r3.x1 into r322;\n    add r321 r322 into r323;\n    mul -13i64 r4.x0 into r324;\n    add r323 r324 into r325;\n    mul -7i64 r5.x0 into r326;\n    add r325 r326 into r327;\n    mul -13i64 r6.x0 into r328;\n    add r327 r328 into r329;\n    mul 6i64 r7.x0 into r330;\n    add r329 r330 into r331;\n    mul -4i64 r8.x0 into r332;\n    add r331 r332 into r333;\n    mul -3i64 r9.x0 into r334;\n    add r333 r334 into r335;\n    mul 4i64 r10.x0 into r336;\n    add r335 r336 into r337;\n    mul -13i64 r13.x0 into r338;\n    add r337 r338 into r339;\n    mul 4i64 r15.x0 into r340;\n    add r339 r340 into r341;\n    add r341 248i64 into r342;\n    call relu r342 into r343;\n    mul -5i64 r0.x0 into r344;\n    mul -6i64 r0.x1 into r345;\n    add r344 r345 into r346;\n    mul 14i64 r1.x0 into r347;\n    add r346 r347 into r348;\n    mul 7i64 r2.x0 into r349;\n    add r348 r349 into r350;\n    mul -9i64 r2.x1 into r351;\n    add r350 r351 into r352;\n    mul 16i64 r3.x0 into r353;\n    add r352 r353 into r354;\n    mul 2i64 r3.x1 into r355;\n    add r354 r355 into r356;\n    mul 13i64 r5.x0 into r357;\n    add r356 r357 into r358;\n    mul 4i64 r6.x0 into r359;\n    add r358 r359 into r360;\n    mul -6i64 r7.x0 into r361;\n    add r360 r361 into r362;\n    mul -2i64 r8.x0 into r363;\n    add r362 r363 into r364;\n    mul 3i64 r9.x0 into r365;\n    add r364 r365 into r366;\n    mul -2i64 r10.x0 into r367;\n    add r366 r367 into r368;\n    mul 3i64 r11.x0 into r369;\n    add r368 r369 into r370;\n    mul -6i64 r12.x0 into r371;\n    add r370 r371 into r372;\n    mul 3i64 r14.x0 into r373;\n    add r372 r373 into r374;\n    mul -4i64 r15.x0 into r375;\n    add r374 r375 into r376;\n    add r376 39i64 into r377;\n    call relu r377 into r378;\n    mul -4i64 r0.x1 into r379;\n    mul -3i64 r1.x1 into r380;\n    add r379 r380 into r381;\n    mul 10i64 r2.x0 into r382;\n    add r381 r382 into r383;\n    mul -16i64 r2.x1 into r384;\n    add r383 r384 into r385;\n    mul 4i64 r4.x0 into r386;\n    add r385 r386 into r387;\n    mul 17i64 r6.x0 into r388;\n    add r387 r388 into r389;\n    mul 3i64 r8.x0 into r390;\n    add r389 r390 into r391;\n    mul 11i64 r12.x0 into r392;\n    add r391 r392 into r393;\n    mul 13i64 r13.x0 into r394;\n    add r393 r394 into r395;\n    mul -2i64 r15.x0 into r396;\n    add r395 r396 into r397;\n    add r397 461i64 into r398;\n    call relu r398 into r399;\n    mul -8i64 r36 into r400;\n    mul -16i64 r60 into r401;\n    add r400 r401 into r402;\n    mul -14i64 r73 into r403;\n    add r402 r403 into r404;\n    mul -4i64 r94 into r405;\n    add r404 r405 into r406;\n    mul 13i64 r127 into r407;\n    add r406 r407 into r408;\n    mul -19i64 r160 into r409;\n    add r408 r409 into r410;\n    mul 16i64 r187 into r411;\n    add r410 r411 into r412;\n    mul -6i64 r206 into r413;\n    add r412 r413 into r414;\n    mul 16i64 r233 into r415;\n    add r414 r415 into r416;\n    mul -3i64 r264 into r417;\n    add r416 r417 into r418;\n    mul -2i64 r289 into r419;\n    add r418 r419 into r420;\n    mul -15i64 r314 into r421;\n    add r420 r421 into r422;\n    mul -9i64 r343 into r423;\n    add r422 r423 into r424;\n    mul 13i64 r378 into r425;\n    add r424 r425 into r426;\n    mul 13i64 r399 into r427;\n    add r426 r427 into r428;\n    mul 9i64 r36 into r429;\n    mul 20i64 r60 into r430;\n    add r429 r430 into r431;\n    mul 34i64 r73 into r432;\n    add r431 r432 into r433;\n    mul 3i64 r94 into r434;\n    add r433 r434 into r435;\n    mul 4i64 r127 into r436;\n    add r435 r436 into r437;\n    mul 12i64 r160 into r438;\n    add r437 r438 into r439;\n    mul -22i64 r187 into r440;\n    add r439 r440 into r441;\n    mul -7i64 r206 into r442;\n    add r441 r442 into r443;\n    mul -31i64 r233 into r444;\n    add r443 r444 into r445;\n    mul 9i64 r264 into r446;\n    add r445 r446 into r447;\n    mul -9i64 r289 into r448;\n    add r447 r448 into r449;\n    mul -17i64 r314 into r450;\n    add r449 r450 into r451;\n    mul -20i64 r343 into r452;\n    add r451 r452 into r453;\n    mul 5i64 r378 into r454;\n    add r453 r454 into r455;\n    mul -21i64 r399 into r456;\n    add r455 r456 into r457;\n    add r457 2917i64 into r458;\n    mul -4i64 r36 into r459;\n    mul 6i64 r60 into r460;\n    add r459 r460 into r461;\n    mul -3i64 r73 into r462;\n    add r461 r462 into r463;\n    mul 5i64 r94 into r464;\n    add r463 r464 into r465;\n    mul 5i64 r127 into r466;\n    add r465 r466 into r467;\n    mul 19i64 r160 into r468;\n    add r467 r468 into r469;\n    mul 18i64 r206 into r470;\n    add r469 r470 into r471;\n    mul -9i64 r233 into r472;\n    add r471 r472 into r473;\n    mul 16i64 r264 into r474;\n    add r473 r474 into r475;\n    mul 2i64 r289 into r476;\n    add r475 r476 into r477;\n    mul -14i64 r314 into r478;\n    add r477 r478 into r479;\n    mul 13i64 r343 into r480;\n    add r479 r480 into r481;\n    mul -29i64 r399 into r482;\n    add r481 r482 into r483;\n    add r483 -1004i64 into r484;\n    mul -12i64 r36 into r485;\n    mul -8i64 r60 into r486;\n    add r485 r486 into r487;\n    mul 13i64 r73 into r488;\n    add r487 r488 into r489;\n    mul -13i64 r94 into r490;\n    add r489 r490 into r491;\n    mul -16i64 r127 into r492;\n    add r491 r492 into r493;\n    mul -3i64 r160 into r494;\n    add r493 r494 into r495;\n    mul 15i64 r206 into r496;\n    add r495 r496 into r497;\n    mul -21i64 r233 into r498;\n    add r497 r498 into r499;\n    mul 13i64 r264 into r500;\n    add r499 r500 into r501;\n    mul 14i64 r289 into r502;\n    add r501 r502 into r503;\n    mul 9i64 r314 into r504;\n    add r503 r504 into r505;\n    mul -19i64 r378 into r506;\n    add r505 r506 into r507;\n    mul -2i64 r399 into r508;\n    add r507 r508 into r509;\n    add r509 662i64 into r510;\n    mul 20i64 r36 into r511;\n    mul -4i64 r60 into r512;\n    add r511 r512 into r513;\n    mul 22i64 r94 into r514;\n    add r513 r514 into r515;\n    mul -10i64 r127 into r516;\n    add r515 r516 into r517;\n    mul 17i64 r187 into r518;\n    add r517 r518 into r519;\n    mul -17i64 r206 into r520;\n    add r519 r520 into r521;\n    mul -6i64 r233 into r522;\n    add r521 r522 into r523;\n    mul -15i64 r264 into r524;\n    add r523 r524 into r525;\n    mul -5i64 r289 into r526;\n    add r525 r526 into r527;\n    mul 3i64 r314 into r528;\n    add r527 r528 into r529;\n    mul -12i64 r343 into r530;\n    add r529 r530 into r531;\n    mul -5i64 r378 into r532;\n    add r531 r532 into r533;\n    add r533 545i64 into r534;\n    mul -9i64 r36 into r535;\n    mul -21i64 r60 into r536;\n    add r535 r536 into r537;\n    mul 13i64 r73 into r538;\n    add r537 r538 into r539;\n    mul -19i64 r94 into r540;\n    add r539 r540 into r541;\n    mul -15i64 r127 into r542;\n    add r541 r542 into r543;\n    mul 4i64 r187 into r544;\n    add r543 r544 into r545;\n    mul -9i64 r206 into r546;\n    add r545 r546 into r547;\n    mul -34i64 r264 into r548;\n    add r547 r548 into r549;\n    mul 13i64 r289 into r550;\n    add r549 r550 into r551;\n    mul 4i64 r314 into r552;\n    add r551 r552 into r553;\n    mul 16i64 r343 into r554;\n    add r553 r554 into r555;\n    mul 6i64 r378 into r556;\n    add r555 r556 into r557;\n    mul 29i64 r399 into r558;\n    add r557 r558 into r559;\n    mul 7i64 r36 into r560;\n    mul 8i64 r60 into r561;\n    add r560 r561 into r562;\n    mul -7i64 r73 into r563;\n    add r562 r563 into r564;\n    mul -7i64 r94 into r565;\n    add r564 r565 into r566;\n    mul 15i64 r127 into r567;\n    add r566 r567 into r568;\n    mul 22i64 r187 into r569;\n    add r568 r569 into r570;\n    mul -27i64 r206 into r571;\n    add r570 r571 into r572;\n    mul 3i64 r233 into r573;\n    add r572 r573 into r574;\n    mul -28i64 r264 into r575;\n    add r574 r575 into r576;\n    mul -10i64 r289 into r577;\n    add r576 r577 into r578;\n    mul -10i64 r314 into r579;\n    add r578 r579 into r580;\n    mul 15i64 r343 into r581;\n    add r580 r581 into r582;\n    mul -5i64 r378 into r583;\n    add r582 r583 into r584;\n    mul 10i64 r60 into r585;\n    mul 9i64 r73 into r586;\n    add r585 r586 into r587;\n    mul 11i64 r94 into r588;\n    add r587 r588 into r589;\n    mul -14i64 r127 into r590;\n    add r589 r590 into r591;\n    mul -21i64 r160 into r592;\n    add r591 r592 into r593;\n    mul -24i64 r187 into r594;\n    add r593 r594 into r595;\n    mul 14i64 r206 into r596;\n    add r595 r596 into r597;\n    mul 13i64 r233 into r598;\n    add r597 r598 into r599;\n    mul 5i64 r264 into r600;\n    add r599 r600 into r601;\n    mul -17i64 r289 into r602;\n    add r601 r602 into r603;\n    mul -25i64 r314 into r604;\n    add r603 r604 into r605;\n    mul 11i64 r378 into r606;\n    add r605 r606 into r607;\n    mul 6i64 r399 into r608;\n    add r607 r608 into r609;\n    add r609 -1409i64 into r610;\n    mul -4i64 r36 into r611;\n    mul -26i64 r73 into r612;\n    add r611 r612 into r613;\n    mul -23i64 r94 into r614;\n    add r613 r614 into r615;\n    mul 11i64 r127 into r616;\n    add r615 r616 into r617;\n    mul 12i64 r160 into r618;\n    add r617 r618 into r619;\n    mul -18i64 r187 into r620;\n    add r619 r620 into r621;\n    mul 14i64 r206 into r622;\n    add r621 r622 into r623;\n    mul -6i64 r233 into r624;\n    add r623 r624 into r625;\n    mul 17i64 r314 into r626;\n    add r625 r626 into r627;\n    mul 8i64 r343 into r628;\n    add r627 r628 into r629;\n    mul -13i64 r378 into r630;\n    add r629 r630 into r631;\n    mul 6i64 r399 into r632;\n    add r631 r632 into r633;\n    add r633 5540i64 into r634;\n    mul -7i64 r36 into r635;\n    mul 5i64 r60 into r636;\n    add r635 r636 into r637;\n    mul -11i64 r73 into r638;\n    add r637 r638 into r639;\n    mul 5i64 r94 into r640;\n    add r639 r640 into r641;\n    mul -16i64 r127 into r642;\n    add r641 r642 into r643;\n    mul -14i64 r160 into r644;\n    add r643 r644 into r645;\n    mul 10i64 r233 into r646;\n    add r645 r646 into r647;\n    mul 13i64 r264 into r648;\n    add r647 r648 into r649;\n    mul 14i64 r289 into r650;\n    add r649 r650 into r651;\n    mul 16i64 r314 into r652;\n    add r651 r652 into r653;\n    mul -10i64 r343 into r654;\n    add r653 r654 into r655;\n    mul -11i64 r378 into r656;\n    add r655 r656 into r657;\n    add r657 -6917i64 into r658;\n    output r428 as i64.private;\n    output r458 as i64.private;\n    output r484 as i64.private;\n    output r510 as i64.private;\n    output r534 as i64.private;\n    output r559 as i64.private;\n    output r584 as i64.private;\n    output r610 as i64.private;\n    output r634 as i64.private;\n    output r658 as i64.private;\n"

        const input_array = [`{x0: ${fixed_point_features[0]}${int_type}, x1: ${fixed_point_features[1]}${int_type}}`, `{x0: ${fixed_point_features[2]}${int_type}, x1: ${fixed_point_features[3]}${int_type}}`, `{x0: ${fixed_point_features[4]}${int_type}, x1: ${fixed_point_features[5]}${int_type}}`, `{x0: ${fixed_point_features[6]}${int_type}, x1: ${fixed_point_features[7]}${int_type}}`, `{x0: ${fixed_point_features[8]}${int_type}}`, `{x0: ${fixed_point_features[9]}${int_type}}`, `{x0: ${fixed_point_features[10]}${int_type}}`, `{x0: ${fixed_point_features[11]}${int_type}}`, `{x0: ${fixed_point_features[12]}${int_type}}`, `{x0: ${fixed_point_features[13]}${int_type}}`, `{x0: ${fixed_point_features[14]}${int_type}}`, `{x0: ${fixed_point_features[15]}${int_type}}`, `{x0: ${fixed_point_features[16]}${int_type}}`, `{x0: ${fixed_point_features[17]}${int_type}}`, `{x0: ${fixed_point_features[18]}${int_type}}`, `{x0: ${fixed_point_features[19]}${int_type}}`];

        console.log("input_array", input_array);

        const result = await aleoWorker.localProgramExecution(
            mlp_progarm,
          "main",
          //["5u32", "5u32"],
          //["5i64", "5i64"],
          //["{x0: -6i64, x1:5i64}"],
          //["{struct0_0: {x0: ${fixed_point_features[0]}, x1: {x0: ${fixed_point_features[1]}}, struct0_1: ..., ..., struct0_3: ..., struct0_4: {x0: ${fixed_point_features[8]}}, ..., struct0_15: ...}"],
          input_array,
          );
    
            console.log("result", result);

            const output_fixed_point_scaling_factor = fixed_point_scaling_factor**3;

            // empty array
            var converted_features = [];

            // iterate over result. For each entry, remove "i64", convert to a number, and divide by the scaling factor
            for (let i = 0; i < result.length; i++) {
                var output = result[i].replace("i64", "");
                output = Number(output);
                output = output / output_fixed_point_scaling_factor;
                converted_features.push(output);
            }

            console.log("converted_features", converted_features);

            const argmax_index = converted_features.indexOf(Math.max(...converted_features));

            console.log("argmax_index", argmax_index);
            
        alert(JSON.stringify(converted_features));


      }

      const getTopLeftPixelData = async () => {
        try {
          const dataUrl = await canvasRef.current.exportImage("png");
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0, img.width, img.height);
            const imageData = tempCtx.getImageData(0, 0, 1, 1);
            console.log("Top left pixel data:", imageData.data);
          };
        } catch (error) {
          console.error("Failed to get top left pixel data:", error);
        }
      };
      
      
      
    

    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [isProgressRunning, setIsProgressRunning] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [chartData, setChartData] = useState(
        Array.from({ length: 10 }, (_, i) => ({ label: String(i), value: 0 })),
    );
    const [brushSize, setBrushSize] = useState(10);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const menuItems = ["Even/Odd", "Number Range", "Classification"].map(
        (label, index) => ({
            key: String(index + 1),
            icon: [<NumberOutlined />, <SlidersOutlined />, <TagsOutlined />][
                index
            ],
            label: label,
        }),
    );

    const randomizeChartData = () => {
        setChartData(
            chartData.map((item) => ({
                ...item,
                value: Math.floor(Math.random() * 20),
            })),
        );
    };

    const processImage = async (image) => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(image, 0, 0, 28, 28);
        const imageData = ctx.getImageData(0, 0, 28, 28);
        const data = imageData.data;
    
        // Create a 2D array to store the single-channel grayscale values
        const grayscaleData = Array.from({ length: 28 }, () => new Uint8ClampedArray(28));
    
        for (let i = 0; i < data.length; i += 4) {
            // Calculate the grayscale value
            const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            // Invert the grayscale value
            const invertedGrayscale = 255 - grayscale;
            // Calculate the current row and column
            const row = Math.floor(i / 4 / 28);
            const col = (i / 4) % 28;
            // Assign the inverted grayscale value to the 2D array
            grayscaleData[row][col] = invertedGrayscale;
        }
    
        return grayscaleData;
    };
    

    function getBoundingBox(img) {
        const height = img.length;
        const width = img[0].length;
      
        let rmin = height;
        let rmax = 0;
        let cmin = width;
        let cmax = 0;
      
        for (let row = 0; row < height; row++) {
          for (let col = 0; col < width; col++) {
            if (img[row][col] !== 0) { // Non-zero pixel
              if (row < rmin) rmin = row;
              if (row > rmax) rmax = row;
              if (col < cmin) cmin = col;
              if (col > cmax) cmax = col;
            }
          }
        }
      
        // If no non-zero pixels were found, return an empty array
        if (rmax < rmin || cmax < cmin) {
          return [];
        }
      
        // Extract the bounding box
        const cropped = img.slice(rmin, rmax + 1).map(row => row.slice(cmin, cmax + 1));
      
        return cropped;
      }

      const resizeImage = (image, newSize) => {
        const height = image.length;
        const width = image[0].length;
        const resizedImage = Array.from({ length: newSize }, () => new Uint8ClampedArray(newSize));
      
        const xScale = width / newSize;
        const yScale = height / newSize;
      
        for (let i = 0; i < newSize; i++) {
          for (let j = 0; j < newSize; j++) {
            const xStart = Math.floor(j * xScale);
            const yStart = Math.floor(i * yScale);
            const xEnd = Math.floor((j + 1) * xScale);
            const yEnd = Math.floor((i + 1) * yScale);
      
            let sum = 0;
            let count = 0;
      
            for (let y = yStart; y < yEnd; y++) {
              for (let x = xStart; x < xEnd; x++) {
                if (y >= 0 && y < height && x >= 0 && x < width) {
                  sum += image[y][x];
                  count++;
                }
              }
            }
      
            resizedImage[i][j] = count > 0 ? Math.max(0, Math.round(sum / count)) : 0;
          }
        }
      
        return resizedImage;
      };
            

    function computeIntegralImage(image) {
        const height = image.length;
        const width = image[0].length;
        const integralImage = Array.from({length: height}, () => new Array(width).fill(0));
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            integralImage[y][x] =
              image[y][x] +
              (integralImage[y][x - 1] || 0) +
              (integralImage[y - 1] ? integralImage[y - 1][x] : 0) -
              (integralImage[y - 1] ? integralImage[y - 1][x - 1] || 0 : 0);
          }
        }
        
        return integralImage;
      }

      function sumRegion(integralImage, top_left, bottom_right) {
        const [tl_y, tl_x] = top_left;
        const [br_y, br_x] = bottom_right;
      
        let total = integralImage[br_y][br_x];
        if (tl_y > 0) total -= integralImage[tl_y - 1][br_x];
        if (tl_x > 0) total -= integralImage[br_y][tl_x - 1];
        if (tl_y > 0 && tl_x > 0) total += integralImage[tl_y - 1][tl_x - 1];
      
        return total;
      }

      function computeHaarFeatures(image) {
        const size = image.length;
        if (size !== image[0].length) {
          throw new Error("The input image must be square.");
        }
      
        const integralImage = computeIntegralImage(image);
        const features = [];
      
        for (let i = 0; i < size; i += 3) {
          for (let j = 0; j < size; j += 3) {
            if (i + 6 > size || j + 6 > size) continue;
      
            // Horizontal feature
            const horizontal_feature_value =
              sumRegion(integralImage, [i, j], [i + 2, j + 5]) -
              sumRegion(integralImage, [i + 3, j], [i + 5, j + 5]);
      
            // Vertical feature
            const vertical_feature_value =
              sumRegion(integralImage, [i, j], [i + 5, j + 2]) -
              sumRegion(integralImage, [i, j + 3], [i + 5, j + 5]);
      
            features.push(horizontal_feature_value);
            features.push(vertical_feature_value);
          }
        }
      
        return features;
      }

      function aspectRatio(image, threshold = 0.5) {
        const binImage = image.map(row => row.map(pixel => pixel > threshold ? 1 : 0));
        const rows = binImage.length;
        const cols = binImage[0].length;
        
        let minRow = rows, maxRow = 0, minCol = cols, maxCol = 0;
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (binImage[y][x] === 1) {
              minRow = Math.min(minRow, y);
              maxRow = Math.max(maxRow, y);
              minCol = Math.min(minCol, x);
              maxCol = Math.max(maxCol, x);
            }
          }
        }
        
        const width = maxCol - minCol + 1;
        const height = maxRow - minRow + 1;
      
        if (height === 0) return 1.0;
        return width / height;
      }

      function labelRegions(binImage) {
        const rows = binImage.length;
        const cols = binImage[0].length;
        const labels = Array.from({length: rows}, () => new Array(cols).fill(0));
        let label = 0;
      
        function dfs(y, x) {
          if (y < 0 || y >= rows || x < 0 || x >= cols || binImage[y][x] === 0 || labels[y][x] > 0) {
            return;
          }
          
          labels[y][x] = label;
          
          dfs(y - 1, x);
          dfs(y + 1, x);
          dfs(y, x - 1);
          dfs(y, x + 1);
        }
      
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (binImage[y][x] === 1 && labels[y][x] === 0) {
              label += 1;
              dfs(y, x);
            }
          }
        }
      
        return { labels, numRegions: label };
      }
      
      function numRegionsBelowThreshold(image, threshold = 0.5) {
        const binImage = image.map(row => row.map(pixel => pixel < threshold ? 1 : 0));
        const { numRegions } = labelRegions(binImage);
        return numRegions;
      }
      
    
      
    
    

    const processImageAndPredict = async () => {
        if (!canvasRef.current) {
            return;
        }
        const imageURI = await canvasRef.current.exportImage("image/png");
        const image = new Image();
        image.src = imageURI;
        image.onload = async () => {
            console.log("image shape:", image.width, image.height)
            var imageData = await processImage(image);

            // test cases
            //imageData = [[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 84.0, 185.0, 159.0, 151.0, 60.0, 36.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 222.0, 254.0, 254.0, 254.0, 254.0, 241.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 198.0, 170.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 67.0, 114.0, 72.0, 114.0, 163.0, 227.0, 254.0, 225.0, 254.0, 254.0, 254.0, 250.0, 229.0, 254.0, 254.0, 140.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 17.0, 66.0, 14.0, 67.0, 67.0, 67.0, 59.0, 21.0, 236.0, 254.0, 106.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 83.0, 253.0, 209.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 22.0, 233.0, 255.0, 83.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 129.0, 254.0, 238.0, 44.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 59.0, 249.0, 254.0, 62.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 133.0, 254.0, 187.0, 5.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 9.0, 205.0, 248.0, 58.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 126.0, 254.0, 182.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 75.0, 251.0, 240.0, 57.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 19.0, 221.0, 254.0, 166.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.0, 203.0, 254.0, 219.0, 35.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 38.0, 254.0, 254.0, 77.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 31.0, 224.0, 254.0, 115.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 133.0, 254.0, 254.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 61.0, 242.0, 254.0, 254.0, 52.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 121.0, 254.0, 254.0, 219.0, 40.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 121.0, 254.0, 207.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]];

            console.log("imageData shape after processing:", imageData.length, imageData[0].length, "type:", typeof(imageData[0][0]))
            const firstPixel = imageData[0];
            console.log("First pixel value:", firstPixel);
            const cropped = getBoundingBox(imageData);
            console.log("Cropped image shape:", cropped.length, cropped[0].length);
            console.log("Cropped image:", cropped)
            const resized = resizeImage(cropped, 12);
            console.log("Resized image shape:", resized.length, resized[0].length);
            console.log("Resized image:", resized)
            
            const haarFeatures = computeHaarFeatures(resized);
            console.log("Haar features shape:", haarFeatures.length);

            const aspectRatioValue = aspectRatio(imageData);
            console.log("Aspect ratio:", aspectRatioValue);

            const numRegions = numRegionsBelowThreshold(imageData);
            console.log("Number of regions:", numRegions);

            var features = haarFeatures.concat([aspectRatioValue, numRegions]);

            // test cases
            //features = [1749.0, -11.0, 1218.0, -636.0, 790.0, -442.0, -232.0, -232.0, -841.0, -1555.0, 144.0, 1034.0, -1302.0, -1766.0, -221.0, 451.0, 1081.0, 1315.0, 0.8, 1.0, ];

            console.log("Features:", features);
            
            await executeAleoCode(features);
          };
    };

    const executeAleoCode = async (features) => {
        console.log("hello")
        generateAccount()
        console.log("generated account")
        execute(features)
        console.log("finished")
    };

    const startProgressAndRandomizeData = () => {
        if (isProgressRunning || !hasMounted) {
            return;
        }
        setIsProgressRunning(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                const newProgress = oldProgress + 10;
                if (newProgress === 100) {
                    clearInterval(interval);
                    randomizeChartData();
                    setIsProgressRunning(false);
                    processImageAndPredict();
                    return newProgress;
                }
                return Math.min(newProgress, 100);
            });
        }, 200);
    };

    const handleCanvasDraw = async () => {
        try {
            startProgressAndRandomizeData();
        } catch (error) {
            console.error("Failed to execute Aleo code:", error);
            // Handle the error accordingly. For example, show an error message to the user.
        }
    };
    

    const handleBrushSizeChange = (value) => {
        setBrushSize(value);
    };

    return (
        <Layout style={{ minHeight: "100vh", maxWidth: "100vw" }}>
            <Sider theme="light" breakpoint="lg" collapsedWidth="0">
                <div
                    style={{
                        height: "32px",
                        margin: "16px",
                        fontWeight: "bold",
                    }}
                >
                    <img
                        src={aleoLogo}
                        alt="Aleo Logo"
                        style={{ height: "100%" }}
                    />
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={["1"]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header
                    style={{ backgroundColor: "#fff", textAlign: "center" }}
                >
                    <h1 style={{ margin: 0 }}>React ZKML App</h1>
                </Header>
                <Content style={{ margin: "24px 16px 0" }}>
                    <Row justify="center">
                        <Col span={24} style={{ textAlign: "center" }}>
                            <Title level={2}>
                                Welcome to the Aleo zkml MNIST app
                            </Title>
                            <Paragraph>
                                First, draw an image and create proof … Second,
                                verify the proof …
                            </Paragraph>
                        </Col>
                    </Row>
                    <Card title="Prover" style={{ width: "100%" }}>
                        <Row justify="center">
                            <Col>
                                <Text type="secondary">
                                    Draw a single digit (0-9) in the empty box,
                                    and store the proof locally.
                                </Text>
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col>
                                <ReactSketchCanvas
                                    ref={canvasRef}
                                    width="400px"
                                    height="400px"
                                    style={{
                                        border: "2px solid black",
                                        backgroundColor: "white",
                                    }}
                                    strokeWidth={brushSize}
                                    strokeColor="black"
                                />
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col span={12}>
                                <div
                                    style={{
                                        marginBottom: "10px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    Brush Size
                                </div>
                                <Slider
                                    min={1}
                                    max={20}
                                    value={brushSize}
                                    onChange={handleBrushSizeChange}
                                    style={{
                                        width: "100%",
                                        marginBottom: "20px",
                                    }}
                                    marks={{ 1: "1", 20: "20" }}
                                />
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col>
                                <Space>
                                <Button type="primary" onClick={handleCanvasDraw}>
    Store Proof
</Button>
                                    <Button
                                        type="default"
                                        onClick={() => {
                                            getTopLeftPixelData(); // Get pixel data before clearing
                                            canvasRef.current.clearCanvas();
                                          }}
                                    >
                                        Clear
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col span={12}>
                                <Progress percent={progress} />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={22} md={20} lg={18} xl={12}>
                                <Column
                                    data={chartData}
                                    xField="label"
                                    yField="value"
                                    seriesField="label"
                                    legend={false}
                                />
                            </Col>
                        </Row>
                    </Card>
                    <Card
                        title="Verifier"
                        style={{ width: "100%", marginTop: "24px" }}
                    >
                        <Row justify="center">
                            <Col>
                                <Text type="secondary">
                                    Paste the proof and verify it.
                                </Text>
                            </Col>
                        </Row>
                        <Row justify="center">
                            <Col span={12}>
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Paste the proof here..."
                                    style={{ margin: "20px 0" }}
                                    onChange={() =>
                                        console.log("handle proof change")
                                    }
                                />
                            </Col>
                        </Row>
                        <Row justify="center" style={{ marginTop: "20px" }}>
                            <Col xs={24} sm={22} md={20} lg={18} xl={12}>
                                <Column
                                    data={Array.from(
                                        { length: 10 },
                                        (_, i) => ({
                                            label: String(i),
                                            value: 0,
                                        }),
                                    )}
                                    xField="label"
                                    yField="value"
                                    seriesField="label"
                                    legend={false}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Content>
                <Footer style={{ textAlign: "center" }}>
                    Visit the{" "}
                    <a href="https://github.com/AleoHQ/sdk">
                        Aleo SDK Github repo
                    </a>
                    .
                </Footer>
            </Layout>
        </Layout>
    );
};

export default Main;
