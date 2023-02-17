 echo "
Downloading parameters. This may take a few minutes..."

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

# Try to run `aleo run`.
$ALEO run || exit

# Remove the foo program.
cd .. && rm -rf foo
