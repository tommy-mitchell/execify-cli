#!/usr/bin/env ts-node-esm
import meow from "meow";
import { getFiles, setExecutableBits, fixShebangs } from "./helpers.js";

const cli = meow(`
	Usage
	  $ execify [globs…]

	Options
	  --package, --pkg, -p  Set every binary in package.json as executable
	  --fix-shebang         Convert shebangs to "#!/usr/bin/env node"

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
	},
});

const { input: globs, flags: { help: helpShortFlag, package: usePackage } } = cli;

if ((globs.length === 0 && !usePackage) || helpShortFlag) {
	cli.showHelp(0);
}

const filePaths = await getFiles({ globs, usePackage });

await setExecutableBits(filePaths);

if (cli.flags.fixShebang) {
	await fixShebangs(filePaths);
}
