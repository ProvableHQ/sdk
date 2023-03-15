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

# Try to run `aleo execute`
$ALEO aleo execute hello.aleo main 4u32 5u32 -c ciphertext1qvqgkey2cxklg4g5qjn4h3alvx2z33dwga380ma2fajz2kjxqjpmqyd79h6lr6ck8rgwkr9ekvh2phws6j5njsu6jz9tkk09hd3w2p5vzyc8ppprvj49nnaf7c9hhvq5vsltpjx48zlmlps6mg6xu0sef0xpz4ccrdc --password password
$ALEO execute credits.aleo mint aleo196s3phrm295gsnkp64zpfjdefjk4fx0n3tl9xzjn4kjf038swg8qvamf5v 1000000u64 -c ciphertext1qvqgkey2cxklg4g5qjnkhyn9ed6whjlxtqr4txpmp0ws7sxglsmt2zws9ey2s7eq2xk5jz9kkvh2phws6j5njsu6zqvdzs4uq9qkmm4tpntfyztfgg45glltweu2cue38hqulwg8a9e9eps6mg6xu0sef0xpz4ca4x7 --password password -e http://localhost:3030
# Remove the foo program.
cd .. && rm -rf foo
