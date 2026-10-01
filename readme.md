# execify-cli

Easily make a Node.js CLI executable.

Sets permissions (`chmod +x`) on given binaries, or optionally on every binary in `package.json`. Cross-platform.

## Install

```sh
npm install --save-dev execify-cli
```

<details>
<summary>Other Package Managers</summary>
<p>

```sh
yarn add --dev execify-cli
```

```sh
pnpm add --save-dev execify-cli
```

</p>
</details>

## Usage

```txt
Usage
  $ execify [paths…]

Options
  --package, --pkg, -p  Set every binary in package.json as executable

Examples
  $ execify dist/cli.js dist/bin.ts dist/foo.cjs
  ✔ Execified "dist/cli.js"
  ℹ "dist/cli.ts" already executable
  ✖ Failed to execify "dist/foo.cjs", file not found

  $ execify --pkg
  ✔ Execified "dist/foo.js" (foo-cli)
  ✔ Execified "dist/bar.js" (bar-cli)
```

## Related

- [chmodx](https://github.com/johnowennixon/chmodx) - A cross platform command line utility for setting the executable bits on files.
- [make-executable](https://github.com/bconnorwhite/make-executable) - Set or remove the executable bits on a file.
