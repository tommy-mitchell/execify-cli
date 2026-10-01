import { constants as fsConstants, promises as fs } from "node:fs";
import nodePath from "node:path";
import logSymbols from "log-symbols";
import { readPackageUp } from "read-package-up";

export const log = {
	error: (...messages: string[]) => console.log(logSymbols.error, ...messages),
	info: (...messages: string[]) => console.log(logSymbols.info, ...messages),
	success: (...messages: string[]) => console.log(logSymbols.success, ...messages),
	warn: (...messages: string[]) => console.log(logSymbols.warning, ...messages),
};

export type Binary = {
	absolutePath?: string;
	name?: string;
	path: string;
};

type PackageBinary = [
	name: string,
	path: string,
];

const resolveBinary = ([name, path]: PackageBinary, packageJsonPath: string): Binary => ({
	absolutePath: nodePath.resolve(nodePath.dirname(packageJsonPath), path),
	name,
	path,
});

/** Parses all binaries from the nearest `package.json`, returning `undefined` if none exist. */
export const readPackageJson = async (): Promise<Binary[] | undefined> => {
	const maybePackageJson = await readPackageUp();

	if (!maybePackageJson) {
		return;
	}

	const { packageJson, path: packageJsonPath } = maybePackageJson;
	const { bin, name } = packageJson;

	if (!bin) {
		return [];
	}

	return typeof bin === "string"
		? [resolveBinary([name, bin], packageJsonPath)]
		: Object.entries(bin).map(binary => resolveBinary(binary, packageJsonPath));
};

const EXECUTABLE_MASK = fsConstants.S_IXUSR | fsConstants.S_IXGRP | fsConstants.S_IXOTH;

/** Sets the executable bit on a file, if not already set. Returns `true` if the bit was changed, `false` otherwise. */
// eslint-disable-next-line unicorn/consistent-boolean-name
export const setExecutableBit = async (path: string): Promise<boolean> => {
	const stats = await fs.stat(path);

	// Same as 'chmod +x'
	if ((stats.mode & EXECUTABLE_MASK) !== EXECUTABLE_MASK) {
		await fs.chmod(path, stats.mode | EXECUTABLE_MASK);
		return true;
	}

	return false;
};

const SHEBANG_REGEX = /^#!.+/v;

export const hasShebang = async (path: string): Promise<boolean> => {
	const content = await fs.readFile(path, "utf8");
	return SHEBANG_REGEX.test(content);
};
