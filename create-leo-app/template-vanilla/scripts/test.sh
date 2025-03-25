yarn
yarn build
npx vite &
PID=$!
npx playwright test --headed
kill -INT $PID