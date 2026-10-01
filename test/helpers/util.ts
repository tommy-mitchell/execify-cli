import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ExecutionContext } from "ava";

const atFixture = (name: string) => path.join(import.meta.dirname, "..", "fixtures", name);

/** Makes a temporary directory and registers a teardown to remove it. */
export const withTemporaryDirectory = async (t: ExecutionContext) => {
	// TODO[engine:node@>=24]: use mkdtempDisposable
	// eslint-disable-next-line unicorn/max-nested-calls
	const temporaryDir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "execify-cli-"));

	t.teardown(async () => {
		await fs.rm(temporaryDir, { force: true, recursive: true });
	});

	return temporaryDir;
};

/** Copies a fixture to a temporary directory and returns path to copied fixture. */
export const withFixture = async (t: ExecutionContext, name: string) => {
	const temporaryDir = await withTemporaryDirectory(t);

	const fixture = atFixture(name);
	const isDirectory = !fixture.includes(".");

	if (isDirectory) {
		await fs.cp(fixture, temporaryDir, { recursive: true });
		return temporaryDir;
	}

	const copiedFixture = path.join(temporaryDir, name);
	await fs.copyFile(fixture, copiedFixture);
	return copiedFixture;
};

export const trimLines = (input: string) => input.split("\n").map(line => line.trim()).join("\n");
