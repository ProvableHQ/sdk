# create-leo-app

## Scaffolding Your First Aleo Project

> **Compatibility Note:**
> Please use [Node.js](https://nodejs.org/en/) version 18+

With NPM:

```bash
npm create leo-app@latest
```

Then follow the prompts!

You can also directly specify the project name you want to use via additional command line options. For example, to scaffold a Leo project, run:

```bash
# npm 6.x
npm create leo-app@latest my-leo-app

# npm 7+, extra double-dash is needed:
npm create leo-app@latest my-leo-app
```

Currently supported template presets include:

- `Vanilla`
- `React (JavaScript + Leo, React + TypeScript, or TypeScript + Next.js)`
- `Node.js`

You can use `.` for the project name to scaffold in the current directory.

## More Information

Based off of create-vite: https://github.com/vitejs/vite/tree/main/packages/create-vite
