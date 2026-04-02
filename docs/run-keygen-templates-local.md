# Run Keygen Templates Locally (Unpublished Packages)

Use this when `@provablehq/*` packages are **not** on npm yet.

## 1) Build local sdk2 packages first

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

`template-expo-keygen` still has npm versions in `package.json`, so replace them with local `file:` deps before install:

```bash
cd /Users/kp/dev/sdk2/create-leo-app/template-expo-keygen
rm -rf node_modules package-lock.json

npm pkg set dependencies.@provablehq/provablekit="file:/Users/kp/dev/sdk2/packages/provable-core"
npm pkg set dependencies.@provablehq/provable-engine-react-native="file:/Users/kp/dev/sdk2/packages/provable-engine-react-native"
npm pkg set dependencies.@provablehq/provable-engine-wasm="file:/Users/kp/dev/sdk2/packages/provable-engine-wasm"

npm install --legacy-peer-deps
npx expo start --clear
```

### Expo runtime note

- **Expo Go (iOS/Android app)** does not support Nitro modules.
- For mobile device/simulator native runtime, use a dev client:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

- For quick smoke test without native runtime, press `w` in Expo terminal (web target).
