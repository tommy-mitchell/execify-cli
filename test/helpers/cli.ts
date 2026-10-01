/* eslint-disable ava/no-ignored-test-files, unicorn/no-top-level-side-effects -- invalid */
import path from "node:path";
import process from "node:process";
import anyTest, { type TestFn } from "ava";
import { Sema } from "async-sema";
import { execa, type ExecaError, parseCommandString } from "execa";
import { getExecutableBinPath } from "get-executable-bin-path";
import type { RequireExactlyOne as OneOf } from "type-fest";
import { trimLines, withFixture } from "./util.ts";

export const test = anyTest as TestFn<{
	binPath: string;
	semaphore: Sema;
}>;

test.before("setup context", async t => {
	t.context.binPath = await getExecutableBinPath({
		map: binPath => binPath.replace("dist", "src").replace(".js", ".ts"),
	});

	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	const concurrency = Number(process.env["concurrency"]) || 5;
	t.log("CLI concurrency:", concurrency);

	t.context.semaphore = new Sema(concurrency);
});

test.beforeEach("setup concurrency", async t => {
	await t.context.semaphore.acquire();
});

test.afterEach.always(t => {
	t.context.semaphore.release();
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const $ = execa({ all: true, env: { NO_COLOR: "1" }, reject: false });

type VerifyCliMacroArgs = [
	OneOf<{
		error: string;
		expected: string;
	}> & {
		args?: string;
		cwd?: string;
		fixture?: string;
	},
];

export const verifyCli = test.macro<VerifyCliMacroArgs>(async (
	t,
	{ args = "", cwd: optCwd = "", error, expected, fixture },
) => {
	const cwd = fixture ? path.join(await withFixture(t, fixture), optCwd) : undefined;
	const resultOrError = await $(t.context.binPath, parseCommandString(args), { cwd });

	if (resultOrError.failed && resultOrError.exitCode === undefined) {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- types are wrong, class is an actual Error instance
		throw resultOrError as ExecaError;
	}

	const { all: output, exitCode } = resultOrError;

	t.is(trimLines(output), trimLines(expected ?? error));
	t.is(exitCode, expected ? 0 : 1, "Process exited with incorrect exit code!");
});
