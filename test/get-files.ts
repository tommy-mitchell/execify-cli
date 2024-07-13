import path from "node:path";
import type { RequireAllOrNone } from "type-fest";
import test from "ava";
import esmock from "esmock";
import * as tt from "testtriple";
import { readPackageUp } from "read-package-up";
import { getFiles as getFilesOriginal } from "../src/helpers.js";
import { atFixture, atFixtureCwd } from "./helpers/util.js";

const stubReadPackageUp = async (stub: () => Promise<any>) => (
	// eslint-disable-next-line @typescript-eslint/consistent-type-imports
	esmock<typeof import("../src/helpers.js")>("../src/helpers.js", {
		"read-package-up": {
			readPackageUp: stub,
		},
	})
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

// dprint-ignore
test("resolves globs to respective files", verifyFiles,
	{ globs: ["globs/**/cli.*"] },
	{ files: expectedGlobFiles },
);

// dprint-ignore
test("no globs returns empty array", verifyFiles,
	{ globs: [] },
	{ files: [] },
);

// dprint-ignore
test("usePackage - handles bin as string", verifyFiles,
	{ usePackage: true, fixture: "package-bin-string" },
	{ files: ["foo.js"] },
);

// dprint-ignore
test("usePackage - handles bin as object", verifyFiles,
	{ usePackage: true, fixture: "package-bin-object" },
	{ files: ["foo.js", "bar.js"] },
);

// dprint-ignore
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

// dprint-ignore
test("combines resolved globs and package bin", verifyFiles,
	{ globs: ["globs/**/cli.*"], usePackage: true, fixture: "package-bin-object" },
	{ files: [...expectedGlobFiles, "foo.js", "bar.js"] },
);
