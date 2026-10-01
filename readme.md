# execify-cli

Cross-platform `chmod +x`. Easily make a Node.js CLI executable.

Sets executable permissions on given binaries, or optionally on every binary in the nearest `package.json`.

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
  $ execify foo.js bar.ts baz/xyz.sh
  ✔ Execified "foo.js"
  ⚠ File "foo.js" is missing a shebang!
  ℹ File "bar.ts" is already executable
  ✖ Failed to execify "baz/xyz.sh", file not found

  $ execify --pkg
  ✔ Execified "dist/foo.js" (foo-cli)
  ✔ Execified "dist/bar.js" (bar-cli)
```

## Related

- [chmodx](https://github.com/johnowennixon/chmodx) - A cross platform command line utility for setting the executable bits on files.
- [make-executable](https://github.com/bconnorwhite/make-executable) - Set or remove the executable bits on a file.
