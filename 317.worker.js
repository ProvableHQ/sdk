"use strict";(self.webpackChunkaleo_website=self.webpackChunkaleo_website||[]).push([[317],{317:(_,t,n)=>{n.r(t),n.d(t,{Address:()=>R,ExecutionResponse:()=>C,KeyPair:()=>P,PrivateKey:()=>M,PrivateKeyCiphertext:()=>E,Program:()=>W,ProgramManager:()=>B,ProvingKey:()=>I,RecordCiphertext:()=>F,RecordPlaintext:()=>U,Signature:()=>q,Transaction:()=>$,VerifyingKey:()=>N,ViewKey:()=>D,default:()=>X,initSync:()=>J,initThreadPool:()=>K,wbg_rayon_PoolBuilder:()=>L,wbg_rayon_start_worker:()=>T});var e=n(654);let r;_=n.hmd(_);const o=new Array(128).fill(void 0);function i(_){return o[_]}o.push(void 0,null,!0,!1);let a=o.length;function c(_){a===o.length&&o.push(o.length+1);const t=a;return a=o[t],o[t]=_,t}let s=0,w=null;function g(){return null!==w&&w.buffer===r.memory.buffer||(w=new Uint8Array(r.memory.buffer)),w}const b="undefined"!=typeof TextEncoder?new TextEncoder("utf-8"):{encode:()=>{throw Error("TextEncoder not available")}},d=function(_,t){const n=b.encode(_);return t.set(n),{read:_.length,written:n.length}};function l(_,t,n){if(void 0===n){const n=b.encode(_),e=t(n.length,1)>>>0;return g().subarray(e,e+n.length).set(n),s=n.length,e}let e=_.length,r=t(e,1)>>>0;const o=g();let i=0;for(;i<e;i++){const t=_.charCodeAt(i);if(t>127)break;o[r+i]=t}if(i!==e){0!==i&&(_=_.slice(i)),r=n(r,e,e=i+3*_.length,1)>>>0;const t=g().subarray(r+i,r+e);i+=d(_,t).written}return s=i,r}function u(_){return null==_}let f=null;function p(){return null!==f&&f.buffer===r.memory.buffer||(f=new Int32Array(r.memory.buffer)),f}function y(_){const t=i(_);return function(_){_<132||(o[_]=a,a=_)}(_),t}const h="undefined"!=typeof TextDecoder?new TextDecoder("utf-8",{ignoreBOM:!0,fatal:!0}):{decode:()=>{throw Error("TextDecoder not available")}};function m(_,t){return _>>>=0,h.decode(g().slice(_,_+t))}function v(_){const t=typeof _;if("number"==t||"boolean"==t||null==_)return`${_}`;if("string"==t)return`"${_}"`;if("symbol"==t){const t=_.description;return null==t?"Symbol":`Symbol(${t})`}if("function"==t){const t=_.name;return"string"==typeof t&&t.length>0?`Function(${t})`:"Function"}if(Array.isArray(_)){const t=_.length;let n="[";t>0&&(n+=v(_[0]));for(let e=1;e<t;e++)n+=", "+v(_[e]);return n+="]",n}const n=/\[object ([^\]]+)\]/.exec(toString.call(_));let e;if(!(n.length>1))return toString.call(_);if(e=n[1],"Object"==e)try{return"Object("+JSON.stringify(_)+")"}catch(_){return"Object"}return _ instanceof Error?`${_.name}: ${_.message}\n${_.stack}`:e}function k(_,t,n,e){const o={a:_,b:t,cnt:1,dtor:n},i=(..._)=>{o.cnt++;const t=o.a;o.a=0;try{return e(t,o.b,..._)}finally{0==--o.cnt?r.__wbindgen_export_3.get(o.dtor)(t,o.b):o.a=t}};return i.original=o,i}function x(_,t,n){r.wasm_bindgen__convert__closures__invoke1_mut__h3b17c69763a2b5bd(_,t,c(n))}function S(_,t){if(!(_ instanceof t))throw new Error(`expected instance of ${t.name}`);return _.ptr}function A(_,t){const n=t(1*_.length,1)>>>0;return g().set(_,n/1),s=_.length,n}function j(_,t){return _>>>=0,g().subarray(_/1,_/1+t)}function O(_,t){try{return _.apply(this,t)}catch(_){r.__wbindgen_exn_store(c(_))}}function K(_){return y(r.initThreadPool(_))}function T(_){r.wbg_rayon_start_worker(_)}"undefined"!=typeof TextDecoder&&h.decode();class R{static __wrap(_){_>>>=0;const t=Object.create(R.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_address_free(_)}static from_private_key(_){S(_,M);const t=r.address_from_private_key(_.__wbg_ptr);return R.__wrap(t)}static from_view_key(_){S(_,D);const t=r.address_from_view_key(_.__wbg_ptr);return R.__wrap(t)}static from_string(_){const t=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),n=s,e=r.address_from_string(t,n);return R.__wrap(e)}to_string(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.address_to_string(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}verify(_,t){const n=A(_,r.__wbindgen_malloc),e=s;return S(t,q),0!==r.address_verify(this.__wbg_ptr,n,e,t.__wbg_ptr)}}class C{static __wrap(_){_>>>=0;const t=Object.create(C.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_executionresponse_free(_)}getOutputs(){return y(r.executionresponse_getOutputs(this.__wbg_ptr))}}class P{static __wrap(_){_>>>=0;const t=Object.create(P.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_keypair_free(_)}constructor(_,t){S(_,I);var n=_.__destroy_into_raw();S(t,N);var e=t.__destroy_into_raw();const o=r.keypair_new(n,e);return P.__wrap(o)}provingKey(){try{const n=r.__wbindgen_add_to_stack_pointer(-16);r.keypair_provingKey(n,this.__wbg_ptr);var _=p()[n/4+0],t=p()[n/4+1];if(p()[n/4+2])throw y(t);return I.__wrap(_)}finally{r.__wbindgen_add_to_stack_pointer(16)}}verifyingKey(){try{const n=r.__wbindgen_add_to_stack_pointer(-16);r.keypair_verifyingKey(n,this.__wbg_ptr);var _=p()[n/4+0],t=p()[n/4+1];if(p()[n/4+2])throw y(t);return N.__wrap(_)}finally{r.__wbindgen_add_to_stack_pointer(16)}}}class M{static __wrap(_){_>>>=0;const t=Object.create(M.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_privatekey_free(_)}constructor(){const _=r.privatekey_new();return M.__wrap(_)}static from_seed_unchecked(_){const t=A(_,r.__wbindgen_malloc),n=s,e=r.privatekey_from_seed_unchecked(t,n);return M.__wrap(e)}static from_string(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.privatekey_from_string(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return M.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}to_string(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.privatekey_to_string(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}to_view_key(){const _=r.privatekey_to_view_key(this.__wbg_ptr);return D.__wrap(_)}to_address(){const _=r.privatekey_to_address(this.__wbg_ptr);return R.__wrap(_)}sign(_){const t=A(_,r.__wbindgen_malloc),n=s,e=r.privatekey_sign(this.__wbg_ptr,t,n);return q.__wrap(e)}static newEncrypted(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.privatekey_newEncrypted(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return E.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toCiphertext(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.privatekey_toCiphertext(e,this.__wbg_ptr,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return E.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}static fromPrivateKeyCiphertext(_,t){try{const o=r.__wbindgen_add_to_stack_pointer(-16);S(_,E);const i=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s;r.privatekey_fromPrivateKeyCiphertext(o,_.__wbg_ptr,i,a);var n=p()[o/4+0],e=p()[o/4+1];if(p()[o/4+2])throw y(e);return M.__wrap(n)}finally{r.__wbindgen_add_to_stack_pointer(16)}}}class E{static __wrap(_){_>>>=0;const t=Object.create(E.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_privatekeyciphertext_free(_)}static encryptPrivateKey(_,t){try{const o=r.__wbindgen_add_to_stack_pointer(-16);S(_,M);const i=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s;r.privatekeyciphertext_encryptPrivateKey(o,_.__wbg_ptr,i,a);var n=p()[o/4+0],e=p()[o/4+1];if(p()[o/4+2])throw y(e);return E.__wrap(n)}finally{r.__wbindgen_add_to_stack_pointer(16)}}decryptToPrivateKey(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.privatekeyciphertext_decryptToPrivateKey(e,this.__wbg_ptr,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return M.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toString(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.privatekeyciphertext_toString(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}static fromString(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.privatekeyciphertext_fromString(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return E.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}}class W{static __wrap(_){_>>>=0;const t=Object.create(W.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_program_free(_)}static fromString(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.program_fromString(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return W.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toString(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.program_toString(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}getFunctions(){return y(r.program_getFunctions(this.__wbg_ptr))}getFunctionInputs(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.program_getFunctionInputs(e,this.__wbg_ptr,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return y(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}getRecordMembers(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.program_getRecordMembers(e,this.__wbg_ptr,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return y(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}getStructMembers(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.program_getStructMembers(e,this.__wbg_ptr,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return y(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}static getCreditsProgram(){const _=r.program_getCreditsProgram();return W.__wrap(_)}id(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.program_id(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}isEqual(_){return S(_,W),0!==r.program_isEqual(this.__wbg_ptr,_.__wbg_ptr)}}class B{static __wrap(_){_>>>=0;const t=Object.create(B.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_programmanager_free(_)}constructor(){const _=r.programmanager_new();return B.__wrap(_)}cacheKeypairInWasmMemory(_,t,n,e){try{const c=r.__wbindgen_add_to_stack_pointer(-16),w=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),g=s,b=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),d=s;S(n,I);var o=n.__destroy_into_raw();S(e,N);var i=e.__destroy_into_raw();r.programmanager_cacheKeypairInWasmMemory(c,this.__wbg_ptr,w,g,b,d,o,i);var a=p()[c/4+0];if(p()[c/4+1])throw y(a)}finally{r.__wbindgen_add_to_stack_pointer(16)}}getCachedKeypair(_,t){try{const o=r.__wbindgen_add_to_stack_pointer(-16),i=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s,c=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),w=s;r.programmanager_getCachedKeypair(o,this.__wbg_ptr,i,a,c,w);var n=p()[o/4+0],e=p()[o/4+1];if(p()[o/4+2])throw y(e);return P.__wrap(n)}finally{r.__wbindgen_add_to_stack_pointer(16)}}synthesizeKeypair(_,t){try{const o=r.__wbindgen_add_to_stack_pointer(-16),i=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s,c=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),w=s;r.programmanager_synthesizeKeypair(o,this.__wbg_ptr,i,a,c,w);var n=p()[o/4+0],e=p()[o/4+1];if(p()[o/4+2])throw y(e);return P.__wrap(n)}finally{r.__wbindgen_add_to_stack_pointer(16)}}clearKeyCache(){r.programmanager_clearKeyCache(this.__wbg_ptr)}keyExists(_,t){try{const o=r.__wbindgen_add_to_stack_pointer(-16),i=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s,c=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),w=s;r.programmanager_keyExists(o,this.__wbg_ptr,i,a,c,w);var n=p()[o/4+0],e=p()[o/4+1];if(p()[o/4+2])throw y(e);return 0!==n}finally{r.__wbindgen_add_to_stack_pointer(16)}}split(_,t,n,e,o,i,a){S(_,M);var c=_.__destroy_into_raw();S(n,U);var w=n.__destroy_into_raw();const g=l(e,r.__wbindgen_malloc,r.__wbindgen_realloc),b=s;let d=0;u(i)||(S(i,I),d=i.__destroy_into_raw());let f=0;return u(a)||(S(a,N),f=a.__destroy_into_raw()),y(r.programmanager_split(this.__wbg_ptr,c,t,w,g,b,o,d,f))}transfer(_,t,n,e,o,i,a,c,w,g,b,d,f){S(_,M);var p=_.__destroy_into_raw();const h=l(n,r.__wbindgen_malloc,r.__wbindgen_realloc),m=s,v=l(e,r.__wbindgen_malloc,r.__wbindgen_realloc),k=s;let x=0;u(o)||(S(o,U),x=o.__destroy_into_raw()),S(a,U);var A=a.__destroy_into_raw();const j=l(c,r.__wbindgen_malloc,r.__wbindgen_realloc),O=s;let K=0;u(g)||(S(g,I),K=g.__destroy_into_raw());let T=0;u(b)||(S(b,N),T=b.__destroy_into_raw());let R=0;u(d)||(S(d,I),R=d.__destroy_into_raw());let C=0;return u(f)||(S(f,N),C=f.__destroy_into_raw()),y(r.programmanager_transfer(this.__wbg_ptr,p,t,h,m,v,k,x,i,A,j,O,w,K,T,R,C))}execute_local(_,t,n,e,o,i,a){try{const d=r.__wbindgen_add_to_stack_pointer(-16);S(_,M);var w=_.__destroy_into_raw();const f=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),h=s,m=l(n,r.__wbindgen_malloc,r.__wbindgen_realloc),v=s;let k=0;u(i)||(S(i,I),k=i.__destroy_into_raw());let x=0;u(a)||(S(a,N),x=a.__destroy_into_raw()),r.programmanager_execute_local(d,this.__wbg_ptr,w,f,h,m,v,c(e),o,k,x);var g=p()[d/4+0],b=p()[d/4+1];if(p()[d/4+2])throw y(b);return C.__wrap(g)}finally{r.__wbindgen_add_to_stack_pointer(16)}}execute(_,t,n,e,o,i,a,w,g,b,d,f){S(_,M);var p=_.__destroy_into_raw();const h=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),m=s,v=l(n,r.__wbindgen_malloc,r.__wbindgen_realloc),k=s;S(i,U);var x=i.__destroy_into_raw();const A=l(a,r.__wbindgen_malloc,r.__wbindgen_realloc),j=s;let O=0;u(g)||(S(g,I),O=g.__destroy_into_raw());let K=0;u(b)||(S(b,N),K=b.__destroy_into_raw());let T=0;u(d)||(S(d,I),T=d.__destroy_into_raw());let R=0;return u(f)||(S(f,N),R=f.__destroy_into_raw()),y(r.programmanager_execute(this.__wbg_ptr,p,h,m,v,k,c(e),o,x,A,j,w,O,K,T,R))}join(_,t,n,e,o,i,a,c,w,g,b){S(_,M);var d=_.__destroy_into_raw();S(t,U);var f=t.__destroy_into_raw();S(n,U);var p=n.__destroy_into_raw();S(o,U);var h=o.__destroy_into_raw();const m=l(i,r.__wbindgen_malloc,r.__wbindgen_realloc),v=s;let k=0;u(c)||(S(c,I),k=c.__destroy_into_raw());let x=0;u(w)||(S(w,N),x=w.__destroy_into_raw());let A=0;u(g)||(S(g,I),A=g.__destroy_into_raw());let j=0;return u(b)||(S(b,N),j=b.__destroy_into_raw()),y(r.programmanager_join(this.__wbg_ptr,d,f,p,e,h,m,v,a,k,x,A,j))}deploy(_,t,n,e,o,i,a,w,g){S(_,M);var b=_.__destroy_into_raw();const d=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),f=s;S(o,U);var p=o.__destroy_into_raw();const h=l(i,r.__wbindgen_malloc,r.__wbindgen_realloc),m=s;let v=0;u(w)||(S(w,I),v=w.__destroy_into_raw());let k=0;return u(g)||(S(g,N),k=g.__destroy_into_raw()),y(r.programmanager_deploy(this.__wbg_ptr,b,d,f,u(n)?0:c(n),e,p,h,m,a,v,k))}}class I{static __wrap(_){_>>>=0;const t=Object.create(I.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_provingkey_free(_)}static fromBytes(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=A(_,r.__wbindgen_malloc),i=s;r.provingkey_fromBytes(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return I.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toBytes(){try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.provingkey_toBytes(o,this.__wbg_ptr);var _=p()[o/4+0],t=p()[o/4+1],n=p()[o/4+2];if(p()[o/4+3])throw y(n);var e=j(_,t).slice();return r.__wbindgen_free(_,1*t),e}finally{r.__wbindgen_add_to_stack_pointer(16)}}}class F{static __wrap(_){_>>>=0;const t=Object.create(F.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_recordciphertext_free(_)}static fromString(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.recordciphertext_fromString(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return F.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toString(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.recordciphertext_toString(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}decrypt(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16);S(_,D),r.recordciphertext_decrypt(e,this.__wbg_ptr,_.__wbg_ptr);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return U.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}isOwner(_){return S(_,D),0!==r.recordciphertext_isOwner(this.__wbg_ptr,_.__wbg_ptr)}}class U{static __wrap(_){_>>>=0;const t=Object.create(U.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_recordplaintext_free(_)}static fromString(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.recordplaintext_fromString(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return U.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toString(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.recordplaintext_toString(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}microcredits(){const _=r.recordplaintext_microcredits(this.__wbg_ptr);return BigInt.asUintN(64,_)}serialNumberString(_,t,n){let e,o;try{const d=r.__wbindgen_add_to_stack_pointer(-16);S(_,M);const u=l(t,r.__wbindgen_malloc,r.__wbindgen_realloc),f=s,h=l(n,r.__wbindgen_malloc,r.__wbindgen_realloc),v=s;r.recordplaintext_serialNumberString(d,this.__wbg_ptr,_.__wbg_ptr,u,f,h,v);var i=p()[d/4+0],a=p()[d/4+1],c=p()[d/4+2],w=p()[d/4+3],g=i,b=a;if(w)throw g=0,b=0,y(c);return e=g,o=b,m(g,b)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(e,o,1)}}}class q{static __wrap(_){_>>>=0;const t=Object.create(q.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_signature_free(_)}static sign(_,t){S(_,M);const n=A(t,r.__wbindgen_malloc),e=s,o=r.signature_sign(_.__wbg_ptr,n,e);return q.__wrap(o)}verify(_,t){S(_,R);const n=A(t,r.__wbindgen_malloc),e=s;return 0!==r.signature_verify(this.__wbg_ptr,_.__wbg_ptr,n,e)}static from_string(_){const t=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),n=s,e=r.signature_from_string(t,n);return q.__wrap(e)}to_string(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.signature_to_string(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}}class ${static __wrap(_){_>>>=0;const t=Object.create($.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_transaction_free(_)}static fromString(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),i=s;r.transaction_fromString(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return $.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toString(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.transaction_toString(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}transactionId(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.transaction_transactionId(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}transactionType(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.transaction_transactionType(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}}class N{static __wrap(_){_>>>=0;const t=Object.create(N.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_verifyingkey_free(_)}static fromBytes(_){try{const e=r.__wbindgen_add_to_stack_pointer(-16),o=A(_,r.__wbindgen_malloc),i=s;r.verifyingkey_fromBytes(e,o,i);var t=p()[e/4+0],n=p()[e/4+1];if(p()[e/4+2])throw y(n);return N.__wrap(t)}finally{r.__wbindgen_add_to_stack_pointer(16)}}toBytes(){try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.verifyingkey_toBytes(o,this.__wbg_ptr);var _=p()[o/4+0],t=p()[o/4+1],n=p()[o/4+2];if(p()[o/4+3])throw y(n);var e=j(_,t).slice();return r.__wbindgen_free(_,1*t),e}finally{r.__wbindgen_add_to_stack_pointer(16)}}}class D{static __wrap(_){_>>>=0;const t=Object.create(D.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_viewkey_free(_)}static from_private_key(_){S(_,M);const t=r.viewkey_from_private_key(_.__wbg_ptr);return D.__wrap(t)}static from_string(_){const t=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),n=s,e=r.viewkey_from_string(t,n);return D.__wrap(e)}to_string(){let _,t;try{const o=r.__wbindgen_add_to_stack_pointer(-16);r.viewkey_to_string(o,this.__wbg_ptr);var n=p()[o/4+0],e=p()[o/4+1];return _=n,t=e,m(n,e)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(_,t,1)}}to_address(){const _=r.viewkey_to_address(this.__wbg_ptr);return R.__wrap(_)}decrypt(_){let t,n;try{const g=r.__wbindgen_add_to_stack_pointer(-16),b=l(_,r.__wbindgen_malloc,r.__wbindgen_realloc),d=s;r.viewkey_decrypt(g,this.__wbg_ptr,b,d);var e=p()[g/4+0],o=p()[g/4+1],i=p()[g/4+2],a=p()[g/4+3],c=e,w=o;if(a)throw c=0,w=0,y(i);return t=c,n=w,m(c,w)}finally{r.__wbindgen_add_to_stack_pointer(16),r.__wbindgen_free(t,n,1)}}}class L{static __wrap(_){_>>>=0;const t=Object.create(L.prototype);return t.__wbg_ptr=_,t}__destroy_into_raw(){const _=this.__wbg_ptr;return this.__wbg_ptr=0,_}free(){const _=this.__destroy_into_raw();r.__wbg_wbg_rayon_poolbuilder_free(_)}numThreads(){return r.wbg_rayon_poolbuilder_numThreads(this.__wbg_ptr)>>>0}receiver(){return r.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr)}build(){r.wbg_rayon_poolbuilder_build(this.__wbg_ptr)}}function V(){const t={wbg:{}};return t.wbg.__wbg_log_bcdbad8373c39b16=function(_,t){console.log(m(_,t))},t.wbg.__wbindgen_object_clone_ref=function(_){return c(i(_))},t.wbg.__wbindgen_string_get=function(_,t){const n=i(t),e="string"==typeof n?n:void 0;var o=u(e)?0:l(e,r.__wbindgen_malloc,r.__wbindgen_realloc),a=s;p()[_/4+1]=a,p()[_/4+0]=o},t.wbg.__wbindgen_object_drop_ref=function(_){y(_)},t.wbg.__wbindgen_string_new=function(_,t){return c(m(_,t))},t.wbg.__wbindgen_cb_drop=function(_){const t=y(_).original;return 1==t.cnt--&&(t.a=0,!0)},t.wbg.__wbg_transaction_new=function(_){return c($.__wrap(_))},t.wbg.__wbg_new_abda76e883ba8a5f=function(){return c(new Error)},t.wbg.__wbg_stack_658279fe44541cf6=function(_,t){const n=l(i(t).stack,r.__wbindgen_malloc,r.__wbindgen_realloc),e=s;p()[_/4+1]=e,p()[_/4+0]=n},t.wbg.__wbg_error_f851667af71bcfc6=function(_,t){let n,e;try{n=_,e=t,console.error(m(_,t))}finally{r.__wbindgen_free(n,e,1)}},t.wbg.__wbg_fetch_57429b87be3dcc33=function(_){return c(fetch(i(_)))},t.wbg.__wbindgen_link_22046963fe0b707a=function(_){const t=l("data:application/javascript,"+encodeURIComponent("onmessage = function (ev) {\n            let [ia, index, value] = ev.data;\n            ia = new Int32Array(ia.buffer);\n            let result = Atomics.wait(ia, index, value);\n            postMessage(result);\n        };\n        "),r.__wbindgen_malloc,r.__wbindgen_realloc),n=s;p()[_/4+1]=n,p()[_/4+0]=t},t.wbg.__wbindgen_number_new=function(_){return c(_)},t.wbg.__wbg_waitAsync_60fb5e2e86467e31=function(){return c(Atomics.waitAsync)},t.wbg.__wbindgen_is_undefined=function(_){return void 0===i(_)},t.wbg.__wbg_waitAsync_73fd6eb3bace0a8d=function(_,t,n){return c(Atomics.waitAsync(i(_),t,n))},t.wbg.__wbg_async_e1a2a669aacf35ff=function(_){return i(_).async},t.wbg.__wbg_value_555e4f564193db05=function(_){return c(i(_).value)},t.wbg.__wbg_fetch_8eaf01857a5bb21f=function(_,t){return c(i(_).fetch(i(t)))},t.wbg.__wbg_signal_4bd18fb489af2d4c=function(_){return c(i(_).signal)},t.wbg.__wbg_new_55c9955722952374=function(){return O((function(){return c(new AbortController)}),arguments)},t.wbg.__wbg_abort_654b796176d117aa=function(_){i(_).abort()},t.wbg.__wbg_status_114ef6fe27fb8b00=function(){return O((function(_){return i(_).status}),arguments)},t.wbg.__wbg_response_f2acf2ecbe021710=function(){return O((function(_){return c(i(_).response)}),arguments)},t.wbg.__wbg_responseText_da275667251fd153=function(){return O((function(_,t){const n=i(t).responseText;var e=u(n)?0:l(n,r.__wbindgen_malloc,r.__wbindgen_realloc),o=s;p()[_/4+1]=o,p()[_/4+0]=e}),arguments)},t.wbg.__wbg_new_daafff584c71593b=function(){return O((function(){return c(new XMLHttpRequest)}),arguments)},t.wbg.__wbg_open_56fa1eb95989f6a5=function(){return O((function(_,t,n,e,r,o){i(_).open(m(t,n),m(e,r),0!==o)}),arguments)},t.wbg.__wbg_overrideMimeType_1a661d17da5f8baf=function(){return O((function(_,t,n){i(_).overrideMimeType(m(t,n))}),arguments)},t.wbg.__wbg_send_9f5007eae908c72e=function(){return O((function(_){i(_).send()}),arguments)},t.wbg.__wbg_new_1eead62f64ca15ce=function(){return O((function(){return c(new Headers)}),arguments)},t.wbg.__wbg_append_fda9e3432e3e88da=function(){return O((function(_,t,n,e,r){i(_).append(m(t,n),m(e,r))}),arguments)},t.wbg.__wbg_instanceof_Response_fc4327dbfcdf5ced=function(_){let t;try{t=i(_)instanceof Response}catch{t=!1}return t},t.wbg.__wbg_url_8503de97f69da463=function(_,t){const n=l(i(t).url,r.__wbindgen_malloc,r.__wbindgen_realloc),e=s;p()[_/4+1]=e,p()[_/4+0]=n},t.wbg.__wbg_status_ac85a3142a84caa2=function(_){return i(_).status},t.wbg.__wbg_headers_b70de86b8e989bc0=function(_){return c(i(_).headers)},t.wbg.__wbg_arrayBuffer_288fb3538806e85c=function(){return O((function(_){return c(i(_).arrayBuffer())}),arguments)},t.wbg.__wbg_data_ab99ae4a2e1e8bc9=function(_){return c(i(_).data)},t.wbg.__wbg_newwithstrandinit_cad5cd6038c7ff5d=function(){return O((function(_,t,n){return c(new Request(m(_,t),i(n)))}),arguments)},t.wbg.__wbg_setonmessage_f0bd0280573b7084=function(_,t){i(_).onmessage=i(t)},t.wbg.__wbg_new_8e7322f46d5d019c=function(){return O((function(_,t){return c(new Worker(m(_,t)))}),arguments)},t.wbg.__wbg_postMessage_8c609e2bde333d9c=function(){return O((function(_,t){i(_).postMessage(i(t))}),arguments)},t.wbg.__wbg_crypto_c48a774b022d20ac=function(_){return c(i(_).crypto)},t.wbg.__wbindgen_is_object=function(_){const t=i(_);return"object"==typeof t&&null!==t},t.wbg.__wbg_process_298734cf255a885d=function(_){return c(i(_).process)},t.wbg.__wbg_versions_e2e78e134e3e5d01=function(_){return c(i(_).versions)},t.wbg.__wbg_node_1cd7a5d853dbea79=function(_){return c(i(_).node)},t.wbg.__wbindgen_is_string=function(_){return"string"==typeof i(_)},t.wbg.__wbg_require_8f08ceecec0f4fee=function(){return O((function(){return c(_.require)}),arguments)},t.wbg.__wbindgen_is_function=function(_){return"function"==typeof i(_)},t.wbg.__wbg_msCrypto_bcb970640f50a1e8=function(_){return c(i(_).msCrypto)},t.wbg.__wbg_randomFillSync_dc1e9a60c158336d=function(){return O((function(_,t){i(_).randomFillSync(y(t))}),arguments)},t.wbg.__wbg_getRandomValues_37fa2ca9e4e07fab=function(){return O((function(_,t){i(_).getRandomValues(i(t))}),arguments)},t.wbg.__wbg_get_44be0491f933a435=function(_,t){return c(i(_)[t>>>0])},t.wbg.__wbg_length_fff51ee6522a1a18=function(_){return i(_).length},t.wbg.__wbg_newnoargs_581967eacc0e2604=function(_,t){return c(new Function(m(_,t)))},t.wbg.__wbg_next_526fc47e980da008=function(_){return c(i(_).next)},t.wbg.__wbg_next_ddb3312ca1c4e32a=function(){return O((function(_){return c(i(_).next())}),arguments)},t.wbg.__wbg_done_5c1f01fb660d73b5=function(_){return i(_).done},t.wbg.__wbg_value_1695675138684bd5=function(_){return c(i(_).value)},t.wbg.__wbg_iterator_97f0c81209c6c35a=function(){return c(Symbol.iterator)},t.wbg.__wbg_get_97b561fb56f034b5=function(){return O((function(_,t){return c(Reflect.get(i(_),i(t)))}),arguments)},t.wbg.__wbg_call_cb65541d95d71282=function(){return O((function(_,t){return c(i(_).call(i(t)))}),arguments)},t.wbg.__wbg_new_b51585de1b234aff=function(){return c(new Object)},t.wbg.__wbg_self_1ff1d729e9aae938=function(){return O((function(){return c(self.self)}),arguments)},t.wbg.__wbg_window_5f4faef6c12b79ec=function(){return O((function(){return c(window.window)}),arguments)},t.wbg.__wbg_globalThis_1d39714405582d3c=function(){return O((function(){return c(globalThis.globalThis)}),arguments)},t.wbg.__wbg_global_651f05c6a0944d1c=function(){return O((function(){return c(n.g.global)}),arguments)},t.wbg.__wbg_newwithlength_3ec098a360da1909=function(_){return c(new Array(_>>>0))},t.wbg.__wbg_set_502d29070ea18557=function(_,t,n){i(_)[t>>>0]=y(n)},t.wbg.__wbg_of_3f69007bb4eeae65=function(_,t,n){return c(Array.of(i(_),i(t),i(n)))},t.wbg.__wbg_call_01734de55d61e11d=function(){return O((function(_,t,n){return c(i(_).call(i(t),i(n)))}),arguments)},t.wbg.__wbg_new_43f1b47c28813cbd=function(_,t){try{var n={a:_,b:t};const e=new Promise(((_,t)=>{const e=n.a;n.a=0;try{return function(_,t,n,e){r.wasm_bindgen__convert__closures__invoke2_mut__ha58dc4bcbdf7c112(_,t,c(n),c(e))}(e,n.b,_,t)}finally{n.a=e}}));return c(e)}finally{n.a=n.b=0}},t.wbg.__wbg_resolve_53698b95aaf7fcf8=function(_){return c(Promise.resolve(i(_)))},t.wbg.__wbg_then_f7e06ee3c11698eb=function(_,t){return c(i(_).then(i(t)))},t.wbg.__wbg_then_b2267541e2a73865=function(_,t,n){return c(i(_).then(i(t),i(n)))},t.wbg.__wbg_buffer_085ec1f694018c4f=function(_){return c(i(_).buffer)},t.wbg.__wbg_new_a0af68041688e8fd=function(_){return c(new Int32Array(i(_)))},t.wbg.__wbg_newwithbyteoffsetandlength_6da8e527659b86aa=function(_,t,n){return c(new Uint8Array(i(_),t>>>0,n>>>0))},t.wbg.__wbg_new_8125e318e6245eed=function(_){return c(new Uint8Array(i(_)))},t.wbg.__wbg_set_5cf90238115182c3=function(_,t,n){i(_).set(i(t),n>>>0)},t.wbg.__wbg_length_72e2208bbc0efc61=function(_){return i(_).length},t.wbg.__wbg_newwithlength_e5d69174d6984cd7=function(_){return c(new Uint8Array(_>>>0))},t.wbg.__wbg_subarray_13db269f57aa838d=function(_,t,n){return c(i(_).subarray(t>>>0,n>>>0))},t.wbg.__wbg_has_c5fcd020291e56b8=function(){return O((function(_,t){return Reflect.has(i(_),i(t))}),arguments)},t.wbg.__wbg_set_092e06b0f9d71865=function(){return O((function(_,t,n){return Reflect.set(i(_),i(t),i(n))}),arguments)},t.wbg.__wbg_stringify_e25465938f3f611f=function(){return O((function(_){return c(JSON.stringify(i(_)))}),arguments)},t.wbg.__wbindgen_debug_string=function(_,t){const n=l(v(i(t)),r.__wbindgen_malloc,r.__wbindgen_realloc),e=s;p()[_/4+1]=e,p()[_/4+0]=n},t.wbg.__wbindgen_throw=function(_,t){throw new Error(m(_,t))},t.wbg.__wbindgen_rethrow=function(_){throw y(_)},t.wbg.__wbindgen_module=function(){return c(Q.__wbindgen_wasm_module)},t.wbg.__wbindgen_memory=function(){return c(r.memory)},t.wbg.__wbg_startWorkers_6fd3af285ea11136=function(_,t,n){return c((0,e.Q)(y(_),y(t),L.__wrap(n)))},t.wbg.__wbindgen_closure_wrapper6972=function(_,t,n){return c(k(_,t,1159,x))},t.wbg.__wbindgen_closure_wrapper6974=function(_,t,n){return c(k(_,t,1159,x))},t}function z(_,t){_.wbg.memory=t||new WebAssembly.Memory({initial:122,maximum:65536,shared:!0})}function H(_,t){return r=_.exports,Q.__wbindgen_wasm_module=t,f=null,w=null,r.__wbindgen_start(),r}function J(_,t){if(void 0!==r)return r;const n=V();return z(n,t),_ instanceof WebAssembly.Module||(_=new WebAssembly.Module(_)),H(new WebAssembly.Instance(_,n),_)}async function Q(_,t){if(void 0!==r)return r;void 0===_&&(_=new URL(n(345),n.b));const e=V();("string"==typeof _||"function"==typeof Request&&_ instanceof Request||"function"==typeof URL&&_ instanceof URL)&&(_=fetch(_)),z(e,t);const{instance:o,module:i}=await async function(_,t){if("function"==typeof Response&&_ instanceof Response){if("function"==typeof WebAssembly.instantiateStreaming)try{return await WebAssembly.instantiateStreaming(_,t)}catch(t){if("application/wasm"==_.headers.get("Content-Type"))throw t;console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n",t)}const n=await _.arrayBuffer();return await WebAssembly.instantiate(n,t)}{const n=await WebAssembly.instantiate(_,t);return n instanceof WebAssembly.Instance?{instance:n,module:_}:n}}(await _,e);return H(o,i)}const X=Q},345:(_,t,n)=>{_.exports=n.p+"58bab1ac74dcb08baa35.wasm"}}]);
//# sourceMappingURL=317.worker.js.map