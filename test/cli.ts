import test from "ava";
import { execa } from "execa";
import { getExecutableBinPath } from "get-executable-bin-path";
import { splitStdout, verifyCli } from "./helpers/index.js";

const helpText = splitStdout`
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
`;

test.serial("main", async t => {
	// eslint-disable-next-line unicorn/prevent-abbreviations
	const binPath = await getExecutableBinPath();

	const { exitCode } = await execa(binPath);
	t.is(exitCode, 0);
});

test("help - no arguments", verifyCli, {
	output: helpText,
});

for (const flag of ["--help", "-h"]) {
	test(`help (${flag})`, verifyCli, {
		args: flag,
		output: helpText,
	});
}

test("resolves globs and sets executable", verifyCli, {
	args: "globs/**/*.ts",
	helperCalls: {
		getFiles: {
			callCount: 1,
			args: [{ globs: ["globs/**/*.ts"], usePackage: false }],
		},
		setExecutableBits: 1,
	},
});

for (const flag of ["--package", "--pkg", "-p", "--all"]) {
	test(`usePackage (${flag})`, verifyCli, {
		args: flag,
		helperCalls: {
			getFiles: {
				callCount: 1,
				args: [{ globs: [], usePackage: true }],
			},
		},
	});

	test(`globs with usePackage (${flag})`, verifyCli, {
		args: `${flag} globs/**/*.ts`,
		helperCalls: {
			getFiles: {
				callCount: 1,
				args: [{ globs: ["globs/**/*.ts"], usePackage: true }],
			},
		},
	});
}

for (const flag of ["--fix-shebang", "--all"]) {
	test(`fixShebangs uses getFiles output (${flag})`, verifyCli, {
		args: `${flag} shebang-*/fixture.ts`,
		helperCalls: {
			getFiles: {
				resolves: ["shebang-tsx/fixture.ts", "shebang-ts-node/fixture.ts"],
			},
			fixShebangs: {
				callCount: 1,
				args: [["shebang-tsx/fixture.ts", "shebang-ts-node/fixture.ts"]],
			},
		},
	});
}
