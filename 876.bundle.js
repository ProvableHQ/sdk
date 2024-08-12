/*! For license information please see 876.bundle.js.LICENSE.txt */
(self.webpackChunkaleo_website=self.webpackChunkaleo_website||[]).push([[876,495],{720:(e,r,t)=>{t.d(r,{LV:()=>f});const i=Symbol("Comlink.proxy"),n=Symbol("Comlink.endpoint"),a=Symbol("Comlink.releaseProxy"),o=Symbol("Comlink.finalizer"),s=Symbol("Comlink.thrown"),c=e=>"object"==typeof e&&null!==e||"function"==typeof e,u=new Map([["proxy",{canHandle:e=>c(e)&&e[i],serialize(e){const{port1:r,port2:t}=new MessageChannel;return h(e,r),[t,[t]]},deserialize:e=>(e.start(),f(e))}],["throw",{canHandle:e=>c(e)&&s in e,serialize({value:e}){let r;return r=e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[r,[]]},deserialize(e){if(e.isError)throw Object.assign(new Error(e.value.message),e.value);throw e.value}}]]);function h(e,r=globalThis,t=["*"]){r.addEventListener("message",(function n(a){if(!a||!a.data)return;if(!function(e,r){for(const t of e){if(r===t||"*"===t)return!0;if(t instanceof RegExp&&t.test(r))return!0}return!1}(t,a.origin))return void console.warn(`Invalid origin '${a.origin}' for comlink proxy`);const{id:c,type:u,path:f}=Object.assign({path:[]},a.data),y=(a.data.argumentList||[]).map(P);let d;try{const r=f.slice(0,-1).reduce(((e,r)=>e[r]),e),t=f.reduce(((e,r)=>e[r]),e);switch(u){case"GET":d=t;break;case"SET":r[f.slice(-1)[0]]=P(a.data.value),d=!0;break;case"APPLY":d=t.apply(r,y);break;case"CONSTRUCT":d=function(e){return Object.assign(e,{[i]:!0})}(new t(...y));break;case"ENDPOINT":{const{port1:r,port2:t}=new MessageChannel;h(e,t),d=function(e,r){return w.set(e,r),e}(r,[r])}break;case"RELEASE":d=void 0;break;default:return}}catch(e){d={value:e,[s]:0}}Promise.resolve(d).catch((e=>({value:e,[s]:0}))).then((t=>{const[i,a]=m(t);r.postMessage(Object.assign(Object.assign({},i),{id:c}),a),"RELEASE"===u&&(r.removeEventListener("message",n),l(r),o in e&&"function"==typeof e[o]&&e[o]())})).catch((e=>{const[t,i]=m({value:new TypeError("Unserializable return value"),[s]:0});r.postMessage(Object.assign(Object.assign({},t),{id:c}),i)}))})),r.start&&r.start()}function l(e){(function(e){return"MessagePort"===e.constructor.name})(e)&&e.close()}function f(e,r){return g(e,[],r)}function y(e){if(e)throw new Error("Proxy has been released and is not useable")}function d(e){return _(e,{type:"RELEASE"}).then((()=>{l(e)}))}const p=new WeakMap,v="FinalizationRegistry"in globalThis&&new FinalizationRegistry((e=>{const r=(p.get(e)||0)-1;p.set(e,r),0===r&&d(e)}));function g(e,r=[],t=function(){}){let i=!1;const o=new Proxy(t,{get(t,n){if(y(i),n===a)return()=>{!function(e){v&&v.unregister(e)}(o),d(e),i=!0};if("then"===n){if(0===r.length)return{then:()=>o};const t=_(e,{type:"GET",path:r.map((e=>e.toString()))}).then(P);return t.then.bind(t)}return g(e,[...r,n])},set(t,n,a){y(i);const[o,s]=m(a);return _(e,{type:"SET",path:[...r,n].map((e=>e.toString())),value:o},s).then(P)},apply(t,a,o){y(i);const s=r[r.length-1];if(s===n)return _(e,{type:"ENDPOINT"}).then(P);if("bind"===s)return g(e,r.slice(0,-1));const[c,u]=b(o);return _(e,{type:"APPLY",path:r.map((e=>e.toString())),argumentList:c},u).then(P)},construct(t,n){y(i);const[a,o]=b(n);return _(e,{type:"CONSTRUCT",path:r.map((e=>e.toString())),argumentList:a},o).then(P)}});return function(e,r){const t=(p.get(r)||0)+1;p.set(r,t),v&&v.register(e,r,e)}(o,e),o}function b(e){const r=e.map(m);return[r.map((e=>e[0])),(t=r.map((e=>e[1])),Array.prototype.concat.apply([],t))];var t}const w=new WeakMap;function m(e){for(const[r,t]of u)if(t.canHandle(e)){const[i,n]=t.serialize(e);return[{type:"HANDLER",name:r,value:i},n]}return[{type:"RAW",value:e},w.get(e)||[]]}function P(e){switch(e.type){case"HANDLER":return u.get(e.name).deserialize(e.value);case"RAW":return e.value}}function _(e,r,t){return new Promise((i=>{const n=new Array(4).fill(0).map((()=>Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16))).join("-");e.addEventListener("message",(function r(t){t.data&&t.data.id&&t.data.id===n&&(e.removeEventListener("message",r),i(t.data))})),e.start&&e.start(),e.postMessage(Object.assign({id:n},r),t)}))}},495:(e,r,t)=>{t.a(e,(async(e,i)=>{try{t.r(r),t.d(r,{Account:()=>s,Address:()=>n.pV,AleoKeyProvider:()=>f,AleoKeyProviderParams:()=>l,AleoNetworkClient:()=>h,BlockHeightSearch:()=>v,CREDITS_PROGRAM_KEYS:()=>k,ExecutionResponse:()=>n.qp,Field:()=>n.D0,FunctionExecution:()=>n.Zc,KEY_STORE:()=>_,NetworkRecordProvider:()=>p,OfflineKeyProvider:()=>d,OfflineQuery:()=>n.c7,OfflineSearchParams:()=>y,PRIVATE_TO_PUBLIC_TRANSFER:()=>C,PRIVATE_TRANSFER:()=>S,PRIVATE_TRANSFER_TYPES:()=>E,PUBLIC_TO_PRIVATE_TRANSFER:()=>A,PUBLIC_TRANSFER:()=>B,PUBLIC_TRANSFER_AS_SIGNER:()=>R,PrivateKey:()=>n.ZD,PrivateKeyCiphertext:()=>n.LW,Program:()=>n.BP,ProgramManager:()=>w,ProgramManagerBase:()=>n.Ao,ProvingKey:()=>n.$7,RecordCiphertext:()=>n.KC,RecordPlaintext:()=>n.ZF,Signature:()=>n.to,Transaction:()=>n.ZX,VALID_TRANSFER_TYPES:()=>T,VerifyingKey:()=>n.pF,ViewKey:()=>n.hv,createAleoWorker:()=>b,initThreadPool:()=>n.Fs,initializeWasm:()=>V,logAndThrow:()=>F,verifyFunctionExecution:()=>n.Yc});var n=t(877),a=t(720),o=e([n]);n=(o.then?(await o)():o)[0];class s{_privateKey;_viewKey;_address;constructor(e={}){try{this._privateKey=this.privateKeyFromParams(e)}catch(e){throw console.error("Wrong parameter",e),new Error("Wrong Parameter")}this._viewKey=n.hv.from_private_key(this._privateKey),this._address=n.pV.from_private_key(this._privateKey)}static fromCiphertext(e,r){try{e="string"==typeof e?n.LW.fromString(e):e;const t=n.ZD.fromPrivateKeyCiphertext(e,r);return new s({privateKey:t.to_string()})}catch(e){throw new Error("Wrong password or invalid ciphertext")}}privateKeyFromParams(e){return e.seed?n.ZD.from_seed_unchecked(e.seed):e.privateKey?n.ZD.from_string(e.privateKey):new n.ZD}privateKey(){return this._privateKey}viewKey(){return this._viewKey}address(){return this._address}toString(){return this.address().to_string()}encryptAccount(e){return this._privateKey.toCiphertext(e)}decryptRecord(e){return this._viewKey.decrypt(e)}decryptRecords(e){return e.map((e=>this._viewKey.decrypt(e)))}ownsRecordCiphertext(e){if("string"!=typeof e)return e.isOwner(this._viewKey);try{return n.KC.fromString(e).isOwner(this._viewKey)}catch(e){return!1}}sign(e){return this._privateKey.sign(e)}verify(e,r){return this._address.verify(e,r)}}async function c(e,r){const t=await fetch(e,r);if(!t.ok)throw new Error(t.status+" could not get URL "+e);return t}async function u(e,r){r.method="POST";const t=await fetch(e,r);if(!t.ok)throw new Error(t.status+" could not post URL "+e);return t}class h{host;headers;account;constructor(e,r){this.host=e+"/testnet",r&&r.headers?this.headers=r.headers:this.headers={"X-Aleo-SDK-Version":"0.6.12"}}setAccount(e){this.account=e}getAccount(){return this.account}setHost(e){this.host=e+"/testnet"}async fetchData(e="/"){try{const r=await c(this.host+e,{headers:this.headers});return await r.json()}catch(e){throw new Error("Error fetching data.")}}async findUnspentRecords(e,r,t,i,a,o){if(o=o||[],e<0)throw new Error("Start height must be greater than or equal to 0");const s=new Array;let c,u,h,l,f=0,y=BigInt(0);if(void 0===t){if(void 0===this.account)throw new Error("Private key must be specified in an argument to findOwnedRecords or set in the AleoNetworkClient");h=this.account._privateKey}else try{h=t instanceof n.ZD?t:n.ZD.from_string(t)}catch(e){throw new Error("Error parsing private key provided.")}const d=h.to_view_key();try{const e=await this.getLatestHeight();if("number"!=typeof e)throw new Error("Error fetching latest block height.");l=e}catch(e){throw new Error("Error fetching latest block height.")}if(u="number"==typeof r&&r<=l?r:l,e>u)throw new Error("Start height must be less than or equal to end height.");for(;u>e;){c=u-50,c<e&&(c=e);try{const e=await this.getBlockRange(c,u);if(u=c,!(e instanceof Error))for(let r=0;r<e.length;r++){const t=e[r].transactions;if(void 0!==t)for(let e=0;e<t.length;e++){const r=t[e];if("execute"==r.type){const e=r.transaction;if(e.execution&&void 0!==e.execution.transitions)for(let r=0;r<e.execution.transitions.length;r++){const t=e.execution.transitions[r];if("credits.aleo"===t.program&&void 0!==t.outputs)for(let e=0;e<t.outputs.length;e++){const r=t.outputs[e];if("record"===r.type)try{const e=n.KC.fromString(r.value);if(e.isOwner(d)){const r=e.decrypt(d),t=r.nonce();if(o.includes(t))continue;const n=r.serialNumberString(h,"credits.aleo","credits");try{await this.getTransitionId(n)}catch(e){if(!i&&(s.push(r),"number"==typeof a&&(y+=r.microcredits(),y>=BigInt(a))))return s;if(void 0!==i&&i.length>0){let e=0;if(r.microcredits()>i[e]){if(e+=1,s.push(r),"number"==typeof a&&(y+=r.microcredits(),y>=BigInt(a)))return s;if(s.length>=i.length)return s}}}}}catch(e){}}}}}}}catch(e){if(console.warn("Error fetching blocks in range: "+c.toString()+"-"+u.toString()),console.warn("Error: ",e),f+=1,f>10)return console.warn("10 failures fetching records reached. Returning records fetched so far"),s}}return s}async getBlock(e){try{return await this.fetchData("/block/"+e)}catch(e){throw new Error("Error fetching block.")}}async getBlockRange(e,r){try{return await this.fetchData("/blocks?start="+e+"&end="+r)}catch(t){throw new Error("Error fetching blocks between "+e+" and "+r+".")}}async getDeploymentTransactionIDForProgram(e){e instanceof n.BP&&(e=e.toString());try{return(await this.fetchData("/find/transactionID/deployment/"+e)).replace('"',"")}catch(e){throw new Error("Error fetching deployment transaction for program.")}}async getDeploymentTransactionForProgram(e){try{const r=await this.getDeploymentTransactionIDForProgram(e);return await this.getTransaction(r)}catch(e){throw new Error("Error fetching deployment transaction for program.")}}async getLatestBlock(){try{return await this.fetchData("/latest/block")}catch(e){throw new Error("Error fetching latest block.")}}async getLatestCommittee(){try{return await this.fetchData("/committee/latest")}catch(e){throw new Error("Error fetching latest block.")}}async getLatestHeight(){try{return await this.fetchData("/latest/height")}catch(e){throw new Error("Error fetching latest height.")}}async getProgram(e){try{return await this.fetchData("/program/"+e)}catch(e){throw new Error("Error fetching program")}}async getProgramObject(e){try{return n.BP.fromString(e)}catch(r){try{return n.BP.fromString(await this.getProgram(e))}catch(r){throw new Error(`${e} is neither a program name or a valid program`)}}}async getProgramImports(e){try{const r={},t=(e instanceof n.BP?e:await this.getProgramObject(e)).getImports();for(let e=0;e<t.length;e++){const i=t[e];if(!r.hasOwnProperty(i)){const e=await this.getProgram(i),t=await this.getProgramImports(i);for(const e in t)r.hasOwnProperty(e)||(r[e]=t[e]);r[i]=e}}return r}catch(e){throw F("Error fetching program imports: "+e)}}async getProgramImportNames(e){try{return(e instanceof n.BP?e:await this.getProgramObject(e)).getImports()}catch(e){throw new Error("Error fetching program imports with error: "+e)}}async getProgramMappingNames(e){try{return await this.fetchData("/program/"+e+"/mappings")}catch(e){throw new Error("Error fetching program mappings - ensure the program exists on chain before trying again")}}async getProgramMappingValue(e,r,t){try{return await this.fetchData("/program/"+e+"/mapping/"+r+"/"+t)}catch(e){throw new Error("Error fetching mapping value - ensure the mapping exists and the key is correct")}}async getStateRoot(){try{return await this.fetchData("/latest/stateRoot")}catch(e){throw new Error("Error fetching Aleo state root")}}async getTransaction(e){try{return await this.fetchData("/transaction/"+e)}catch(e){throw new Error("Error fetching transaction.")}}async getTransactions(e){try{return await this.fetchData("/block/"+e.toString()+"/transactions")}catch(e){throw new Error("Error fetching transactions.")}}async getTransactionsInMempool(){try{return await this.fetchData("/memoryPool/transactions")}catch(e){throw new Error("Error fetching transactions from mempool.")}}async getTransitionId(e){try{return await this.fetchData("/find/transitionID/"+e)}catch(e){throw new Error("Error fetching transition ID.")}}async submitTransaction(e){const r=e instanceof n.ZX?e.toString():e;try{const e=await u(this.host+"/transaction/broadcast",{body:r,headers:Object.assign({},this.headers,{"Content-Type":"application/json"})});try{return await e.json()}catch(e){throw new Error(`Error posting transaction. Aleo network response: ${e.message}`)}}catch(e){throw new Error(`Error posting transaction: No response received: ${e.message}`)}}}class l{name;proverUri;verifierUri;cacheKey;constructor(e){this.proverUri=e.proverUri,this.verifierUri=e.verifierUri,this.cacheKey=e.cacheKey,this.name=e.name}}class f{cache;cacheOption;keyUris;async fetchBytes(e="/"){try{const r=await c(e),t=await r.arrayBuffer();return new Uint8Array(t)}catch(e){throw new Error("Error fetching data."+e)}}constructor(){this.keyUris=_,this.cache=new Map,this.cacheOption=!1}useCache(e){this.cacheOption=e}clearCache(){this.cache.clear()}cacheKeys(e,r){const[t,i]=r;this.cache.set(e,[t.toBytes(),i.toBytes()])}containsKeys(e){return this.cache.has(e)}deleteKeys(e){return this.cache.delete(e)}getKeys(e){if(console.debug(`Checking if key exists in cache. KeyId: ${e}`),this.cache.has(e)){const[r,t]=this.cache.get(e);return[n.$7.fromBytes(r),n.pF.fromBytes(t)]}return new Error("Key not found in cache.")}async functionKeys(e){if(e){let r,t,i;if("name"in e&&"string"==typeof e.name){let r=k.getKey(e.name);if(!(r instanceof Error))return this.fetchCreditsKeys(r)}if("proverUri"in e&&"string"==typeof e.proverUri&&(r=e.proverUri),"verifierUri"in e&&"string"==typeof e.verifierUri&&(t=e.verifierUri),"cacheKey"in e&&"string"==typeof e.cacheKey&&(i=e.cacheKey),r&&t)return await this.fetchRemoteKeys(r,t,i);if(i)return this.getKeys(i)}throw Error("Invalid parameters provided, must provide either a cacheKey and/or a proverUrl and a verifierUrl")}async fetchRemoteKeys(e,r,t){try{if(this.cacheOption){t||(t=e);const i=this.cache.get(t);if(void 0!==i)return[n.$7.fromBytes(i[0]),n.pF.fromBytes(i[1])];{console.debug("Fetching proving keys from url "+e);const i=n.$7.fromBytes(await this.fetchBytes(e));console.debug("Fetching verifying keys "+r);const a=await this.getVerifyingKey(r);return this.cache.set(t,[i.toBytes(),a.toBytes()]),[i,a]}}{const t=n.$7.fromBytes(await this.fetchBytes(e));return[t,await this.getVerifyingKey(r)]}}catch(t){throw new Error(`Error: ${t} fetching fee proving and verifying keys from ${e} and ${r}.`)}}async fetchProvingKey(e,r){try{if(this.cacheOption){r||(r=e);const t=this.cache.get(r);if(void 0!==t)return n.$7.fromBytes(t[0]);console.debug("Fetching proving keys from url "+e);return n.$7.fromBytes(await this.fetchBytes(e))}return n.$7.fromBytes(await this.fetchBytes(e))}catch(r){throw new Error(`Error: ${r} fetching fee proving keys from ${e}`)}}async fetchCreditsKeys(e){try{if(this.cache.has(e.locator)&&this.cacheOption){const r=this.cache.get(e.locator);return[n.$7.fromBytes(r[0]),n.pF.fromBytes(r[1])]}{const r=e.verifyingKey(),t=await this.fetchProvingKey(e.prover,e.locator);return this.cacheOption&&this.cache.set(k.bond_public.locator,[t.toBytes(),r.toBytes()]),[t,r]}}catch(e){throw new Error(`Error: fetching credits.aleo keys: ${e}`)}}async bondPublicKeys(){return this.fetchCreditsKeys(k.bond_public)}bondValidatorKeys(){return this.fetchCreditsKeys(k.bond_validator)}claimUnbondPublicKeys(){return this.fetchCreditsKeys(k.claim_unbond_public)}async transferKeys(e){if(S.has(e))return await this.fetchCreditsKeys(k.transfer_private);if(C.has(e))return await this.fetchCreditsKeys(k.transfer_private_to_public);if(B.has(e))return await this.fetchCreditsKeys(k.transfer_public);if(R.has(e))return await this.fetchCreditsKeys(k.transfer_public_as_signer);if(A.has(e))return await this.fetchCreditsKeys(k.transfer_public_to_private);throw new Error("Invalid visibility type")}async joinKeys(){return await this.fetchCreditsKeys(k.join)}async splitKeys(){return await this.fetchCreditsKeys(k.split)}async feePrivateKeys(){return await this.fetchCreditsKeys(k.fee_private)}async feePublicKeys(){return await this.fetchCreditsKeys(k.fee_public)}async getVerifyingKey(e){switch(e){case k.bond_public.verifier:return k.bond_public.verifyingKey();case k.bond_validator.verifier:return k.bond_validator.verifyingKey();case k.claim_unbond_public.verifier:return k.claim_unbond_public.verifyingKey();case k.fee_private.verifier:return k.fee_private.verifyingKey();case k.fee_public.verifier:return k.fee_public.verifyingKey();case k.inclusion.verifier:return k.inclusion.verifyingKey();case k.join.verifier:return k.join.verifyingKey();case k.set_validator_state.verifier:return k.set_validator_state.verifyingKey();case k.split.verifier:return k.split.verifyingKey();case k.transfer_private.verifier:return k.transfer_private.verifyingKey();case k.transfer_private_to_public.verifier:return k.transfer_private_to_public.verifyingKey();case k.transfer_public.verifier:return k.transfer_public.verifyingKey();case k.transfer_public_as_signer.verifier:return k.transfer_public_as_signer.verifyingKey();case k.transfer_public_to_private.verifier:return k.transfer_public_to_private.verifyingKey();case k.unbond_public.verifier:return k.unbond_public.verifyingKey();default:try{const r=await c(e),t=await r.text();return n.pF.fromString(t)}catch(r){try{return n.pF.fromBytes(await this.fetchBytes(e))}catch(e){return new Error("Invalid verifying key. Error: "+e)}}}}unBondPublicKeys(){return this.fetchCreditsKeys(k.unbond_public)}}class y{cacheKey;verifyCreditsKeys;constructor(e,r=!1){this.cacheKey=e,this.verifyCreditsKeys=r}static bondPublicKeyParams(){return new y(k.bond_public.locator,!0)}static bondValidatorKeyParams(){return new y(k.bond_validator.locator,!0)}static claimUnbondPublicKeyParams(){return new y(k.claim_unbond_public.locator,!0)}static feePrivateKeyParams(){return new y(k.fee_private.locator,!0)}static feePublicKeyParams(){return new y(k.fee_public.locator,!0)}static inclusionKeyParams(){return new y(k.inclusion.locator,!0)}static joinKeyParams(){return new y(k.join.locator,!0)}static setValidatorStateKeyParams(){return new y(k.set_validator_state.locator,!0)}static splitKeyParams(){return new y(k.split.locator,!0)}static transferPrivateKeyParams(){return new y(k.transfer_private.locator,!0)}static transferPrivateToPublicKeyParams(){return new y(k.transfer_private_to_public.locator,!0)}static transferPublicKeyParams(){return new y(k.transfer_public.locator,!0)}static transferPublicAsSignerKeyParams(){return new y(k.transfer_public_as_signer.locator,!0)}static transferPublicToPrivateKeyParams(){return new y(k.transfer_public_to_private.locator,!0)}static unbondPublicKeyParams(){return new y(k.unbond_public.locator,!0)}}class d{cache;constructor(){this.cache=new Map}bondPublicKeys(){return this.functionKeys(y.bondPublicKeyParams())}bondValidatorKeys(){return this.functionKeys(y.bondValidatorKeyParams())}cacheKeys(e,r){const[t,i]=r;this.cache.set(e,[t.toBytes(),i.toBytes()])}claimUnbondPublicKeys(){return this.functionKeys(y.claimUnbondPublicKeyParams())}functionKeys(e){return new Promise(((r,t)=>{if(void 0===e)t(new Error("No search parameters provided, cannot retrieve keys"));else{const i=e.cacheKey,a=e.verifyCreditsKeys;if(this.cache.has(i)){const[e,o]=this.cache.get(i),s=n.$7.fromBytes(e),c=n.pF.fromBytes(o);if(a){this.verifyCreditsKeys(i,s,c)||t(new Error(`Cached keys do not match expected keys for ${i}`))}r([s,c])}else t(new Error("Keys not found in cache for "+i))}}))}verifyCreditsKeys(e,r,t){switch(e){case k.bond_public.locator:return r.isBondPublicProver()&&t.isBondPublicVerifier();case k.claim_unbond_public.locator:return r.isClaimUnbondPublicProver()&&t.isClaimUnbondPublicVerifier();case k.fee_private.locator:return r.isFeePrivateProver()&&t.isFeePrivateVerifier();case k.fee_public.locator:return r.isFeePublicProver()&&t.isFeePublicVerifier();case k.inclusion.locator:return r.isInclusionProver()&&t.isInclusionVerifier();case k.join.locator:return r.isJoinProver()&&t.isJoinVerifier();case k.set_validator_state.locator:return r.isSetValidatorStateProver()&&t.isSetValidatorStateVerifier();case k.split.locator:return r.isSplitProver()&&t.isSplitVerifier();case k.transfer_private.locator:return r.isTransferPrivateProver()&&t.isTransferPrivateVerifier();case k.transfer_private_to_public.locator:return r.isTransferPrivateToPublicProver()&&t.isTransferPrivateToPublicVerifier();case k.transfer_public.locator:return r.isTransferPublicProver()&&t.isTransferPublicVerifier();case k.transfer_public_to_private.locator:return r.isTransferPublicToPrivateProver()&&t.isTransferPublicToPrivateVerifier();case k.unbond_public.locator:return r.isUnbondPublicProver()&&t.isUnbondPublicVerifier();default:return!1}}feePrivateKeys(){return this.functionKeys(y.feePrivateKeyParams())}feePublicKeys(){return this.functionKeys(y.feePublicKeyParams())}joinKeys(){return this.functionKeys(y.joinKeyParams())}splitKeys(){return this.functionKeys(y.splitKeyParams())}transferKeys(e){if(S.has(e))return this.functionKeys(y.transferPrivateKeyParams());if(C.has(e))return this.functionKeys(y.transferPrivateToPublicKeyParams());if(B.has(e))return this.functionKeys(y.transferPublicKeyParams());if(R.has(e))return this.functionKeys(y.transferPublicAsSignerKeyParams());if(A.has(e))return this.functionKeys(y.transferPublicToPrivateKeyParams());throw new Error("Invalid visibility type")}async unBondPublicKeys(){return this.functionKeys(y.unbondPublicKeyParams())}insertBondPublicKeys(e){if(!e.isBondPublicProver())throw new Error("Attempted to insert invalid proving keys for bond_public");this.cache.set(k.bond_public.locator,[e.toBytes(),n.pF.bondPublicVerifier().toBytes()])}insertClaimUnbondPublicKeys(e){if(!e.isClaimUnbondPublicProver())throw new Error("Attempted to insert invalid proving keys for claim_unbond_public");this.cache.set(k.claim_unbond_public.locator,[e.toBytes(),n.pF.claimUnbondPublicVerifier().toBytes()])}insertFeePrivateKeys(e){if(!e.isFeePrivateProver())throw new Error("Attempted to insert invalid proving keys for fee_private");this.cache.set(k.fee_private.locator,[e.toBytes(),n.pF.feePrivateVerifier().toBytes()])}insertFeePublicKeys(e){if(!e.isFeePublicProver())throw new Error("Attempted to insert invalid proving keys for fee_public");this.cache.set(k.fee_public.locator,[e.toBytes(),n.pF.feePublicVerifier().toBytes()])}insertJoinKeys(e){if(!e.isJoinProver())throw new Error("Attempted to insert invalid proving keys for join");this.cache.set(k.join.locator,[e.toBytes(),n.pF.joinVerifier().toBytes()])}insertSetValidatorStateKeys(e){if(!e.isSetValidatorStateProver())throw new Error("Attempted to insert invalid proving keys for set_validator_state");this.cache.set(k.set_validator_state.locator,[e.toBytes(),n.pF.setValidatorStateVerifier().toBytes()])}insertSplitKeys(e){if(!e.isSplitProver())throw new Error("Attempted to insert invalid proving keys for split");this.cache.set(k.split.locator,[e.toBytes(),n.pF.splitVerifier().toBytes()])}insertTransferPrivateKeys(e){if(!e.isTransferPrivateProver())throw new Error("Attempted to insert invalid proving keys for transfer_private");this.cache.set(k.transfer_private.locator,[e.toBytes(),n.pF.transferPrivateVerifier().toBytes()])}insertTransferPrivateToPublicKeys(e){if(!e.isTransferPrivateToPublicProver())throw new Error("Attempted to insert invalid proving keys for transfer_private_to_public");this.cache.set(k.transfer_private_to_public.locator,[e.toBytes(),n.pF.transferPrivateToPublicVerifier().toBytes()])}insertTransferPublicKeys(e){if(!e.isTransferPublicProver())throw new Error("Attempted to insert invalid proving keys for transfer_public");this.cache.set(k.transfer_public.locator,[e.toBytes(),n.pF.transferPublicVerifier().toBytes()])}insertTransferPublicToPrivateKeys(e){if(!e.isTransferPublicToPrivateProver())throw new Error("Attempted to insert invalid proving keys for transfer_public_to_private");this.cache.set(k.transfer_public_to_private.locator,[e.toBytes(),n.pF.transferPublicToPrivateVerifier().toBytes()])}insertUnbondPublicKeys(e){if(!e.isUnbondPublicProver())throw new Error("Attempted to insert invalid proving keys for unbond_public");this.cache.set(k.unbond_public.locator,[e.toBytes(),n.pF.unbondPublicVerifier().toBytes()])}}class p{account;networkClient;constructor(e,r){this.account=e,this.networkClient=r}setAccount(e){this.account=e}async findCreditsRecords(e,r,t,i){let n=0,a=0;if(i&&("startHeight"in i&&"number"==typeof i.endHeight&&(n=i.startHeight),"endHeight"in i&&"number"==typeof i.endHeight&&(a=i.endHeight)),0==a){const e=await this.networkClient.getLatestHeight();if(e instanceof Error)throw F("Unable to get current block height from the network");a=e}if(n>=a)throw F("Start height must be less than end height");return await this.networkClient.findUnspentRecords(n,a,this.account.privateKey(),e,void 0,t)}async findCreditsRecord(e,r,t,i){const n=await this.findCreditsRecords([e],r,t,i);return!(n instanceof Error)&&n.length>0?n[0]:(console.error("Record not found with error:",n),new Error("Record not found"))}async findRecord(e,r,t){throw new Error("Method not implemented.")}async findRecords(e,r,t){throw new Error("Method not implemented.")}}class v{startHeight;endHeight;constructor(e,r){this.startHeight=e,this.endHeight=r}}let g=null;const b=()=>{if(!g){const e=new Worker(new URL(t.p+t.u(587),t.b),{type:void 0});g=(0,a.LV)(e)}return g};class w{account;keyProvider;host;networkClient;recordProvider;constructor(e,r,t){this.host=e||"https://api.explorer.aleo.org/v1",this.networkClient=new h(this.host),this.keyProvider=r||new f,this.recordProvider=t}setAccount(e){this.account=e}setKeyProvider(e){this.keyProvider=e}setHost(e){this.host=e,this.networkClient.setHost(e)}setRecordProvider(e){this.recordProvider=e}async deploy(e,r,t,i,a,o){try{const r=n.BP.fromString(e);let t;try{t=await this.networkClient.getProgram(r.id())}catch(e){console.log(`Program ${r.id()} does not exist on the network, deploying...`)}if("string"==typeof t)throw`Program ${r.id()} already exists on the network, please rename your program`}catch(e){throw F(`Error validating program: ${e}`)}let s,c=o;if(void 0===o&&void 0!==this.account&&(c=this.account.privateKey()),void 0===c)throw"No private key provided and no private key set in the ProgramManager";try{a=t?await this.getCreditsRecord(r,[],a,i):void 0}catch(e){throw F(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`)}try{s=t?await this.keyProvider.feePrivateKeys():await this.keyProvider.feePublicKeys()}catch(e){throw F(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`)}const[u,h]=s;let l;try{l=await this.networkClient.getProgramImports(e)}catch(e){throw F(`Error finding program imports. Network response: '${e}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`)}const f=await n.Ao.buildDeploymentTransaction(c,e,r,a,this.host,l,u,h);return await this.networkClient.submitTransaction(f)}async buildExecutionTransaction(e){const{programName:r,functionName:t,fee:i,privateFee:a,inputs:o,recordSearchParams:s,keySearchParams:c,privateKey:u,offlineQuery:h}=e;let l=e.feeRecord,f=e.provingKey,y=e.verifyingKey,d=e.program,p=e.imports;if(void 0===d)try{d=await this.networkClient.getProgram(r)}catch(e){throw F(`Error finding ${r}. Network response: '${e}'. Please ensure you're connected to a valid Aleo network the program is deployed to the network.`)}else d instanceof n.BP&&(d=d.toString());let v,g=u;if(void 0===u&&void 0!==this.account&&(g=this.account.privateKey()),void 0===g)throw"No private key provided and no private key set in the ProgramManager";try{l=a?await this.getCreditsRecord(i,[],l,s):void 0}catch(e){throw F(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`)}try{v=a?await this.keyProvider.feePrivateKeys():await this.keyProvider.feePublicKeys()}catch(e){throw F(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`)}const[b,w]=v;if(!f||!y)try{[f,y]=await this.keyProvider.functionKeys(c)}catch(e){console.log(`Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`)}if(n.BP.fromString(d).getImports().length>0&&!p)try{p=await this.networkClient.getProgramImports(r)}catch(e){throw F(`Error finding program imports. Network response: '${e}'. Please ensure you're connected to a valid Aleo network and the program is deployed to the network.`)}return await n.Ao.buildExecutionTransaction(g,d,t,o,i,l,this.host,p,f,y,b,w,h)}async execute(e){const r=await this.buildExecutionTransaction(e);return await this.networkClient.submitTransaction(r)}async run(e,r,t,i,a,o,s,c,u,h){let l=u;if(void 0===u&&void 0!==this.account&&(l=this.account.privateKey()),void 0===l)throw"No private key provided and no private key set in the ProgramManager";if(!s||!c)try{[s,c]=await this.keyProvider.functionKeys(o)}catch(e){console.log(`Function keys not found. Key finder response: '${e}'. The function keys will be synthesized`)}return console.log("Running program offline"),console.log("Proving key: ",s),console.log("Verifying key: ",c),n.Ao.executeFunctionOffline(l,e,r,t,i,!1,a,s,c,this.host,h)}async join(e,r,t,i,a,o,s,c){let u,h,l=s;if(void 0===s&&void 0!==this.account&&(l=this.account.privateKey()),void 0===l)throw"No private key provided and no private key set in the ProgramManager";try{u=i?await this.keyProvider.feePrivateKeys():await this.keyProvider.feePublicKeys(),h=await this.keyProvider.joinKeys()}catch(e){throw F(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`)}const[f,y]=u,[d,p]=h;try{o=i?await this.getCreditsRecord(t,[],o,a):void 0}catch(e){throw F(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`)}try{e=e instanceof n.ZF?e:n.ZF.fromString(e),r=r instanceof n.ZF?r:n.ZF.fromString(r)}catch(e){throw F("Records provided are not valid. Please ensure they are valid plaintext records.")}const v=await n.Ao.buildJoinTransaction(l,e,r,t,o,this.host,d,p,f,y,c);return await this.networkClient.submitTransaction(v)}async split(e,r,t,i){let a,o=t;if(void 0===o&&void 0!==this.account&&(o=this.account.privateKey()),void 0===o)throw"No private key provided and no private key set in the ProgramManager";try{a=await this.keyProvider.splitKeys()}catch(e){throw F(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`)}const[s,c]=a;try{r=r instanceof n.ZF?r:n.ZF.fromString(r)}catch(e){throw F("Record provided is not valid. Please ensure it is a valid plaintext record.")}const u=await n.Ao.buildSplitTransaction(o,e,r,this.host,s,c,i);return await this.networkClient.submitTransaction(u)}async synthesizeKeys(e,r,t,i){let a,o=i;void 0===o&&(o=void 0!==this.account?this.account.privateKey():new n.ZD);try{a=await this.networkClient.getProgramImports(e);const i=await n.Ao.synthesizeKeyPair(o,e,r,t,a);return[i.provingKey(),i.verifyingKey()]}catch(e){throw F(`Could not synthesize keys - error ${e}. Please ensure the program is valid and the inputs are correct.`)}}async buildTransferTransaction(e,r,t,i,a,o,s,c,u,h){t=P(t);let l,f,y=u;if(void 0===y&&void 0!==this.account&&(y=this.account.privateKey()),void 0===y)throw"No private key provided and no private key set in the ProgramManager";try{l=a?await this.keyProvider.feePrivateKeys():await this.keyProvider.feePublicKeys(),f=await this.keyProvider.transferKeys(t)}catch(e){throw F(`Error finding fee keys. Key finder response: '${e}'. Please ensure your key provider is configured correctly.`)}const[d,p]=l,[v,g]=f;try{const e=[];m(t)?(s=await this.getCreditsRecord(i,[],s,o),e.push(s.nonce())):s=void 0,c=a?await this.getCreditsRecord(i,e,c,o):void 0}catch(e){throw F(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`)}return await n.Ao.buildTransferTransaction(y,e,r,t,s,i,c,this.host,v,g,d,p,h)}async buildTransferPublicTransaction(e,r,t,i,n){return this.buildTransferTransaction(e,r,"public",t,!1,void 0,void 0,void 0,i,n)}async buildTransferPublicAsSignerTransaction(e,r,t,i,n){return this.buildTransferTransaction(e,r,"public",t,!1,void 0,void 0,void 0,i,n)}async transfer(e,r,t,i,n,a,o,s,c,u){const h=await this.buildTransferTransaction(e,r,t,i,n,a,o,s,c,u);return await this.networkClient.submitTransaction(h)}async buildBondPublicTransaction(e,r,t,i,n={}){const a=Math.trunc(1e6*i),{programName:o="credits.aleo",functionName:s="bond_public",fee:c=n.fee||.86,privateFee:u=!1,inputs:h=[e,r,t,`${a.toString()}u64`],keySearchParams:f=new l({proverUri:k.bond_public.prover,verifierUri:k.bond_public.verifier,cacheKey:"credits.aleo/bond_public"}),program:y=this.creditsProgram(),...d}=n,p={programName:o,functionName:s,fee:c,privateFee:u,inputs:h,keySearchParams:f,...d};return await this.buildExecutionTransaction(p)}async bondPublic(e,r,t,i,n={}){const a=await this.buildBondPublicTransaction(e,r,t,i,n);return await this.networkClient.submitTransaction(a)}async buildBondValidatorTransaction(e,r,t,i,n={}){const a=Math.trunc(1e6*t),o=Math.trunc(i),{programName:s="credits.aleo",functionName:c="bond_validator",fee:u=n.fee||.86,privateFee:h=!1,inputs:f=[e,r,`${a.toString()}u64`,`${o.toString()}u8`],keySearchParams:y=new l({proverUri:k.bond_validator.prover,verifierUri:k.bond_validator.verifier,cacheKey:"credits.aleo/bond_validator"}),program:d=this.creditsProgram(),...p}=n,v={programName:s,functionName:c,fee:u,privateFee:h,inputs:f,keySearchParams:y,...p};return await this.buildExecutionTransaction(v)}async bondValidator(e,r,t,i,n={}){const a=await this.buildBondValidatorTransaction(e,r,t,i,n);return await this.networkClient.submitTransaction(a)}async buildUnbondPublicTransaction(e,r,t={}){const i=Math.trunc(1e6*r),{programName:n="credits.aleo",functionName:a="unbond_public",fee:o=t.fee||1.3,privateFee:s=!1,inputs:c=[e,`${i.toString()}u64`],keySearchParams:u=new l({proverUri:k.unbond_public.prover,verifierUri:k.unbond_public.verifier,cacheKey:"credits.aleo/unbond_public"}),program:h=this.creditsProgram(),...f}=t,y={programName:n,functionName:a,fee:o,privateFee:s,inputs:c,keySearchParams:u,...f};return this.buildExecutionTransaction(y)}async unbondPublic(e,r,t={}){const i=await this.buildUnbondPublicTransaction(e,r,t);return await this.networkClient.submitTransaction(i)}async buildClaimUnbondPublicTransaction(e,r={}){const{programName:t="credits.aleo",functionName:i="claim_unbond_public",fee:n=r.fee||2,privateFee:a=!1,inputs:o=[e],keySearchParams:s=new l({proverUri:k.claim_unbond_public.prover,verifierUri:k.claim_unbond_public.verifier,cacheKey:"credits.aleo/claim_unbond_public"}),program:c=this.creditsProgram(),...u}=r,h={programName:t,functionName:i,fee:n,privateFee:a,inputs:o,keySearchParams:s,...u};return await this.buildExecutionTransaction(h)}async claimUnbondPublic(e,r={}){const t=await this.buildClaimUnbondPublicTransaction(e,r);return await this.networkClient.submitTransaction(t)}async buildSetValidatorStateTransaction(e,r={}){const{programName:t="credits.aleo",functionName:i="set_validator_state",fee:n=1,privateFee:a=!1,inputs:o=[e.toString()],keySearchParams:s=new l({proverUri:k.set_validator_state.prover,verifierUri:k.set_validator_state.verifier,cacheKey:"credits.aleo/set_validator_state"}),...c}=r,u={programName:t,functionName:i,fee:n,privateFee:a,inputs:o,keySearchParams:s,...c};return await this.execute(u)}async setValidatorState(e,r={}){const t=await this.buildSetValidatorStateTransaction(e,r);return this.networkClient.submitTransaction(t)}verifyExecution(e){try{const r=e.getExecution(),t=e.getFunctionId(),i=e.getProgram(),a=e.getVerifyingKey();return(0,n.Yc)(r,a,i,t)}catch(e){return console.warn("The execution was not found in the response, cannot verify the execution"),!1}}createProgramFromSource(e){return n.BP.fromString(e)}creditsProgram(){return n.BP.getCreditsProgram()}verifyProgram(e){try{return n.BP.fromString(e),!0}catch(e){return!1}}async getCreditsRecord(e,r,t,i){try{return t instanceof n.ZF?t:n.ZF.fromString(t)}catch(t){try{const t=this.recordProvider;return await t.findCreditsRecord(e,!0,r,i)}catch(e){throw F(`Error finding fee record. Record finder response: '${e}'. Please ensure you're connected to a valid Aleo network and a record with enough balance exists.`)}}}}function m(e){return E.has(e)}function P(e){return T.has(e)?e:F(`Invalid transfer type '${e}'. Valid transfer types are 'private', 'privateToPublic', 'public', and 'publicToPrivate'.`)}const _=n.OS.baseUrl();function K(e){const r=n.pF[e.verifyingKey];if(!r)throw new Error("Invalid method name: "+e.verifyingKey);return{name:e.name,locator:e.locator,prover:e.prover,verifier:e.verifier,verifyingKey:r}}const k={bond_public:K(n.OS.bond_public()),bond_validator:K(n.OS.bond_validator()),claim_unbond_public:K(n.OS.claim_unbond_public()),fee_private:K(n.OS.fee_private()),fee_public:K(n.OS.fee_public()),inclusion:K(n.OS.inclusion()),join:K(n.OS.join()),set_validator_state:K(n.OS.set_validator_state()),split:K(n.OS.split()),transfer_private:K(n.OS.transfer_private()),transfer_private_to_public:K(n.OS.transfer_private_to_public()),transfer_public:K(n.OS.transfer_public()),transfer_public_as_signer:K(n.OS.transfer_public_as_signer()),transfer_public_to_private:K(n.OS.transfer_public_to_private()),unbond_public:K(n.OS.unbond_public()),getKey:function(e){return this.hasOwnProperty(e)?this[e]:new Error(`Key "${e}" not found.`)}},E=new Set(["transfer_private","private","transferPrivate","transfer_private_to_public","privateToPublic","transferPrivateToPublic"]),T=new Set(["transfer_private","private","transferPrivate","transfer_private_to_public","privateToPublic","transferPrivateToPublic","transfer_public","transfer_public_as_signer","public","public_as_signer","transferPublic","transferPublicAsSigner","transfer_public_to_private","publicToPrivate","publicAsSigner","transferPublicToPrivate"]),S=new Set(["private","transfer_private","transferPrivate"]),C=new Set(["private_to_public","privateToPublic","transfer_private_to_public","transferPrivateToPublic"]),B=new Set(["public","transfer_public","transferPublic"]),R=new Set(["public_as_signer","transfer_public_as_signer","transferPublicAsSigner"]),A=new Set(["public_to_private","publicToPrivate","transfer_public_to_private","transferPublicToPrivate"]);function F(e){throw console.error(e),e}async function V(){console.warn("initializeWasm is deprecated, you no longer need to use it")}i()}catch(U){i(U)}}))}}]);
//# sourceMappingURL=876.bundle.js.map