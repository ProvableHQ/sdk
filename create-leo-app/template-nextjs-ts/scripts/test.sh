npm run dev &
PID=$!
npx playwright test
kill -INT $PID