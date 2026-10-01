import dedent from "dedent";
import { $, test, verifyCli } from "./helpers/cli.ts";

test("shows help if no input", async t => {
	const { all: helpText } = await $`${t.context.binPath}`;
	t.snapshot(helpText);
});

for (const flag of ["--help", "-h"]) {
	test(`shows help (${flag})`, async t => {
		const { all: helpText } = await $`${t.context.binPath} ${flag}`;
		t.snapshot(helpText);
	});
}

const fixtures = "executable.ts non-executable.js nested/executable.sh nested/non-executable.sh non-existent.py";

test("reports results", verifyCli, {
	args: fixtures,
	expected: dedent`
		ℹ File "executable.ts" is already executable
		⚠ File "executable.ts" is missing a shebang!
		✔ Execified "non-executable.js"
		ℹ File "nested/executable.sh" is already executable
		✔ Execified "nested/non-executable.sh"
		⚠ File "nested/non-executable.sh" is missing a shebang!
		✖ Failed to execify "non-existent.py", file not found
	`,
	fixture: "binaries",
});

for (const flag of ["--package", "--pkg", "-p"]) {
	test(`includes binaries from \`package.json\` and deduplicates (${flag})`, verifyCli, {
		args: `${fixtures} ${flag}`,
		expected: dedent`
			ℹ File "./executable.ts" is already executable (bar-cli)
			⚠ File "./executable.ts" is missing a shebang! (bar-cli)
			✔ Execified "./nested/non-executable.sh" (baz-cli)
			⚠ File "./nested/non-executable.sh" is missing a shebang! (baz-cli)
			✔ Execified "non-executable.js"
			ℹ File "nested/executable.sh" is already executable
			✖ Failed to execify "non-existent.py", file not found
		`,
		fixture: "binaries",
	});

	test(`resolves paths if \`package.json\` not in cwd (${flag})`, verifyCli, {
		args: flag,
		cwd: "foo/bar",
		expected: dedent`
			✔ Execified "./bar/cli.js" (bar-cli)
		`,
		fixture: "package-nested",
	});

	test(`errors if no \`package.json\` found (${flag})`, verifyCli, {
		args: flag,
		error: dedent`
			✖ No package.json found.
		`,
		fixture: "package-none",
	});
}
