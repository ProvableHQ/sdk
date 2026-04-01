## Publish instructions

Replace `$VERSION` with the desired new version (e.g. `0.7.0`):

```bash
yarn build:all
npm login
cd packages/provable-core && npm publish --access public
cd ../provable-engine-wasm && npm publish --access public
cd ../provable-engine-react-native && npm publish --access public
cd ../../create-leo-app && npm publish --access public
git tag vX.X.X
git push origin vX.X.X
```