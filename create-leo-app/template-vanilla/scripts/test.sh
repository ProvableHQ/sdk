yarn
yarn build
npx vite &
PID=$!
npx playwright test
kill -INT $PID