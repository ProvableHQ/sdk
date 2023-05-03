[View code on GitHub](https://github.com/AleoHQ/aleo/.autodoc/docs/json/sdk)

The `.autodoc/docs/json/sdk` folder contains configuration files and documentation for the Aleo project, which provides high-level utilities in JavaScript for handling Accounts, Records, and Node connections in the browser. The configuration files include settings for Jest testing framework, JSDoc documentation generator, and TypeScript compiler.

For example, the `jest-config.json` file sets up Jest to work with TypeScript and JavaScript files in the Aleo project, using the `ts-jest` transformer to compile the code before running tests. It also defines the naming conventions and file extensions for test files, allowing developers to organize their tests in a consistent manner.

```json
{
  "transform": {
    "^.+\\.(t|j)sx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"]
}
```

The `jsdoc.json` file configures the JSDoc documentation generator for the Aleo project, specifying the source files to be included, the tags to be allowed, the plugins to be used, and various options for the output documentation.

```json
{
  "source": {
    "include": ["src/account.ts", "src/aleo_network_client.ts", "src/development_client.ts"],
    "includePattern": ".+\\.ts(doc)?$"
  },
  "tags": {
    "allowUnknownTags": ["optional"]
  },
  "plugins": ["better-docs/typescript"],
  "opts": {
    "encoding": "utf8",
    "readme": "./README.md",
    "destination": "docs/",
    "recurse": true,
    "verbose": true,
    "template": "clean-jsdoc-theme",
    "theme_opts": {
      "default_theme": "dark",
      "static_dir": "static",
      "homepage_title": "Aleo SDK"
    }
  },
  "markdown": {
    "hardwrap": false,
    "idInHeadings": true
  }
}
```

The `tsconfig.json` file provides a set of compiler options and rules for the TypeScript compiler to follow when transpiling the TypeScript code into JavaScript, ensuring consistency and correct behavior across the project.

```json
{
  "include": ["src"],
  "exclude": ["node_modules", "tests"],
  "compilerOptions": {
    "module": "esnext",
    "lib": ["dom", "esnext"],
    "importHelpers": true,
    "declaration": true,
    "sourceMap": true,
    "rootDir": "./src",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

The `docs` subfolder contains documentation and code for the Aleo project, organized into three main classes: `Account`, `AleoNetworkClient`, and `DevelopmentClient`. These classes offer methods for managing accounts, interacting with the Aleo blockchain, and deploying and executing programs on the Aleo network.

```javascript
const account = Account.fromCiphertext(privateKeyCiphertext);
const aleoClient = new AleoNetworkClient();
const latestBlock = await aleoClient.getLatestBlock();
const devClient = new DevelopmentClient();
devClient.deployProgram(programSourceCode);
```

In summary, the `.autodoc/docs/json/sdk` folder provides essential configuration files and documentation for the Aleo project, enabling developers to manage accounts, interact with the Aleo blockchain, and deploy and execute programs on the Aleo network. These tools work together with other parts of the project to provide a seamless development experience.
