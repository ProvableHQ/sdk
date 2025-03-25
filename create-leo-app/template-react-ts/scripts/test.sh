yarn
yarn build
npm run dev &
PID=$!
npx playwright test --headed
kill -INT $PID