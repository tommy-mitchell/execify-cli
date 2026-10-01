import nodePath from "node:path";
import test from "ava";
import * as tq from "test-quadruple";
import type { Binary } from "#/utils.ts";
import { withFixture } from "./helpers/util.ts";

const withCwd = async (cwd: string) => (
	tq.replace<typeof import("../src/utils.js")>({
		globalMocks: {
			"node:process": { cwd: () => cwd },
		},
		importMeta: import.meta,
		modulePath: "../src/utils.js",
	})
);

type MacroArgs = [{
	cwd?: string;
	expected: Binary[] | undefined;
	fixture: string;
}];

const verify = test.macro<MacroArgs>(async (t, { cwd, expected, fixture: fixtureName }) => {
	const fixture = await withFixture(t, fixtureName);
	const { readPackageJson } = await withCwd(cwd ? nodePath.join(fixture, cwd) : fixture);

	const _binaries = await readPackageJson();
	const binaries = _binaries?.map(({ name, path }) => ({ name, path }));

	t.deepEqual(binaries, expected);
});

test("returns nothing from empty `bin` field", verify, {
	expected: [],
	fixture: "package-bin-empty",
});

test("returns binary with package name from string `bin` field", verify, {
	expected: [{ name: "foo-cli", path: "foo.js" }],
	fixture: "package-bin-string",
});

test("returns binary from object `bin` field", verify, {
	expected: [{ name: "foo", path: "foo.js" }],
	fixture: "package-bin-object",
});

test("returns binaries from object `bin` field", verify, {
	expected: [{
		name: "foo",
		path: "foo.js",
	}, {
		name: "bar",
		path: "bar.js",
	}],
	fixture: "package-bin-object-multiple",
});

test("searches for nearest `package.json`", verify, {
	cwd: "foo/bar",
	expected: [{ name: "bar-cli", path: "./bar/cli.js" }],
	fixture: "package-nested",
});

test("returns `undefined` when no `package.json` is found", verify, {
	expected: undefined,
	fixture: "package-none",
});
