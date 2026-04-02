# Expo Keygen Template

Minimal Expo React Native demo for `ProvableKit + React Native engine`.

## What it shows

- Explicit initialization via:
  - `ProvableKit.init({ engine: createReactNativeEngine(), env })`
- Button-driven generation of:
  - address
  - private key
  - view key

## Run

```bash
cd /Users/kp/dev/sdk2
yarn install
yarn build:packages

cd /Users/kp/dev/sdk2/create-leo-app/template-expo-keygen
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npx expo start --clear
```

Then press:

- `i` for iOS simulator
- `a` for Android emulator

Notes:

- This template uses local `file:` dependencies for `@provablehq/*`.
- Web runtime uses wasm-backed packages.
- Native runtime uses first-party Nitro in `@provablehq/provable-engine-react-native` plus `react-native-nitro-modules`.
- Expo Go is unsupported for native keygen; use a dev client (`expo prebuild` + `expo run:*`).
- `metro.config.js` enables symlink resolution for those workspace packages.
- For real native keygen values, run a dev client (`npx expo prebuild` + `npx expo run:ios` or `npx expo run:android`).

## iOS lock recovery

If `npx expo run:ios` fails with `build.db` lock / `xcodebuild` error 65:

```bash
pkill -f "expo run:ios|xcodebuild|pod install" || true
rm -rf ~/Library/Developer/Xcode/DerivedData/ProvableKitExpoKeygen-*
export PATH=/opt/homebrew/lib/ruby/gems/3.3.0/bin:$PATH
npx expo run:ios
```
