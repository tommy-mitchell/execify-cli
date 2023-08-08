import path from "node:path";
import type { RequireAllOrNone } from "type-fest";
import test from "ava";
import esmock from "esmock";
import * as tt from "testtriple";
import { readPackageUp } from "read-pkg-up";
import { getFiles as getFilesOriginal } from "../src/helpers.js";
import { atFixture, atFixtureCwd } from "./_test-helpers/util.js";

const stubReadPackageUp = async (stub: () => Promise<any>) => (
	esmock("../src/helpers.ts", {
		"read-pkg-up": {
			readPackageUp: stub,
		},
	}) as typeof import("../src/helpers.js") // eslint-disable-line @typescript-eslint/consistent-type-imports
);

type GetFilesArguments = RequireAllOrNone<{
	/** Resolves relative to `test/fixtures` */
	globs?: string[];
	usePackage: boolean;
	/** Resolves relative to `test/fixtures` if prefixed with a directory */
	fixture: string;
}, "usePackage" | "fixture">;

type ExpectedFiles = {
	files: string[];
};

const verifyFiles = test.macro(async (t, args: GetFilesArguments, { files }: ExpectedFiles) => {
	let getFiles = getFilesOriginal;

	if (args.fixture) {
		({ getFiles } = await stubReadPackageUp(tt.resolves(readPackageUp(atFixtureCwd(args.fixture)))));
	}

	// Map globs and files with a directory component to an absolute fixture path
	const globs = args.globs?.map(glob => atFixture(glob)) ?? [];
	files = files.map(file => path.dirname(file) === "." ? file : atFixture(file));

	const getFileArgs = { globs, usePackage: args.usePackage };
	t.deepEqual(await getFiles(getFileArgs), files, "Files different from expectations!");
});

const expectedGlobFiles = ["globs/cli.js", "globs/cli.ts", "globs/src/cli.js", "globs/src/cli.ts"];

test("resolves globs to respective files", verifyFiles,
	{ globs: ["globs/**/cli.*"] },
	{ files: expectedGlobFiles },
);

test("no globs returns empty array", verifyFiles,
	{ globs: [] },
	{ files: [] },
);

test("usePackage - handles bin as string", verifyFiles,
	{ usePackage: true, fixture: "package-bin-string" },
	{ files: ["foo.js"] },
);

test("usePackage - handles bin as object", verifyFiles,
	{ usePackage: true, fixture: "package-bin-object" },
	{ files: ["foo.js", "bar.js"] },
);

test("usePackage - handles empty bin", verifyFiles,
	{ usePackage: true, fixture: "package-bin-empty" },
	{ files: [] },
);

test("usePackage - errors if no package.json found", async t => {
	const { getFiles } = await stubReadPackageUp(tt.resolves(undefined));

	await t.throwsAsync(
		getFiles({ globs: [], usePackage: true }),
		{ message: "No package.json found." },
	);
});

test("combines resolved globs and package bin", verifyFiles,
	{ globs: ["globs/**/cli.*"], usePackage: true, fixture: "package-bin-object" },
	{ files: [...expectedGlobFiles, "foo.js", "bar.js"] },
);
