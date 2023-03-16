# Test `aleo execute`
# Ensure execute runs and does not search for a record when a record is specified for the fee
$ALEO execute hello.aleo main 4u32 5u32 -c ciphertext1qvqgkey2cxklg4g5qjn4h3alvx2z33dwga380ma2fajz2kjxqjpmqyd79h6lr6ck8rgwkr9ekvh2phws6j5njsu6jz9tkk09hd3w2p5vzyc8ppprvj49nnaf7c9hhvq5vsltpjx48zlmlps6mg6xu0sef0xpz4ccrdc --password password -r "{ owner: aleo18x0yenrkceapvt85e6aqw2v8hq37hpt4ew6k6cgum6xlpmaxt5xqwnkuja.private, gates: 1099999999999864u64.private, _nonce: 3859911413360468505092363429199432421222291175370483298628506550397056121761group.public }" --fee 0.005 || exit
# Ensure execute runs successfully with a private key ciphertext and password
$ALEO execute hello.aleo main 4u32 5u32 -c ciphertext1qvqgkey2cxklg4g5qjn4h3alvx2z33dwga380ma2fajz2kjxqjpmqyd79h6lr6ck8rgwkr9ekvh2phws6j5njsu6jz9tkk09hd3w2p5vzyc8ppprvj49nnaf7c9hhvq5vsltpjx48zlmlps6mg6xu0sef0xpz4ccrdc --password password || exit
# Ensure execute runs successfully with a private key
$ALEO execute hello.aleo main 4u32 5u32 -k APrivateKey1zkp8ofTUBgVXF1wn83AZNYyWBJUowHtAAmWAXk1ck5kKiXw || exit

# Test `aleo new, build, and run` to ensure that the universal parameters are downloaded correctly
echo "Downloading parameters. This may take a few minutes..."

# Create a new foo Leo project.
$ALEO new foo || exit
cd foo || exit

# Attempt to compile the foo program until it passes.
# This is necessary to ensure that the universal parameters are downloaded.
declare -i DONE

DONE=1

while [ $DONE -ne 0 ]
do
$ALEO build
DONE=$?
sleep 0.5
done

# Try to run `aleo run`
$ALEO run hello 1u32 2u32 || exit

# Remove the foo program.
cd .. && rm -rf foo
