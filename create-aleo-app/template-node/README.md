# Aleo + Node.js

`npm start`

Recommend Node.js 20+ for best performance.

Will hang if using more threads than available for your machine. We are working
on automatic thread detection but in the meantime you can manually set threads
with `--threads` flag or in your code with `initThreadPool`.

`npm start -- --threads 1`
