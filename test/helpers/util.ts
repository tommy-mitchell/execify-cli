import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExecutionContext } from "ava";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const atFixture = (name: string) => path.join(__dirname, "..", "fixtures", name);

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

/** Copies a fixture to a temporary directory and returns path to copied fixture. */
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

	return fixture;
};
