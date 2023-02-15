import Dexie from 'dexie';

var db = new Dexie("AleoParameters");
db.version(1).stores({
    parameters: "name"
});

const FILES = [
  // {
  //   name: 'MintProver',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/mint.prover.11fa6f2'
  // },
  // {
  //   name: 'MintVerifier',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/mint.verifier.e1ae0c8'
  // },
  {
    name: 'TransferProver',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/transfer.prover.837ad21'
  },
  {
    name: 'TransferVerifier',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/transfer.verifier.db46e4c'
  },
  // {
  //   name: 'JoinProver',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/join.prover.369fac2'
  // },
  // {
  //   name: 'JoinVerifier',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/join.verifier.728e514'
  // },
  // {
  //   name: 'SplitProver',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/split.prover.8713930'
  // },
  // {
  //   name: 'SplitVerifier',
  //   url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/split.verifier.b6bb949'
  // },
  {
    name: 'FeeProver',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/fee.prover.0a31a56'
  },
  {
    name: 'FeeVerifier',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/fee.verifier.2186739'
  },
  {
    name: 'InclusionProver',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/inclusion.prover.b9921c5'
  },
  {
    name: 'InclusionVerifier',
    url: 'https://aleo-public.s3.us-west-2.amazonaws.com/testnet3/inclusion.verifier.3f4d6b7'
  }
];

export async function getAllSavedFiles() {
  return await db.table("parameters").toArray();
}

async function downloadFile(url) {
  let response = await fetch(url);
  const reader = response.body.getReader();
  const contentLength = +response.headers.get('Content-Length');

  let receivedLength = 0; // received that many bytes at the moment
  let chunks = []; // array of received binary chunks (comprises the body)
  while(true) {
    const {done, value} = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    receivedLength += value.length;

    if (chunks.length % 50 == 0) {
      console.log(`Received ${receivedLength} of ${contentLength}`);
    }
  }

  // Step 4: concatenate chunks into single Uint8Array
  let chunksAll = new Uint8Array(receivedLength); // (4.1)
  let position = 0;
  for(let chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }
  return chunksAll;
}

export async function downloadAndStoreFiles() {
  const existingFiles = await getAllSavedFiles();
  const fileNames = existingFiles.map(file => file.name);
  const existingFileNames = new Set(fileNames);

  for (let i = 0; i < FILES.length; i++) {
    const { name, url } = FILES[i];
    console.log(`Fetching ${name} parameter file`);

    if (existingFileNames.has(name)) {
      console.log(`${name} already saved...`)
      continue;
    }

    const bytes = await downloadFile(url);
    await db.parameters.put({
      name: name,
      bytes: bytes
    });
  }
}