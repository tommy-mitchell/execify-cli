import { $, test, verifyCli } from "./helpers/cli.ts";

for (const flag of ["--help", "-h"]) {
	test(`shows help (${flag})`, async t => {
		const { all: helpText } = await $`${t.context.binPath} ${flag}`;
		t.snapshot(helpText);
	});
}

test.todo("reports results");

for (const flag of ["--package", "--pkg", "-p"]) {
	test.todo(`includes binaries from \`package.json\` and deduplicates (${flag})`);
	test.todo(`errors if no \`package.json\` found (${flag})`);
}
