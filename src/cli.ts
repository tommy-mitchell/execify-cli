#!/usr/bin/env ts-node-esm
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import meow from "meow";
import { getFiles, setExecutableBits, fixShebangs } from "./helpers.js";

const cli = meow(`
	Usage
	  $ execify [globs…]

	Options
	  --package, --pkg, -p  Set every binary in package.json as executable
	  --fix-shebang         Convert shebangs to "#!/usr/bin/env node"
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
const { help: helpShortFlag, package: usePackageFlag, fixShebang, all: allFlags } = cli.flags;
const usePackage = usePackageFlag || allFlags;

if ((globs.length === 0 && !usePackage) || helpShortFlag) {
	cli.showHelp(0);
}

const filePaths = await getFiles({ globs, usePackage });

await setExecutableBits(filePaths);

if (fixShebang || allFlags) {
	await fixShebangs(filePaths);
}
