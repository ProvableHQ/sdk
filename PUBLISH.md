## Building the SDK for an npm release


### Building a standard release.
When building a release in which the underlying SnarkVM version is the same for both testnet and mainnet, this build 
flow is used.

First, replace `$VERSION` with the desired new version on the mainnet branch (e.g. `0.9.18`), then use the following
commands.

```bash
yarn build:all
npm login
cd wasm && npm publish --access public
cd ../sdk && npm publish --access public
cd ../create-leo-app & npm publish --access public
git tag vX.X.X
git push origin vX.X.X
gh release create "$(git describe --tags --abbrev=0)" --generate-notes
```

### Building a release in which the SnarkVM version is ahead of testnet.
The wasm package contains two JS binaries, one for testnet and one for mainnet. When the Aleo testnet and mainnet 
networks are operating on the same SnarkVM binaries `yarn build:all` is the correct command to build the SDK's binaries.

However, in the case where the Aleo network releases a testnet version that is ahead of mainnet, the testnet version 
must be built separately. The following build flow is used to publish the SDK. Once all needed changes are integrated
for Aleo testnet, this should be merged to the testnet branch of the SDK and the following build process should be
followed.

First, replace `$VERSION` with the desired new version on the mainnet and testnet branches (e.g. `0.9.18`), then use 
the following commands.

```bash
## Create a tempdir to store the testnet wasm build.
mkdir tmp
## Switch to testnet.
git switch testnet
## Build the wasm version of testnet and store it in a tempdir.
yarn build:wasm
mv wasm/dist/testnet tmp/testnet
## Switch to mainnet.
git switch mainnet
## Build the wasm package.
yarn build:wasm
## Remove the testnet build.
rm -r wasm/dist/testnet
## Move the previously built testnet version into the wasm/dist folder and remove the tmp folder.
mv tmp/testnet wasm/dist/testnet
rmdir tmp
## Continue building the SDK and create-leo-app binaries.
yarn build:sdk && yarn build:create-leo-app
## Continue the previous NPM publishing flow.
npm login
cd wasm && npm publish --access public
cd ../sdk && npm publish --access public
cd ../create-leo-app & npm publish --access public
git tag vX.X.X
git push origin vX.X.X
gh release create "$(git describe --tags --abbrev=0)" --generate-notes
```