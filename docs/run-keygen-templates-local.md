# Run Keygen Templates Locally (Unpublished Packages)

Use this when `@provablehq/*` packages are **not** on npm yet.

## 1) Build local sdk2 packages first

`yarn build:packages` builds `@provablehq/provable-engine-wasm` before `@provablehq/provablekit`, because provablekit’s TypeScript step resolves the wasm package’s `testnet.js` / `mainnet.js` outputs under `dist/`.

```bash
cd /Users/kp/dev/sdk2
yarn install
yarn build:packages
```

## 2) Run `template-web-keygen`

The web template already points to local package paths in its `package.json`.

```bash
cd /Users/kp/dev/sdk2/create-leo-app/template-web-keygen
npm install
npm run dev
```

Open the local Vite URL shown in terminal (usually `http://localhost:5173`).

---

## 3) Run `template-expo-keygen` (with local sdk2 packages)

`template-expo-keygen` uses local `file:` dependencies for first-party `@provablehq/*`
packages. Native runtime is handled by the in-repo Nitro implementation inside
`@provablehq/provable-engine-react-native`.

```bash
cd /Users/kp/dev/sdk2/create-leo-app/template-expo-keygen
rm -rf node_modules package-lock.json

npm install --legacy-peer-deps
# Clear Metro cache after dependency/path changes.
npx expo start --clear
```

### Expo runtime note

- **Web (`w`)** uses wasm-backed packages.
- **Native iOS/Android** uses Nitro and requires a dev client build.
- **Expo Go is unsupported** for real native keygen (it does not support this native module flow).
- For real native address/private/view key generation, use:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

- For quick smoke test without native runtime, press `w` in Expo terminal (web target).

### iOS `build.db` lock recovery (`xcodebuild` error 65)

If you see:
`unable to attach DB ... DerivedData/ProvableKitExpoKeygen-*/Build/Intermediates.noindex/XCBuildData/build.db: database is locked`

Run:

```bash
pkill -f "expo run:ios|xcodebuild|pod install" || true
rm -rf ~/Library/Developer/Xcode/DerivedData/ProvableKitExpoKeygen-*
cd /Users/kp/dev/sdk2/create-leo-app/template-expo-keygen
export PATH=/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH
npx expo run:ios
```
