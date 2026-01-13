## Publish instructions

The SDK NPM package should contain binaries which work on both the latest `mainnet` and `testnet` releases.

### Building
By default yarn will build binaries for both networks. In case testnet contains a deep breaking change (e.g. deprecation of the old proof system or transaction structure), we'll need to replace the mainnet binaries manually.

```bash
yarn build:all
```

### Deploying
Set `SDK_TAG` to the desired new version (e.g. `v0.7.0`):

```bash
npm login
npm deploy:wasm
npm deploy:sdk
npm deploy:create-leo-app
git tag ${SDK_TAG}
git push origin ${SDK_TAG}
```

If gh cli is installed, otherwise, create the release manually.
```bash
gh release create ${SDK_TAG} --notes-from-tag
```
