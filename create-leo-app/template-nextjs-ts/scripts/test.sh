yarn
yarn build
npm run dev &
PID=$!
npx playwright test
kill -INT $PID