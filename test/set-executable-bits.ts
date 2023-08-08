import path from "node:path";
import { promises as fs } from "node:fs";
import test from "ava";
import { temporaryDirectory } from "tempy";
import { isExecutable } from "is-executable";
import esmock from "esmock";
import * as tt from "testtriple";
import { $ } from "execa";
import { setExecutableBits } from "../src/helpers.js";

test("one file", async t => {
	const temporaryDir = temporaryDirectory();
	const fixture = path.join(temporaryDir, "cli.js");

	await fs.writeFile(fixture, "#!/usr/bin/env node", "utf8");
	t.false(await isExecutable(fixture));

	await setExecutableBits([fixture]);
	t.true(await isExecutable(fixture));
});

test("multiple files", async t => {
	const temporaryDir = temporaryDirectory();
	const fixtures = [
		path.join(temporaryDir, "cli-1.js"),
		path.join(temporaryDir, "cli-2.js"),
		path.join(temporaryDir, "cli-3.js"),
	];

	await Promise.all(fixtures.map(async (fixture) => {
		await fs.writeFile(fixture, "#!/usr/bin/env node", "utf8");
		t.false(await isExecutable(fixture));
	}));

	await setExecutableBits(fixtures);

	await Promise.all(fixtures.map(async (fixture) => {
		t.true(await isExecutable(fixture));
	}));
});

test("already executable", async t => {
	const temporaryDir = temporaryDirectory();
	const $$ = $({ cwd: temporaryDir });

	const fixtures = [
		path.join(temporaryDir, "cli-1.js"),
		path.join(temporaryDir, "cli-2.js"),
		path.join(temporaryDir, "cli-3.js"),
	];

	await Promise.all(fixtures.map(async (fixture) => {
		await fs.writeFile(fixture, "#!/usr/bin/env node", "utf8");
		await $$`chmod +x ${fixture}`;

		t.true(await isExecutable(fixture));
	}));

	/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/consistent-type-imports */
	const spy = tt.spy();

	const { setExecutableBits } = await esmock("../src/helpers.ts", import.meta.url, {
		"node:fs": { promises: { ...fs, chmod: spy } },
	}) as typeof import("../src/helpers.js");
	/* eslint-enable */

	await setExecutableBits(fixtures);

	// Verify fs/promises.chmod was not called -> fixture was already executable
	await Promise.all(fixtures.map(async (fixture) => {
		t.true(await isExecutable(fixture));

		const spyCalled = tt.callsOf(spy).length > 0;
		t.false(spyCalled, "fs/promises.chmod was called!");
	}));
});
