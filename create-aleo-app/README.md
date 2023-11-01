# create-aleo-app

## Scaffolding Your First Aleo Project

> **Compatibility Note:**
> [Node.js](https://nodejs.org/en/) version 18+

With NPM:

```bash
npm create aleo-app@latest
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold an Aleo + React project, run:

```bash
# npm 6.x
npm create aleo-app@latest my-aleo-app --template react

# npm 7+, extra double-dash is needed:
npm create aleo-app@latest my-aleo-app -- --template react
```

Currently supported template presets include:

- `vanilla`
- `react-leo`
- `node`
- `nextjs-ts`

You can use `.` for the project name to scaffold in the current directory.

## More Information

Based off of create-vite: https://github.com/vitejs/vite/tree/main/packages/create-vite
