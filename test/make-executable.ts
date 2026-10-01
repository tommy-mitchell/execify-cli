/* eslint-disable unicorn/consistent-boolean-name -- test file */
import test from "ava";
import { isExecutable } from "is-executable";
import { makeExecutable } from "#src/utils.ts"; // TODO[engine:node@>=24.14]: use #/
import { withFixture } from "./helpers/util.ts";

test("sets bitmask", async t => {
	const fixture = await withFixture(t, "non-executable.js");
	t.false(await isExecutable(fixture), "Fixture should not be executable!");

	const result = await makeExecutable(fixture);
	t.true(result, "Should have made fixture executable!");
	t.true(await isExecutable(fixture), "Fixture should be executable!");
});

test("does nothing if already executable", async t => {
	const fixture = await withFixture(t, "executable.js");
	t.true(await isExecutable(fixture), "Fixture should be executable!");

	const result = await makeExecutable(fixture);
	t.false(result, "Should not have changed fixture executable status!");
});

test("does not handle file system errors", async t => {
	await t.throwsAsync(
		async () => makeExecutable("NON-EXISTENT-FILE"),
		{ code: "ENOENT", instanceOf: Error },
	);
});
