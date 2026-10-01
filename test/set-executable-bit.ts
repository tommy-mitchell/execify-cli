/* eslint-disable unicorn/consistent-boolean-name -- test file */
import test from "ava";
import { isExecutable } from "is-executable";
import { setExecutableBit } from "../src/utils.ts";
import { withFixture } from "./helpers/util.ts";

test("sets bitmask", async t => {
	const { fixture } = await withFixture(t, "non-executable.js");
	t.false(await isExecutable(fixture), "Fixture should not be executable!");

	const result = await setExecutableBit(fixture);
	t.true(result, "setExecutableBit should return true!");
	t.true(await isExecutable(fixture), "Fixture should be executable!");
});

test("does nothing if already executable", async t => {
	const { $, fixture } = await withFixture(t, "executable.js");

	await $`chmod +x ${fixture}`;
	t.true(await isExecutable(fixture), "Fixture should be executable!");

	const result = await setExecutableBit(fixture);
	t.false(result, "setExecutableBit should return false!");
});

test("does not handle file system errors", async t => {
	await t.throwsAsync(
		async () => setExecutableBit("NON-EXISTENT-FILE"),
		{ code: "ENOENT", instanceOf: Error },
	);
});
