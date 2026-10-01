#!/usr/bin/env node
import meow from "meow";
import { execify, getBinaries } from "./helpers.ts";

// dprint-ignore
const cli = meow(`
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
`, {
	description: false,
	flags: {
		help: {
			shortFlag: "h",
			type: "boolean",
		},
		package: {
			aliases: ["pkg"],
			shortFlag: "p",
			type: "boolean",
		},
	},
	importMeta: import.meta,
});

const { flags: { package: usePackage }, input } = cli;

if (!usePackage && input.length === 0) {
	cli.showHelp(0);
}

const binaries = await getBinaries({ input, usePackage });
await execify(binaries);
