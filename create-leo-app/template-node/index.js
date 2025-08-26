import {Account, initThreadPool, ProgramManager, AleoKeyProvider, AleoKeyProviderParams, AleoNetworkClient, NetworkRecordProvider, RecordCiphertext, OfflineQuery} from "@provablehq/sdk/testnet.js";

const record_1 = `{
  owner: aleo1kypwp5m7qtk9mwazgcpg0tq8aal23mnrvwfvug65qgcg9xvsrqgspyjm6n.private,
  microcredits: 100u64.private,
  _nonce: 3765111906416635824444297313241625769469713112399216736159521202262870833984group.public,
  _version: 1u8.public
}`;

const record_2 = `{
  owner: aleo1kypwp5m7qtk9mwazgcpg0tq8aal23mnrvwfvug65qgcg9xvsrqgspyjm6n.private,
  microcredits: 100000u64.private,
  _nonce: 8172356637347139377387039213013979708969748413728827288623446573036989389332group.public,
  _version: 1u8.public
}`;

const PROGRAM = `
program hello_vote.aleo;

struct ProposalInfo:
    title as field;
    content as field;
    proposer as address;

record Proposal:
    owner as address.private;
    id as field.private;
    info as ProposalInfo.private;

record Ticket:
    owner as address.private;
    pid as field.private;

mapping proposals:
    key as field.public;
    value as ProposalInfo.public;

mapping tickets:
    key as field.public;
    value as u64.public;

mapping agree_votes:
    key as field.public;
    value as u64.public;

mapping disagree_votes:
    key as field.public;
    value as u64.public;

function propose:
    input r0 as ProposalInfo.public;
    assert.eq self.caller r0.proposer;
    hash.bhp256 r0.title into r1 as field;
    cast self.caller r1 r0 into r2 as Proposal.record;
    async propose r1 r0 into r3;
    output r2 as Proposal.record;
    output r3 as hello_vote.aleo/propose.future;

finalize propose:
    input r0 as field.public;
    input r1 as ProposalInfo.public;
    set 0u64 into tickets[r0];
    set r1 into proposals[r0];

function new_ticket:
    input r0 as field.public;
    input r1 as address.public;
    cast r1 r0 into r2 as Ticket.record;
    async new_ticket r0 into r3;
    output r2 as Ticket.record;
    output r3 as hello_vote.aleo/new_ticket.future;

finalize new_ticket:
    input r0 as field.public;
    get.or_use tickets[r0] 0u64 into r1;
    add r1 1u64 into r2;
    set r2 into tickets[r0];

function agree:
    input r0 as Ticket.record;
    async agree r0.pid into r1;
    output r1 as hello_vote.aleo/agree.future;

finalize agree:
    input r0 as field.public;
    contains proposals[r0] into r1;
    assert.eq r1 true;
    get.or_use agree_votes[r0] 0u64 into r2;
    add r2 1u64 into r3;
    set r3 into agree_votes[r0];

function disagree:
    input r0 as Ticket.record;
    async disagree r0.pid into r1;
    output r1 as hello_vote.aleo/disagree.future;

finalize disagree:
    input r0 as field.public;
    get.or_use disagree_votes[r0] 0u64 into r1;
    add r1 1u64 into r2;
    set r2 into disagree_votes[r0];

constructor:
    assert.eq program_owner aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px;
`

await initThreadPool();

async function test1() {
    const account = new Account({privateKey: "APrivateKey1zkpAx36BFPfPpAJ6jGhorCJfwTM9jCGozxZ4UmjrzLW3Y9d"});

    const receiver_address = "aleo1pgf36pwfc9tvs2ec7xjnjdwlls3x7sk5e8rsezan5r6v0kp2dvgq45hgpx";

    const networkClient = new AleoNetworkClient("https://api.explorer.provable.com/v1", undefined, account);
    const keyProvider = new AleoKeyProvider();
    const recordProvider = new NetworkRecordProvider(account, networkClient);

    keyProvider.useCache = true;


    const public_balance = await networkClient.getProgramMappingValue("credits.aleo", "account", account.address().to_string());
    console.log('public balance:', public_balance);

    const programManager0 = new ProgramManager("https://api.explorer.provable.com/v1", keyProvider, recordProvider);
    programManager0.setAccount(account);

    const tx_id_1 = await programManager0.transfer(.0001, receiver_address, "private", 0, false, undefined, record_1, undefined, account._privateKey);

    console.log('tx_id_1', tx_id_1);

    
}

const start = Date.now();
console.log("Starting execute!");
await test1();
console.log("Execute finished!", Date.now() - start);

