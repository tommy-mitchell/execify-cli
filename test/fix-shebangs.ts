import path from "node:path";
import { promises as fs } from "node:fs";
import test from "ava";
import { temporaryDirectory } from "tempy";
import { copyFile } from "cp-file";
import pMap from "p-map";
import esmock from "esmock";
import * as tt from "testtriple";
import { atFixture } from "./_test-helpers/util.js";

type VerifyShebangsArguments = {
	fixtures: string[];
	writeCount?: number;
};

const verifyShebangs = test.macro(async (t, { fixtures, writeCount = fixtures.length }: VerifyShebangsArguments) => {
	const temporaryDir = temporaryDirectory();

	// Map and copy fixtures to temporary files
	const fixturePaths = fixtures.map(fixture => (
		path.join(temporaryDir, `${fixture}-fixture.ts`)
	));

	await pMap(fixtures, async fixture => copyFile(
		path.join(atFixture(fixture), "fixture.ts"),
		path.join(temporaryDir, `${fixture}-fixture.ts`),
	));

	const spy = tt.spy(fs.writeFile);

	const { fixShebangs } = await esmock("../src/helpers.ts", {
		"node:fs": { promises: { ...fs, writeFile: spy } }, // eslint-disable-line @typescript-eslint/naming-convention
	}) as typeof import("../src/helpers.js"); // eslint-disable-line @typescript-eslint/consistent-type-imports

	// Fix and verify temporary files
	await fixShebangs(fixturePaths);

	await pMap(fixturePaths, async fixture => {
		const output = await fs.readFile(fixture, "utf8");
		const firstLine = output.split("\n")[0]!;

		if (fixture.includes("no-shebang")) {
			t.notRegex(firstLine, /#!.*/, "Included shebang!");
		} else {
			t.is(firstLine, "#!/usr/bin/env node");
		}
	});

	const spyCallCount = tt.callsOf(spy).length;
	t.is(spyCallCount, writeCount);
});

test("one file", verifyShebangs, {
	fixtures: ["shebang-tsx"],
});

test("multiple files", verifyShebangs, {
	fixtures: ["shebang-tsx"],
});

test("ts-node shebang", verifyShebangs, {
	fixtures: ["shebang-ts-node"],
});

test("no shebang - does not write to file", verifyShebangs, {
	fixtures: ["no-shebang"],
	writeCount: 0,
});

test("some shebang, some not", verifyShebangs, {
	fixtures: ["shebang-tsx", "shebang-ts-node", "no-shebang"],
	writeCount: 2,
});
