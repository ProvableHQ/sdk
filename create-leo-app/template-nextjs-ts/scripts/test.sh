yarn
yarn build
npm run dev &
PID=$!
npx playwright test
npx playwright show-report
kill -INT $PID