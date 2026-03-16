## Publish instructions

Replace `$VERSION` with the desired new version (e.g. `0.7.0`):

```bash
node scripts/change-version.js $VERSION
yarn build:all
npm login
cd wasm && npm publish --access public
cd ../wasm-account-tools && npm publish --access public
cd ../sdk && npm publish --access public
cd ../sdk-account-tools && npm publish --access public
cd ../create-leo-app && npm publish --access public
cd ..
git tag v$VERSION
git push origin v$VERSION
```