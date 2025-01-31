program emo_ducks.aleo;

record DuckNFT:
    owner as address.private;
    duck_id as field.private;

mapping duck_owners:
    key as field.public;
    value as address.public;

function mint_duck:
    input r0 as field.public;
    cast self.caller r0 into r1 as DuckNFT.record;
    async mint_duck r0 self.caller into r2;
    output r1 as DuckNFT.record;
    output r2 as emo_ducks.aleo/mint_duck.future;

finalize mint_duck:
    input r0 as field.public;
    input r1 as address.public;
    get.or_use duck_owners[r0] aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc into r2;
    assert.eq r2 aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;
    set r1 into duck_owners[r0];
