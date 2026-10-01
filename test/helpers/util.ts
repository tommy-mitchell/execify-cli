import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExecutionContext } from "ava";
import { $, type Options as ExecaOptions } from "execa";
import { createTag, stripIndentTransformer, trimResultTransformer } from "proper-tags";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const atFixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

export const atFixtureCwd = (name: string): ExecaOptions => ({ cwd: atFixture(name) });

/** Makes a temporary directory and registers a teardown to remove it. */
export const withTemporaryDirectory = async (t: ExecutionContext) => {
	// TODO [engine:node@>=24]: use mkdtempDisposable
	// eslint-disable-next-line unicorn/max-nested-calls
	const temporaryDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "execify-cli-"));

	t.teardown(async () => {
		await fs.rm(temporaryDir, { force: true, recursive: true });
	});

	return temporaryDir;
};

/** Copies a fixture to a temporary directory. Returns path to copied fixture and an `execa` `$` with a `cwd` at the fixture's directory. */
export const withFixture = async (t: ExecutionContext, name: string) => {
	const temporaryDir = await withTemporaryDirectory(t);
	const fixture = path.join(temporaryDir, name);

	const originalFixture = atFixture(name);
	const isDirectory = !originalFixture.includes(".");

	if (isDirectory) {
		await fs.cp(originalFixture, temporaryDir, { recursive: true });
	} else {
		await fs.copyFile(originalFixture, fixture);
	}

	return { $: $({ cwd: path.dirname(fixture) }), fixture };
};

type Tag<ReturnType = string> = {
	(string_: string): ReturnType;
	(literals: TemplateStringsArray, ...placeholders: any[]): ReturnType;
};

export const trimStdout = createTag(
	stripIndentTransformer(),
	trimResultTransformer("smart"),
) as unknown as Tag;

export const splitStdout = createTag(
	trimStdout,
	{ onEndResult: (result: string) => result.split("\n") },
) as unknown as Tag<string[]>;
