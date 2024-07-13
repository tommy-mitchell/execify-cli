#!/usr/bin/env tsimp
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import meow from "meow";
import { NODE_SHEBANG } from "./constants.js";
import { fixShebangs, getFiles, setExecutableBits } from "./helpers.js";

// dprint-ignore
const cli = meow(`
	Usage
	  $ execify [globs…]

	Options
	  --package, --pkg, -p  Set every binary in package.json as executable
	  --fix-shebang         Convert shebangs to "${NODE_SHEBANG}"
	  --all                 Set all flags

	Examples
	  $ execify cli.js

	  $ execify --pkg test/fixtures/**/cli.js

	  $ execify --fix-shebang dist/ts-cli.js
`, {
	importMeta: import.meta,
	description: false,
	flags: {
		help: {
			type: "boolean",
			shortFlag: "h",
		},
		package: {
			type: "boolean",
			shortFlag: "p",
			aliases: ["pkg"],
		},
		fixShebang: {
			type: "boolean",
		},
		all: {
			type: "boolean",
		},
	},
});

const globs = cli.input;
const usePackage = cli.flags.package || cli.flags.all;
const fixShebang = cli.flags.fixShebang || cli.flags.all;

if (globs.length === 0 && !usePackage) {
	cli.showHelp(0);
}

const filePaths = await getFiles({ globs, usePackage });

await setExecutableBits(filePaths);

if (fixShebang) {
	await fixShebangs(filePaths);
}
