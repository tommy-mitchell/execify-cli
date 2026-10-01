#!/usr/bin/env node
import meow from "meow";
import { execify, getBinaries } from "./helpers.ts";
import { log } from "./utils.ts";

// dprint-ignore
const cli = meow(`
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
const results = await execify(binaries);

for (const { didExecify, error, hasShebang, name, path } of results) {
	const nameSuffix = name ? `(${name})` : "";

	if (error) {
		log.error(`Failed to execify "${path}", ${error}`, nameSuffix);
		continue;
	}

	if (didExecify) {
		log.success(`Execified "${path}"`, nameSuffix);
	} else {
		log.info(`File "${path}" is already executable`, nameSuffix);
	}

	if (!hasShebang) {
		log.warn(`File "${path}" is missing a shebang!`, nameSuffix);
	}
}
