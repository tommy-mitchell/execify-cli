import test from "ava";
import { getBinPath } from "get-bin-path";
import { $ } from "execa";
import { isExecutable } from "is-executable";
import { splitStdout, verifyCli } from "./_test-helpers/index.js";

const helpText = splitStdout`
	Usage
	  $ execify [globs…]

	Options
	  --package, --pkg, -p  Set every binary in package.json as executable
	  --fix-shebang         Convert shebangs to "#!/usr/bin/env node"

	Examples
	  $ execify cli.js

	  $ execify --pkg test/fixtures/**/cli.js

	  $ execify --fix-shebang dist/ts-cli.js
`;

test.serial("main", async t => {
	let binPath = await getBinPath();
	t.truthy(binPath, "No bin path found!");

	binPath = binPath!.replace("dist", "src").replace(".js", ".ts");
	t.true(await isExecutable(binPath), "Source binary not executable!");

	const { exitCode } = await $`${binPath}`;
	t.is(exitCode, 0);
});

test("help - no arguments", verifyCli, {
	output: helpText,
});

test("help - --help flag", verifyCli, {
	args: "--help",
	output: helpText,
});

test("help - -h short flag", verifyCli, {
	args: "-h",
	output: helpText,
});

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

for (const flag of ["--package", "--pkg", "-p"]) {
	test(`usePackage - ${flag} flag`, verifyCli, {
		args: flag,
		helperCalls: {
			getFiles: {
				callCount: 1,
				args: [{ globs: [], usePackage: true }],
			},
		},
	});

	test(`globs with usePackage - ${flag} flag`, verifyCli, {
		args: `${flag} globs/**/*.ts`,
		helperCalls: {
			getFiles: {
				callCount: 1,
				args: [{ globs: ["globs/**/*.ts"], usePackage: true }],
			},
		},
	});
}

test("fixShebangs uses getFiles output", verifyCli, {
	args: "--fix-shebang shebang-*/fixture.ts",
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
