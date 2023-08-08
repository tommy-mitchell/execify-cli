# execify-cli

Easily make a Node.js CLI executable. Sets permissions (`chmod +x`) and handles common TypeScript conversions. See [Roadmap](#roadmap) for more details.

## Install

```sh
npm install --save-dev execify-cli
```

<details>
<summary>Other Package Managers</summary>

```sh
yarn add --dev execify-cli
```
</details>

## Usage

```
Usage
  $ execify [globs…]

Options
  --package, --pkg, -p  Set every binary in package.json as executable
  --fix-shebang         Convert shebangs to "#!/usr/bin/env node"

Examples
  $ execify cli.js

  $ execify --pkg test/fixtures/**/cli.js

  $ execify --fix-shebang dist/ts-cli.js
```

## Roadmap

v0.1.0 is a minimal release. The following features were cut and will be added in the next minor version:

- TypeScript import path mapping from `tsconfig.json` `paths` option
- A flag to fix all TypeScript-related conversions
- Logging of completed/failed files, improved error handling

## Related

- [chmodx](https://github.com/johnowennixon/chmodx)
- [ts-fix-shebang](https://github.com/johnowennixon/ts-fix-shebang)
- [make-executable](https://github.com/bconnorwhite/make-executable)
- [replace-in-files-cli](https://github.com/sindresorhus/replace-in-files-cli)
- [tsconfig-replace-paths](https://github.com/jonkwheeler/tsconfig-replace-paths)
